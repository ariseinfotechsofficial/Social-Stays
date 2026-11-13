import { Router } from "express";
import { logActivity } from "../../lib/activity.js";
import { can, requirePermission } from "../../lib/auth.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { Settings, getSettings } from "../../models/settings.js";
import { cleanBody } from "./crud.js";

export const settingsRouter = Router();

settingsRouter.get("/", requirePermission("settings", "booking-settings"), async (_req, res) => {
  res.json(await getSettings());
});

settingsRouter.put("/", requirePermission("settings", "booking-settings"), async (req, res) => {
  const body = cleanBody(req.body);
  delete body.key;
  // Each half of the settings needs its own permission
  if (!can(req.user, "booking-settings")) delete body.booking;
  if (!can(req.user, "settings")) for (const k of Object.keys(body)) if (k !== "booking") delete body[k];

  await getSettings();
  const doc = await Settings.findOne({ key: "site" });
  doc!.set(body);
  await doc!.save();
  logActivity(req, "update", "settings", { label: "Site settings", meta: { sections: Object.keys(body) } });
  revalidateSite();
  res.json(doc!.toObject());
});
