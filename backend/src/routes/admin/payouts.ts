import { Router } from "express";
import { z } from "zod";
import { logActivity } from "../../lib/activity.js";
import { requirePermission } from "../../lib/auth.js";
import { HttpError, notFound, parse } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { Booking, ListingRequest, Payout } from "../../models/booking.js";
import { Villa } from "../../models/catalog.js";
import { User } from "../../models/users.js";

/* ---------- Owner payouts ---------- */

export const payoutsRouter = Router();
payoutsRouter.use(requirePermission("payouts"));

const monthRange = (month: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new HttpError(422, "Choose a month");
  const start = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  const end = new Date(Date.UTC(Number(m[1]), Number(m[2]), 1));
  return { start, end };
};

/** Stays that checked in during the month, still owed to the owner */
async function payableBookings(owner: string, month: string) {
  const { start, end } = monthRange(month);
  return Booking.find({ owner, checkIn: { $gte: start, $lt: end }, status: { $in: ["confirmed", "completed"] }, payout: { $exists: false } })
    .sort("checkIn")
    .select("ref villaName checkIn checkOut nights guests guest.name pricing.subtotal pricing.total commission amountPaid status")
    .lean();
}

payoutsRouter.get("/", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.owner === "string" && req.query.owner) filter.owner = req.query.owner;
  if (typeof req.query.status === "string" && req.query.status) filter.status = req.query.status;
  const items = await Payout.find(filter).sort("-period").limit(300).lean();
  const owed = await Booking.aggregate([
    { $match: { owner: { $exists: true }, status: { $in: ["confirmed", "completed"] }, payout: { $exists: false } } },
    { $group: { _id: "$owner", amount: { $sum: "$commission.ownerShare" }, bookings: { $sum: 1 } } },
  ]);
  const owners = await User.find({ _id: { $in: owed.map((o) => o._id) } }).select("name").lean();
  res.json({ items, owed: owed.map((o) => ({ owner: o._id, ownerName: owners.find((u) => String(u._id) === String(o._id))?.name ?? "", amount: o.amount, bookings: o.bookings })) });
});

payoutsRouter.get("/preview", async (req, res) => {
  const { owner, month } = parse(z.object({ owner: z.string().min(1), month: z.string() }), req.query);
  const bookings = await payableBookings(owner, month);
  res.json({ bookings, gross: bookings.reduce((s, b) => s + (b.commission?.base ?? 0), 0), commission: bookings.reduce((s, b) => s + (b.commission?.amount ?? 0), 0), amount: bookings.reduce((s, b) => s + (b.commission?.ownerShare ?? 0), 0) });
});

payoutsRouter.post("/", async (req, res) => {
  const { owner, month } = parse(z.object({ owner: z.string().min(1), month: z.string() }), req.body);
  const user = await User.findById(owner).select("name role").lean();
  if (!user || user.role !== "owner") throw new HttpError(422, "Choose an owner account");
  const bookings = await payableBookings(owner, month);
  if (!bookings.length) throw new HttpError(422, "No stays to pay out for that month");
  const { start } = monthRange(month);
  const existing = await Payout.findOne({ owner, period: start });
  if (existing && existing.status === "paid") throw new HttpError(409, "That month is already paid out. Add a new month instead.");
  const payout =
    existing ??
    new Payout({ owner, ownerName: user.name, period: start, bookings: [], gross: 0, commission: 0, amount: 0 });
  payout.bookings.push(...bookings.map((b) => b._id));
  payout.gross += bookings.reduce((s, b) => s + (b.commission?.base ?? 0), 0);
  payout.commission += bookings.reduce((s, b) => s + (b.commission?.amount ?? 0), 0);
  payout.amount += bookings.reduce((s, b) => s + (b.commission?.ownerShare ?? 0), 0);
  await payout.save();
  await Booking.updateMany({ _id: { $in: bookings.map((b) => b._id) } }, { $set: { payout: payout._id } });
  logActivity(req, "create", "payout", { id: payout._id, label: `${user.name} · ${month} · ₹${payout.amount}` });
  res.status(201).json(payout.toObject());
});

payoutsRouter.get("/:id", async (req, res) => {
  const p = await Payout.findById(req.params.id).populate("bookings", "ref villaName checkIn checkOut nights guest.name commission pricing.total").lean();
  if (!p) throw notFound();
  res.json(p);
});

payoutsRouter.patch("/:id", async (req, res) => {
  const body = parse(z.object({ status: z.enum(["pending", "paid"]), method: z.string().trim().optional(), reference: z.string().trim().optional(), note: z.string().trim().optional() }), req.body);
  const p = await Payout.findById(req.params.id);
  if (!p) throw notFound();
  p.set({ ...body, paidAt: body.status === "paid" ? (p.paidAt ?? new Date()) : undefined });
  await p.save();
  logActivity(req, body.status === "paid" ? "mark-paid" : "update", "payout", { id: p._id, label: `${p.ownerName} · ₹${p.amount}` });
  res.json(p.toObject());
});

payoutsRouter.delete("/:id", async (req, res) => {
  const p = await Payout.findById(req.params.id);
  if (!p) throw notFound();
  if (p.status === "paid") throw new HttpError(422, "Paid payouts can't be deleted");
  await Booking.updateMany({ payout: p._id }, { $unset: { payout: 1 } });
  await p.deleteOne();
  logActivity(req, "delete", "payout", { id: p._id, label: p.ownerName ?? "" });
  res.json({ ok: true });
});

/* ---------- Owner listing edit requests ---------- */

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
