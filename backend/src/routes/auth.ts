import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { logActivity } from "../lib/activity.js";
import { ROLE_PERMISSIONS, clearSession, issueSession, requireAuth } from "../lib/auth.js";
import { HttpError, parse } from "../lib/http.js";
import { Villa } from "../models/catalog.js";
import { User, type Role } from "../models/users.js";

export const authRouter = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many attempts. Try again in a few minutes." } });

async function profile(userId: string) {
  const user = await User.findById(userId).select("name email phone role villas lastLoginAt").lean();
  if (!user) throw new HttpError(401, "Please sign in");
  const villas = user.role === "owner" ? await Villa.find({ _id: { $in: user.villas } }).select("name slug").lean() : [];
  return { ...user, villas, permissions: ROLE_PERMISSIONS[user.role as Role] };
}

authRouter.post("/login", loginLimiter, async (req, res) => {
  const body = parse(z.object({ email: z.string().trim().toLowerCase(), password: z.string().min(1) }), req.body);
  const user = await User.findOne({ email: body.email }).select("+passwordHash name role active tokenVersion");
  // Same message and similar timing whether the email exists or not
  const ok = await bcrypt.compare(body.password, user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!user || !ok) throw new HttpError(401, "That email and password don't match");
  if (!user.active) throw new HttpError(403, "This account has been switched off. Ask a Super Admin.");
  user.lastLoginAt = new Date();
  await user.save();
  issueSession(res, user);
  req.user = { _id: user._id, id: String(user._id), name: user.name, email: body.email, role: user.role as Role, villas: [], permissions: [] };
  logActivity(req, "login", "user", { id: user._id, label: user.name });
  res.json(await profile(String(user._id)));
});

authRouter.post("/logout", (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json(await profile(req.user!.id));
});

authRouter.patch("/me", requireAuth, async (req, res) => {
  const body = parse(
    z.object({
      name: z.string().trim().min(1).optional(),
      phone: z.string().trim().optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8, "Use at least 8 characters").optional(),
    }),
    req.body,
  );
  const user = await User.findById(req.user!.id).select("+passwordHash");
  if (!user) throw new HttpError(401, "Please sign in");
  if (body.name) user.name = body.name;
  if (body.phone !== undefined) user.phone = body.phone;
  if (body.newPassword) {
    if (!body.currentPassword || !(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
      throw new HttpError(422, "Your current password is not right", { currentPassword: ["Your current password is not right"] });
    }
    user.passwordHash = await bcrypt.hash(body.newPassword, 11);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  }
  await user.save();
  if (body.newPassword) issueSession(res, user);
  logActivity(req, "update", "profile", { id: user._id, label: user.name });
  res.json(await profile(String(user._id)));
});
