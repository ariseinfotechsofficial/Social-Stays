import bcrypt from "bcryptjs";
import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { logActivity } from "../../lib/activity.js";
import { requirePermission } from "../../lib/auth.js";
import { HttpError, escapeRegex, notFound, parse } from "../../lib/http.js";
import { Villa } from "../../models/catalog.js";
import { ROLES, User } from "../../models/users.js";

export const usersRouter = Router();

const UserBody = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  phone: z.string().trim().default(""),
  role: z.enum(ROLES),
  villas: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  password: z.string().min(8, "Use at least 8 characters").optional(),
});

/** Owners' villa list is the source of truth; keep each villa's `owner` field in step with it. */
async function syncVillaOwners(userId: Types.ObjectId, villaIds: string[]) {
  await Villa.updateMany({ owner: userId, _id: { $nin: villaIds } }, { $unset: { owner: 1 } });
  if (villaIds.length) {
    // A villa has one owner account: take it off anyone else first
    await User.updateMany({ _id: { $ne: userId }, villas: { $in: villaIds } }, { $pull: { villas: { $in: villaIds } } });
    await Villa.updateMany({ _id: { $in: villaIds } }, { $set: { owner: userId } });
  }
}

usersRouter.get("/", requirePermission("users", "owners"), async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.role === "string" && req.query.role) filter.role = req.query.role;
  // Owner managers only see owners
  if (!req.user!.permissions.includes("users")) filter.role = "owner";
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    const rx = new RegExp(escapeRegex(req.query.q.trim()), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const items = await User.find(filter).sort("role name").populate("villas", "name slug").lean();
  res.json({ items, total: items.length });
});

usersRouter.get("/:id", requirePermission("users", "owners"), async (req, res) => {
  const user = await User.findById(req.params.id).populate("villas", "name slug").lean();
  if (!user) throw notFound();
  if (!req.user!.permissions.includes("users") && user.role !== "owner") throw notFound();
  res.json(user);
});

usersRouter.post("/", requirePermission("users", "owners"), async (req, res) => {
  const body = parse(UserBody, req.body);
  if (!req.user!.permissions.includes("users") && body.role !== "owner") throw new HttpError(403, "You can only add owner accounts");
  if (!body.password) throw new HttpError(422, "Set a password", { password: ["Set a password"] });
  const user = await User.create({ ...body, villas: body.role === "owner" ? body.villas : [], passwordHash: await bcrypt.hash(body.password, 11) });
  if (user.role === "owner") await syncVillaOwners(user._id, body.villas);
  logActivity(req, "create", "user", { id: user._id, label: `${user.name} (${user.role})` });
  const { passwordHash: _omit, ...safe } = user.toObject();
  res.status(201).json(safe);
});

usersRouter.patch("/:id", requirePermission("users", "owners"), async (req, res) => {
  const body = parse(UserBody.partial(), req.body);
  const user = await User.findById(req.params.id);
  if (!user) throw notFound();
  const manager = req.user!.permissions.includes("users");
  if (!manager && (user.role !== "owner" || (body.role && body.role !== "owner"))) throw new HttpError(403, "You can only edit owner accounts");
  if (String(user._id) === req.user!.id && ((body.role && body.role !== user.role) || body.active === false)) {
    throw new HttpError(422, "You can't change your own role or switch off your own account");
  }
  const { password, ...rest } = body;
  user.set(rest);
  if (password) {
    user.passwordHash = await bcrypt.hash(password, 11);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  }
  if (user.role !== "owner") user.villas = [];
  await user.save();
  await syncVillaOwners(user._id, user.role === "owner" ? user.villas.map(String) : []);
  logActivity(req, "update", "user", { id: user._id, label: user.name, meta: { fields: Object.keys(body).filter((k) => k !== "password"), passwordReset: Boolean(password) } });
  const { passwordHash: _omit, ...safe } = user.toObject();
  res.json(safe);
});

usersRouter.delete("/:id", requirePermission("users"), async (req, res) => {
  if (req.params.id === req.user!.id) throw new HttpError(422, "You can't delete your own account");
  const user = await User.findById(req.params.id);
  if (!user) throw notFound();
  if (user.role === "superadmin" && (await User.countDocuments({ role: "superadmin", active: true })) <= 1) {
    throw new HttpError(422, "Keep at least one Super Admin");
  }
  await syncVillaOwners(user._id, []);
  await user.deleteOne();
  logActivity(req, "delete", "user", { id: user._id, label: user.name });
  res.json({ ok: true });
});
