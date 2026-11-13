import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { HttpError, notFound, parse } from "../../lib/http.js";
import { verifyCheckoutSignature } from "../../lib/razorpay.js";
import { Booking } from "../../models/booking.js";
import { Villa } from "../../models/catalog.js";
import { unavailableNights } from "../../services/availability.js";
import { addDays, dayKey, parseDay, todayIST } from "../../services/dates.js";
import { publicQuote, quoteStay } from "../../services/pricing.js";
import { createWebsiteBooking, guestView, markRazorpayPaid, requestCancellation, startPayment, suggestedRefund } from "../../services/bookings.js";

export const bookingPublicRouter = Router();

const quoteLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many requests. Please slow down." } });
const bookLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 15, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many booking attempts. Please try again shortly." } });

const day = (label: string) =>
  z.string().transform((v, ctx) => {
    const d = parseDay(v);
    if (!d) ctx.addIssue({ code: "custom", message: `Choose a ${label} date` });
    return d as Date;
  });

const StayBody = z.object({
  villa: z.string().min(1),
  checkIn: day("check-in"),
  checkOut: day("check-out"),
  guests: z.coerce.number().int().min(1).max(500),
  addOns: z.array(z.object({ slug: z.string(), qty: z.coerce.number().int().min(1).max(20).optional() })).max(20).default([]),
  coupon: z.string().trim().max(40).optional(),
  payFull: z.boolean().optional(),
});

/** Booked and blocked nights for the calendar, plus the minimum stay */
bookingPublicRouter.get("/villas/:slug/availability", quoteLimiter, async (req, res) => {
  const villa = await Villa.findOne({ slug: req.params.slug, status: { $in: ["live", "coming-soon"] } }).select("minNights").lean();
  if (!villa) throw notFound("We couldn't find that villa");
  const from = parseDay(req.query.from) ?? todayIST();
  const to = parseDay(req.query.to) ?? addDays(from, 180);
  if (to <= from || to.getTime() - from.getTime() > 400 * 86_400_000) throw new HttpError(400, "Ask for up to 400 days at a time");
  const nights = await unavailableNights(villa._id, from, to);
  res.setHeader("Cache-Control", "no-store");
  res.json({ unavailable: nights.map((n) => dayKey(n.date)).sort(), minNights: villa.minNights || 1, today: dayKey(todayIST()) });
});

/** Live price for the booking card and checkout */
bookingPublicRouter.post("/quote", quoteLimiter, async (req, res) => {
  const body = parse(StayBody, req.body);
  const q = await quoteStay(body);
  res.json(publicQuote(q));
});

const GuestBody = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.email("Enter a valid email so we can send your confirmation").trim().max(160),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{9,}$/, "Enter a 10-digit mobile number").max(20),
  city: z.string().trim().max(80).optional(),
  note: z.string().trim().max(1500).optional(),
});

bookingPublicRouter.post("/bookings", bookLimiter, async (req, res) => {
  const body = parse(
    StayBody.extend({
      guest: GuestBody,
      occasion: z.string().trim().max(80).optional(),
      attribution: z.record(z.string(), z.string().max(300)).optional(),
      acceptTerms: z.literal(true, "Please accept the terms to continue"),
    }),
    req.body,
  );
  const { booking, accessKey, order } = await createWebsiteBooking(body);
  res.status(201).json({ ref: booking.ref, key: accessKey, status: booking.status, order });
});

async function findForGuest(ref: string, key: unknown) {
  const b = await Booking.findOne({ ref: ref.toUpperCase() }).select("+accessKey");
  if (!b || typeof key !== "string" || b.accessKey !== key) throw notFound("We couldn't find that booking. Check the link or reference.");
  return b;
}

bookingPublicRouter.get("/bookings/:ref", async (req, res) => {
  const b = await findForGuest(String(req.params.ref), req.query.key);
  res.setHeader("Cache-Control", "no-store");
  res.json(guestView(b.toObject()));
});

/** "Find my booking": reference + the phone number used to book */
bookingPublicRouter.post("/bookings/lookup", bookLimiter, async (req, res) => {
  const { ref, phone } = parse(z.object({ ref: z.string().trim().min(4), phone: z.string().trim().min(6) }), req.body);
  const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
  const b = await Booking.findOne({ ref: ref.toUpperCase() }).select("+accessKey guest").lean();
  if (!b || digits(b.guest?.phone ?? "") !== digits(phone)) throw notFound("No booking matches that reference and phone number");
  res.json({ ref: b.ref, key: b.accessKey });
});

/** Starts Razorpay checkout for whatever is due (advance after approval, or the balance) */
bookingPublicRouter.post("/bookings/:ref/pay", bookLimiter, async (req, res) => {
  const b = await findForGuest(String(req.params.ref), req.body?.key);
  if (!["hold", "awaiting-payment", "confirmed"].includes(b.status)) throw new HttpError(422, "This booking can't take a payment");
  if (b.holdExpiresAt && b.holdExpiresAt < new Date() && b.status !== "confirmed") throw new HttpError(422, "The hold on these dates has lapsed. Please book again or message us.");
  res.json({ order: await startPayment(b) });
});

bookingPublicRouter.post("/bookings/:ref/verify", async (req, res) => {
  const body = parse(
    z.object({ key: z.string(), razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() }),
    req.body,
  );
  const b = await findForGuest(String(req.params.ref), body.key);
  if (!b.payments.some((p) => p.razorpayOrderId === body.razorpay_order_id)) throw new HttpError(400, "That payment doesn't belong to this booking");
  if (!verifyCheckoutSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) throw new HttpError(400, "We couldn't verify that payment");
  const updated = await markRazorpayPaid(body.razorpay_order_id, body.razorpay_payment_id);
  res.json(guestView((updated ?? b).toObject()));
});

bookingPublicRouter.get("/bookings/:ref/cancel-preview", async (req, res) => {
  const b = await findForGuest(String(req.params.ref), req.query.key);
  res.json(await suggestedRefund(b));
});

bookingPublicRouter.post("/bookings/:ref/cancel", bookLimiter, async (req, res) => {
  const body = parse(z.object({ key: z.string(), reason: z.string().trim().max(1000).default("") }), req.body);
  const b = await findForGuest(String(req.params.ref), body.key);
  const updated = await requestCancellation(b, body.reason);
  res.json(guestView(updated.toObject()));
});
