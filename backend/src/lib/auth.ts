import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import { env } from "../config/env.js";
import { User, type Role } from "../models/users.js";
import { HttpError, forbidden } from "./http.js";

export const SESSION_COOKIE = "ss_session";
const SESSION_DAYS = 7;

/**
 * What each role may do. Owners have no staff permissions; their routes are scoped to their own villas.
 * Mirrored in admin/src/lib/permissions.ts to shape the navigation.
 */
export const PERMISSIONS = [
  "content",
  "catalog",
  "media",
  "settings",
  "leads",
  "calendar",
  "users",
  "owners",
  "activity",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  superadmin: PERMISSIONS,
  editor: ["content", "catalog", "media", "settings", "leads"],
  sales: ["leads", "calendar", "media"],
  owner: [],
};

export type SessionUser = {
  _id: Types.ObjectId;
  id: string;
  name: string;
  email: string;
  role: Role;
  villas: Types.ObjectId[];
  permissions: readonly Permission[];
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function issueSession(res: Response, user: { _id: Types.ObjectId; tokenVersion?: number | null }) {
  const token = jwt.sign({ sub: String(user._id), v: user.tokenVersion ?? 0 }, env.JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
  return token;
}

export const clearSession = (res: Response) => res.clearCookie(SESSION_COOKIE, { path: "/" });

function readToken(req: Request) {
  const cookie = req.cookies?.[SESSION_COOKIE];
  if (cookie) return cookie as string;
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

/** Loads the signed-in user, or responds 401. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) throw new HttpError(401, "Please sign in");
  let payload: { sub: string; v: number };
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as typeof payload;
  } catch {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
  const user = await User.findById(payload.sub).select("name email role villas active tokenVersion").lean();
  if (!user || !user.active || (user.tokenVersion ?? 0) !== payload.v) throw new HttpError(401, "Please sign in");
  req.user = {
    _id: user._id,
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as Role,
    villas: (user.villas ?? []) as Types.ObjectId[],
    permissions: ROLE_PERMISSIONS[user.role as Role],
  };
  next();
}

export const can = (user: SessionUser | undefined, permission: Permission) => Boolean(user?.permissions.includes(permission));

/** Any of the listed permissions grants access. */
export const requirePermission =
  (...permissions: Permission[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!permissions.some((p) => can(req.user, p))) throw forbidden();
    next();
  };

/** Every staff role (not owners). */
export const requireStaff = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role === "owner") throw forbidden();
  next();
};

export const requireOwner = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== "owner") throw forbidden();
  next();
};
