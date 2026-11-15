import { Router } from "express";
import { logActivity } from "../../lib/activity.js";
import { requirePermission } from "../../lib/auth.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { Settings, getSettings } from "../../models/settings.js";
import { cleanBody } from "./crud.js";

export const settingsRouter = Router();

settingsRouter.get("/", requirePermission("settings"), async (_req, res) => {
  res.json(await getSettings());
});

settingsRouter.put("/", requirePermission("settings"), async (req, res) => {
  const body = cleanBody(req.body);
  delete body.key;

  await getSettings();
  const doc = await Settings.findOne({ key: "site" });
  doc!.set(body);
  await doc!.save();
  logActivity(req, "update", "settings", { label: "Site settings", meta: { sections: Object.keys(body) } });
  revalidateSite();
  res.json(doc!.toObject());
});
