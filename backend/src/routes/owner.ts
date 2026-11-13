import { Router } from "express";
import type { Types } from "mongoose";
import { z } from "zod";
import { logActivity } from "../lib/activity.js";
import { requireAuth, requireOwner } from "../lib/auth.js";
import { HttpError, notFound, parse } from "../lib/http.js";
import { Block, Booking, ListingRequest, Payout } from "../models/booking.js";
import { Villa } from "../models/catalog.js";
import { releaseNights } from "../services/availability.js";
import { addDays, dayKey, monthStart, parseDay, todayIST } from "../services/dates.js";
import { BlockBody, calendarEntries, createBlock } from "./admin/bookings.js";
import { OWNER_EDITABLE } from "./admin/payouts.js";

/** The owner dashboard: everything is limited to the villas on the owner's account. */
export const ownerRouter = Router();
ownerRouter.use(requireAuth, requireOwner);

const mine = (villas: Types.ObjectId[]) => ({ villa: { $in: villas } });

function assertOwns(villas: Types.ObjectId[], villaId: unknown) {
  if (!villas.some((v) => String(v) === String(villaId))) throw new HttpError(403, "That villa isn't on your account");
}

/** What owners see of a booking: enough to host, nothing about how the guest paid */
const ownerView = (b: Record<string, any>) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
  _id: b._id,
  ref: b.ref,
  status: b.status,
  villaName: b.villaName,
  checkIn: b.checkIn,
  checkOut: b.checkOut,
  nights: b.nights,
  guests: b.guests,
  occasion: b.occasion,
  guest: { name: b.guest?.name, city: b.guest?.city, phone: ["confirmed", "completed"].includes(b.status) ? b.guest?.phone : undefined, note: b.guest?.note },
  addOns: (b.addOns ?? []).map((a: { title: string; qty: number }) => ({ title: a.title, qty: a.qty })),
  earnings: { gross: b.commission?.base ?? 0, commission: b.commission?.amount ?? 0, share: b.commission?.ownerShare ?? 0, percent: b.commission?.percent ?? 0 },
  paidOut: Boolean(b.payout),
});

ownerRouter.get("/dashboard", async (req, res) => {
  const villas = req.user!.villas;
  const today = todayIST();
  const [upcoming, thisMonth, owed, paid] = await Promise.all([
    Booking.find({ ...mine(villas), status: "confirmed", checkIn: { $gte: today } }).sort("checkIn").limit(10).lean(),
    Booking.aggregate([
      { $match: { villa: { $in: villas }, status: { $in: ["confirmed", "completed"] }, checkIn: { $gte: monthStart(today), $lt: monthStart(addDays(monthStart(today), 32)) } } },
      { $group: { _id: null, share: { $sum: "$commission.ownerShare" }, nights: { $sum: "$nights" }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { villa: { $in: villas }, status: { $in: ["confirmed", "completed"] }, payout: { $exists: false } } },
      { $group: { _id: null, share: { $sum: "$commission.ownerShare" } } },
    ]),
    Payout.aggregate([{ $match: { owner: req.user!._id, status: "paid" } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]),
  ]);
  res.json({
    upcoming: upcoming.map(ownerView),
    month: { share: thisMonth[0]?.share ?? 0, nights: thisMonth[0]?.nights ?? 0, bookings: thisMonth[0]?.count ?? 0 },
    owed: owed[0]?.share ?? 0,
    paidToDate: paid[0]?.amount ?? 0,
  });
});

ownerRouter.get("/villas", async (req, res) => {
  const villas = await Villa.find({ _id: { $in: req.user!.villas } })
    .select(["name", "slug", "status", "commissionPercent", ...OWNER_EDITABLE].join(" "))
    .populate("destination", "name")
    .lean();
  res.json({ items: villas });
});

ownerRouter.get("/bookings", async (req, res) => {
  const filter: Record<string, unknown> = { ...mine(req.user!.villas), status: { $in: ["confirmed", "completed", "cancelled", "awaiting-payment"] } };
  if (req.query.when === "upcoming") filter.checkIn = { $gte: todayIST() };
  if (req.query.when === "past") filter.checkIn = { $lt: todayIST() };
  const items = await Booking.find(filter).sort(req.query.when === "past" ? "-checkIn" : "checkIn").limit(300).lean();
  res.json({ items: items.map(ownerView) });
});

ownerRouter.get("/calendar", async (req, res) => {
  const from = parseDay(req.query.from) ?? monthStart(todayIST());
  const to = parseDay(req.query.to) ?? addDays(from, 42);
  const villas = await Villa.find({ _id: { $in: req.user!.villas } }).select("name slug status").lean();
  const entries = (await calendarEntries(req.user!.villas, from, to)).map((e) => ({
    ...e,
    // Owners see who is staying, not the internal booking flow
    booking: e.booking ? { id: e.booking.id, ref: e.booking.ref, status: e.booking.status, guest: e.booking.guest, guests: e.booking.guests } : null,
  }));
  res.json({ from: dayKey(from), to: dayKey(to), villas, entries });
});

ownerRouter.get("/blocks", async (req, res) => {
  const items = await Block.find(mine(req.user!.villas)).sort("-from").limit(200).populate("villa", "name").lean();
  res.json({ items });
});

ownerRouter.post("/blocks", async (req, res) => {
  const body = parse(BlockBody, { ...req.body, reason: "owner" });
  assertOwns(req.user!.villas, body.villa);
  if (body.from < todayIST()) throw new HttpError(422, "Choose dates from today onwards");
  const block = await createBlock(body, req.user!);
  logActivity(req, "create", "date block", { id: block._id, label: `Owner block ${dayKey(block.from)} – ${dayKey(block.to)}` });
  res.status(201).json(block.toObject());
});

ownerRouter.delete("/blocks/:id", async (req, res) => {
  const block = await Block.findById(req.params.id);
  if (!block) throw notFound();
  assertOwns(req.user!.villas, block.villa);
  // Owners can lift their own blocks; maintenance or offline-booking blocks stay with the team
  if (block.reason !== "owner") throw new HttpError(403, "Ask the Social Stays team to lift this block");
  await releaseNights({ block: block._id });
  await block.deleteOne();
  logActivity(req, "delete", "date block", { id: block._id });
  res.json({ ok: true });
});

ownerRouter.get("/payouts", async (req, res) => {
  const items = await Payout.find({ owner: req.user!._id }).sort("-period").lean();
  res.json({ items });
});

ownerRouter.get("/payouts/:id", async (req, res) => {
  const p = await Payout.findOne({ _id: req.params.id, owner: req.user!._id }).lean();
  if (!p) throw notFound();
  const bookings = await Booking.find({ _id: { $in: p.bookings } }).sort("checkIn").lean();
  res.json({ ...p, bookings: bookings.map(ownerView) });
});

ownerRouter.get("/listing-requests", async (req, res) => {
  const items = await ListingRequest.find({ owner: req.user!._id }).sort("-createdAt").populate("villa", "name").lean();
  res.json({ items });
});

const Image = z.object({ src: z.string(), width: z.number().optional(), height: z.number().optional(), alt: z.string().default(""), blur: z.string().optional(), media: z.string().optional() });

ownerRouter.post("/listing-requests", async (req, res) => {
  const body = parse(
    z.object({
      villa: z.string(),
      message: z.string().trim().max(2000).default(""),
      changes: z
        .object({
          tagline: z.string(),
          summary: z.string(),
          description: z.array(z.string()),
          highlights: z.array(z.string()),
          rooms: z.array(z.object({ name: z.string(), beds: z.string(), note: z.string().optional() })),
          meals: z.string(),
          houseRules: z.array(z.string()),
          checkIn: z.string(),
          checkOut: z.string(),
          priceFrom: z.coerce.number().min(0),
          weekendPrice: z.coerce.number().min(0),
          photos: z.array(Image),
          host: z.object({ name: z.string(), note: z.string() }),
        })
        .partial(),
    }),
    req.body,
  );
  assertOwns(req.user!.villas, body.villa);
  if (!Object.keys(body.changes).length && !body.message) throw new HttpError(422, "Change something or write a message");
  const r = await ListingRequest.create({ villa: body.villa, owner: req.user!._id, ownerName: req.user!.name, changes: body.changes, message: body.message });
  logActivity(req, "create", "listing request", { id: r._id, label: Object.keys(body.changes).join(", ") || "message" });
  res.status(201).json(r.toObject());
});
