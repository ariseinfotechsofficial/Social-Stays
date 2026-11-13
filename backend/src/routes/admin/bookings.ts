import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { logActivity } from "../../lib/activity.js";
import { requirePermission } from "../../lib/auth.js";
import { HttpError, escapeRegex, notFound, pagination, parse } from "../../lib/http.js";
import { Block, Booking, VillaNight } from "../../models/booking.js";
import { Villa } from "../../models/catalog.js";
import { lockNights, releaseNights } from "../../services/availability.js";
import {
  amountDue,
  approveRequest,
  bookingLink,
  cancelBooking,
  createAdminBooking,
  declineRequest,
  emailGuest,
  issueRefund,
  moveBooking,
  recordManualPayment,
  rejectCancellation,
  suggestedRefund,
} from "../../services/bookings.js";
import { addDays, dayKey, nightsOf, parseDay } from "../../services/dates.js";
import { publicQuote, quoteStay } from "../../services/pricing.js";
import { sendCsv } from "./leads.js";

export const bookingsRouter = Router();

const day = (label: string) =>
  z.string().transform((v, ctx) => {
    const d = parseDay(v);
    if (!d) ctx.addIssue({ code: "custom", message: `Choose a ${label} date` });
    return d as Date;
  });

const NEEDS_ACTION: Record<string, unknown> = { $or: [{ status: "requested" }, { "cancellation.status": "requested" }] };

function filterFrom(query: Record<string, unknown>) {
  const f: Record<string, unknown> = {};
  if (typeof query.status === "string" && query.status) f.status = { $in: query.status.split(",") };
  if (typeof query.villa === "string" && query.villa) f.villa = query.villa;
  if (typeof query.paymentStatus === "string" && query.paymentStatus) f.paymentStatus = query.paymentStatus;
  if (typeof query.source === "string" && query.source) f.source = query.source;
  const from = parseDay(query.from);
  const to = parseDay(query.to);
  if (from || to) f.checkIn = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  if (query.needsAction === "1") Object.assign(f, NEEDS_ACTION);
  if (typeof query.q === "string" && query.q.trim()) {
    const rx = new RegExp(escapeRegex(query.q.trim()), "i");
    f.$and = [{ $or: [{ ref: rx }, { "guest.name": rx }, { "guest.phone": rx }, { "guest.email": rx }, { villaName: rx }] }];
  }
  return f;
}

async function load(id: string) {
  const b = await Booking.findById(id);
  if (!b) throw notFound("Booking not found");
  return b;
}

bookingsRouter.get("/", requirePermission("bookings"), async (req, res) => {
  const { page, limit, skip, sort } = pagination(req.query, { limit: 50, sort: "-createdAt" });
  const filter = filterFrom(req.query);
  const [items, total, counts, needsAction] = await Promise.all([
    Booking.find(filter).sort(sort).skip(skip).limit(limit).select("-timeline -emailLog -notes -pricing.nightly").lean(),
    Booking.countDocuments(filter),
    Booking.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Booking.countDocuments(NEEDS_ACTION),
  ]);
  res.json({ items, total, page, limit, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])), needsAction });
});

bookingsRouter.get("/export.csv", requirePermission("bookings"), async (req, res) => {
  const items = await Booking.find(filterFrom(req.query)).sort("-checkIn").limit(5000).lean();
  sendCsv(
    res,
    `bookings-${new Date().toISOString().slice(0, 10)}.csv`,
    items.map((b) => ({
      ref: b.ref,
      status: b.status,
      villa: b.villaName,
      checkIn: dayKey(b.checkIn),
      checkOut: dayKey(b.checkOut),
      nights: b.nights,
      guests: b.guests,
      guest: b.guest?.name,
      phone: b.guest?.phone,
      email: b.guest?.email,
      total: b.pricing?.total,
      gst: b.pricing?.gst,
      paid: b.amountPaid,
      refunded: b.amountRefunded,
      commission: b.commission?.amount,
      ownerShare: b.commission?.ownerShare,
      coupon: b.pricing?.couponCode ?? "",
      source: b.source,
      created: b.createdAt,
    })),
  );
});

bookingsRouter.get("/:id", requirePermission("bookings"), async (req, res) => {
  const b = await Booking.findById(req.params.id).select("+accessKey").populate("owner", "name email phone").lean();
  if (!b) throw notFound("Booking not found");
  const { accessKey, ...rest } = b;
  res.json({ ...rest, amountDue: amountDue(b), link: bookingLink(b.ref, accessKey), refundPreview: ["confirmed", "awaiting-payment"].includes(b.status) ? await suggestedRefund(b) : null });
});

const StayBody = z.object({
  villa: z.string().min(1),
  checkIn: day("check-in"),
  checkOut: day("check-out"),
  guests: z.coerce.number().int().min(1).max(500),
  addOns: z.array(z.object({ slug: z.string(), qty: z.coerce.number().int().min(1).max(20).optional() })).default([]),
  coupon: z.string().trim().max(40).optional(),
});

bookingsRouter.post("/quote", requirePermission("bookings"), async (req, res) => {
  res.json(publicQuote(await quoteStay(parse(StayBody, req.body), { forAdmin: true })));
});

bookingsRouter.post("/", requirePermission("bookings"), async (req, res) => {
  const body = parse(
    StayBody.extend({
      occasion: z.string().trim().max(80).optional(),
      guest: z.object({
        name: z.string().trim().min(1, "Enter the guest's name"),
        email: z.union([z.email(), z.literal("")]).default(""),
        phone: z.string().trim().min(6, "Enter the guest's phone"),
        city: z.string().trim().optional(),
        note: z.string().trim().optional(),
      }),
      overrideTotal: z.coerce.number().min(0).optional(),
      status: z.enum(["confirmed", "awaiting-payment"]).default("confirmed"),
      payment: z.object({ amount: z.coerce.number().min(0), method: z.enum(["upi", "bank", "cash", "other"]), reference: z.string().optional() }).optional(),
      sendEmail: z.boolean().default(false),
    }),
    req.body,
  );
  const { booking } = await createAdminBooking(body, req.user!.name);
  if (body.payment?.amount) await recordManualPayment(booking, body.payment, { id: req.user!._id, name: req.user!.name });
  if (body.sendEmail && booking.guest?.email) void emailGuest(booking, booking.status === "confirmed" ? "confirmed" : "approved");
  logActivity(req, "create", "booking", { id: booking._id, label: `${booking.ref} · ${booking.villaName}` });
  res.status(201).json(booking.toObject());
});

bookingsRouter.patch("/:id", requirePermission("bookings"), async (req, res) => {
  const body = parse(
    z.object({
      guest: z.object({ name: z.string().trim().min(1), email: z.string().trim(), phone: z.string().trim().min(6), city: z.string().trim(), note: z.string().trim() }).partial().optional(),
      occasion: z.string().trim().optional(),
      guests: z.coerce.number().int().min(1).optional(),
      commissionPercent: z.coerce.number().min(0).max(100).optional(),
    }),
    req.body,
  );
  const b = await load(String(req.params.id));
  if (body.guest) b.guest = { ...b.guest!, ...body.guest } as typeof b.guest;
  if (body.occasion !== undefined) b.occasion = body.occasion;
  if (body.guests) b.guests = body.guests;
  if (body.commissionPercent !== undefined) {
    const base = b.status === "cancelled" ? 0 : (b.pricing?.subtotal ?? 0);
    const amount = Math.round((base * body.commissionPercent) / 100);
    b.commission = { percent: body.commissionPercent, base, amount, ownerShare: base - amount };
  }
  b.timeline.push({ at: new Date(), event: "Details edited", by: req.user!.name });
  await b.save();
  logActivity(req, "update", "booking", { id: b._id, label: b.ref, meta: { fields: Object.keys(body) } });
  res.json(b.toObject());
});

bookingsRouter.post("/:id/approve", requirePermission("bookings"), async (req, res) => {
  const b = await approveRequest(await load(String(req.params.id)), req.user!.name);
  logActivity(req, "approve", "booking", { id: b._id, label: b.ref });
  res.json(b.toObject());
});

bookingsRouter.post("/:id/decline", requirePermission("bookings"), async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().trim().default("") }), req.body);
  const b = await declineRequest(await load(String(req.params.id)), reason, req.user!.name);
  logActivity(req, "decline", "booking", { id: b._id, label: b.ref });
  res.json(b.toObject());
});

bookingsRouter.post("/:id/payments", requirePermission("bookings"), async (req, res) => {
  const body = parse(z.object({ amount: z.coerce.number().positive("Enter the amount received"), method: z.enum(["upi", "bank", "cash", "other"]), reference: z.string().trim().optional(), note: z.string().trim().optional() }), req.body);
  const b = await recordManualPayment(await load(String(req.params.id)), body, { id: req.user!._id, name: req.user!.name });
  logActivity(req, "payment", "booking", { id: b._id, label: `${b.ref} · ₹${body.amount}` });
  res.json(b.toObject());
});

/** Emails the guest their booking link (to pay an approved request or the balance) */
bookingsRouter.post("/:id/send-link", requirePermission("bookings"), async (req, res) => {
  const b = await load(String(req.params.id));
  if (!b.guest?.email) throw new HttpError(422, "This guest has no email. Copy the link and send it on WhatsApp instead.");
  await emailGuest(b, b.status === "confirmed" && amountDue(b) === 0 ? "confirmed" : b.status === "confirmed" ? "payment" : "approved");
  res.json({ ok: true });
});

bookingsRouter.post("/:id/cancel", requirePermission("payments"), async (req, res) => {
  const body = parse(z.object({ refundAmount: z.coerce.number().min(0).default(0), reason: z.string().trim().min(1, "Give a reason") }), req.body);
  const b = await load(String(req.params.id));
  if (body.refundAmount > (b.amountPaid ?? 0) - (b.amountRefunded ?? 0)) throw new HttpError(422, "The refund can't be more than what has been paid");
  const updated = await cancelBooking(b, body, req.user!.name, "admin", req.user!._id);
  logActivity(req, "cancel", "booking", { id: b._id, label: `${b.ref} · refund ₹${body.refundAmount}` });
  res.json(updated.toObject());
});

bookingsRouter.post("/:id/cancellation/reject", requirePermission("payments"), async (req, res) => {
  const { reason } = parse(z.object({ reason: z.string().trim().default("") }), req.body);
  const b = await rejectCancellation(await load(String(req.params.id)), reason, req.user!.name);
  logActivity(req, "reject-cancellation", "booking", { id: b._id, label: b.ref });
  res.json(b.toObject());
});

bookingsRouter.post("/:id/refund", requirePermission("payments"), async (req, res) => {
  const body = parse(z.object({ amount: z.coerce.number().positive(), reason: z.string().trim().min(1, "Give a reason") }), req.body);
  const b = await load(String(req.params.id));
  const done = await issueRefund(b, body.amount, body.reason, req.user!.name, req.user!._id);
  logActivity(req, "refund", "booking", { id: b._id, label: `${b.ref} · ₹${done}` });
  res.json(b.toObject());
});

bookingsRouter.post("/:id/move", requirePermission("bookings"), async (req, res) => {
  const body = parse(z.object({ checkIn: day("check-in"), checkOut: day("check-out"), reprice: z.boolean().default(false) }), req.body);
  const b = await moveBooking(await load(String(req.params.id)), body.checkIn, body.checkOut, req.user!.name, body.reprice);
  logActivity(req, "move", "booking", { id: b._id, label: b.ref });
  res.json(b.toObject());
});

bookingsRouter.post("/:id/notes", requirePermission("bookings"), async (req, res) => {
  const { text } = parse(z.object({ text: z.string().trim().min(1, "Write a note") }), req.body);
  const b = await load(String(req.params.id));
  b.notes.push({ text, by: req.user!._id, byName: req.user!.name });
  await b.save();
  res.status(201).json(b.toObject());
});

/* ---------- Calendar and date blocks ---------- */

export const calendarRouter = Router();

/** Every booked, held or blocked night in a range, for the availability calendar */
export async function calendarEntries(villaIds: Types.ObjectId[] | null, from: Date, to: Date) {
  const now = new Date();
  const nights = await VillaNight.find({
    ...(villaIds ? { villa: { $in: villaIds } } : {}),
    date: { $gte: from, $lt: to },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .populate("booking", "ref status guest.name guests")
    .populate("block", "reason note from to createdByName")
    .lean();
  return nights.map((n) => {
    const b = n.booking as unknown as { _id: string; ref: string; status: string; guest?: { name: string }; guests: number } | null;
    const k = n.block as unknown as { _id: string; reason: string; note: string; createdByName?: string } | null;
    return {
      villa: String(n.villa),
      date: dayKey(n.date),
      kind: n.kind,
      held: Boolean(n.expiresAt),
      booking: b ? { id: String(b._id), ref: b.ref, status: b.status, guest: b.guest?.name, guests: b.guests } : null,
      block: k ? { id: String(k._id), reason: k.reason, note: k.note, by: k.createdByName } : null,
    };
  });
}

calendarRouter.get("/", requirePermission("bookings"), async (req, res) => {
  const from = parseDay(req.query.from) ?? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const to = parseDay(req.query.to) ?? addDays(from, 42);
  const villaFilter = typeof req.query.villa === "string" && req.query.villa ? [new Types.ObjectId(req.query.villa)] : null;
  const villas = await Villa.find(villaFilter ? { _id: { $in: villaFilter } } : { status: { $in: ["live", "coming-soon"] } })
    .sort("order")
    .select("name slug status")
    .lean();
  res.json({ from: dayKey(from), to: dayKey(to), villas, entries: await calendarEntries(villas.map((v) => v._id), from, to) });
});

export const BlockBody = z.object({
  villa: z.string().min(1),
  /** First and last night blocked, inclusive */
  from: day("first"),
  to: day("last"),
  reason: z.enum(["owner", "maintenance", "offline-booking", "other"]).default("other"),
  note: z.string().trim().max(500).default(""),
});

export async function createBlock(input: z.infer<typeof BlockBody>, by: { _id: Types.ObjectId; name: string }) {
  if (input.to < input.from) throw new HttpError(422, "The last night must be on or after the first");
  const nights = nightsOf(input.from, addDays(input.to, 1));
  if (nights.length > 366) throw new HttpError(422, "Block up to a year at a time");
  const block = new Block({ ...input, createdBy: by._id, createdByName: by.name });
  await lockNights(input.villa, nights, { block: block._id });
  try {
    await block.save();
  } catch (err) {
    await releaseNights({ block: block._id });
    throw err;
  }
  return block;
}

calendarRouter.get("/blocks", requirePermission("bookings"), async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.villa === "string" && req.query.villa) filter.villa = req.query.villa;
  const items = await Block.find(filter).sort("-from").limit(200).populate("villa", "name slug").lean();
  res.json({ items });
});

calendarRouter.post("/blocks", requirePermission("bookings"), async (req, res) => {
  const block = await createBlock(parse(BlockBody, req.body), req.user!);
  logActivity(req, "create", "date block", { id: block._id, label: `${dayKey(block.from)} – ${dayKey(block.to)}` });
  res.status(201).json(block.toObject());
});

calendarRouter.delete("/blocks/:id", requirePermission("bookings"), async (req, res) => {
  const block = await Block.findById(req.params.id);
  if (!block) throw notFound();
  await releaseNights({ block: block._id });
  await block.deleteOne();
  logActivity(req, "delete", "date block", { id: block._id, label: `${dayKey(block.from)} – ${dayKey(block.to)}` });
  res.json({ ok: true });
});
