import type { Request } from "express";
import { Activity } from "../models/users.js";

/** Records who changed what. Never blocks or fails the request. */
export function logActivity(
  req: Request,
  action: string,
  entity: string,
  target?: { id?: unknown; label?: string; meta?: unknown },
) {
  Activity.create({
    user: req.user?._id,
    userName: req.user?.name,
    action,
    entity,
    entityId: target?.id ? String(target.id) : undefined,
    label: target?.label,
    meta: target?.meta,
  }).catch((err) => console.warn("[activity] could not log", err.message));
}
