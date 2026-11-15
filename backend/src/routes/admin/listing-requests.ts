import { Router } from "express";
import { z } from "zod";
import { logActivity } from "../../lib/activity.js";
import { requirePermission } from "../../lib/auth.js";
import { HttpError, notFound, parse } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { ListingRequest } from "../../models/calendar.js";
import { Villa } from "../../models/catalog.js";

/** Owner listing edit requests: owners propose changes, the team approves them onto the villa. */
export const listingRequestsRouter = Router();
listingRequestsRouter.use(requirePermission("owners", "catalog"));

/** Fields owners may propose changes to */
export const OWNER_EDITABLE = ["tagline", "summary", "description", "highlights", "rooms", "meals", "houseRules", "checkIn", "checkOut", "priceFrom", "weekendPrice", "photos", "host"] as const;

listingRequestsRouter.get("/", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === "string" && req.query.status) filter.status = req.query.status;
  const items = await ListingRequest.find(filter).sort("-createdAt").limit(200).populate("villa", "name slug").lean();
  res.json({ items, pending: await ListingRequest.countDocuments({ status: "pending" }) });
});

listingRequestsRouter.get("/:id", async (req, res) => {
  const r = await ListingRequest.findById(req.params.id).lean();
  if (!r) throw notFound();
  const villa = await Villa.findById(r.villa).select(["name", "slug", ...OWNER_EDITABLE].join(" ")).lean();
  res.json({ ...r, current: villa });
});

listingRequestsRouter.post("/:id/approve", async (req, res) => {
  const { fields, note } = parse(z.object({ fields: z.array(z.string()).optional(), note: z.string().trim().default("") }), req.body);
  const r = await ListingRequest.findById(req.params.id);
  if (!r || r.status !== "pending") throw new HttpError(422, "This request has already been handled");
  const changes = r.changes as Record<string, unknown>;
  const apply = Object.fromEntries(Object.entries(changes).filter(([k]) => (OWNER_EDITABLE as readonly string[]).includes(k) && (!fields || fields.includes(k))));
  const villa = await Villa.findById(r.villa);
  if (!villa) throw notFound("Villa not found");
  villa.set(apply);
  await villa.save();
  r.set({ status: "approved", reviewedByName: req.user!.name, reviewNote: note, reviewedAt: new Date() });
  await r.save();
  logActivity(req, "approve", "listing request", { id: r._id, label: `${villa.name}: ${Object.keys(apply).join(", ")}` });
  revalidateSite();
  res.json(r.toObject());
});

listingRequestsRouter.post("/:id/reject", async (req, res) => {
  const { note } = parse(z.object({ note: z.string().trim().default("") }), req.body);
  const r = await ListingRequest.findById(req.params.id);
  if (!r || r.status !== "pending") throw new HttpError(422, "This request has already been handled");
  r.set({ status: "rejected", reviewedByName: req.user!.name, reviewNote: note, reviewedAt: new Date() });
  await r.save();
  logActivity(req, "reject", "listing request", { id: r._id });
  res.json(r.toObject());
});
