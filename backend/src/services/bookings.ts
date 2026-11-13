import { randomBytes } from "node:crypto";
import type { HydratedDocument, Types } from "mongoose";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http.js";
import { sendEmail, type EmailContent } from "../lib/mailer.js";
import { createOrder, refundPayment } from "../lib/razorpay.js";
import { Booking, Coupon, VillaNight, type BookingDoc } from "../models/booking.js";
import { CancellationPolicy, Destination, Villa } from "../models/catalog.js";
import { getSettings } from "../models/settings.js";
import { confirmNights, isAvailable, lockNights, releaseNights } from "./availability.js";
import { addDays, daysBetween, formatDay, nightsOf, todayIST } from "./dates.js";
import { quoteStay, type Quote } from "./pricing.js";

export type BookingDocument = HydratedDocument<BookingDoc>;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/* ---------- References ---------- */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function newRef() {
  for (let i = 0; i < 6; i++) {
    const bytes = randomBytes(6);
    const ref = `SS-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
    if (!(await Booking.exists({ ref }))) return ref;
  }
  throw new Error("Could not generate a booking reference");
}

export const bookingLink = (ref: string, key: string) => `${env.SITE_URL}/booking/${ref}?key=${key}`;

/* ---------- Money ---------- */

/** What the guest should pay next: the advance (or full amount) to confirm, then the balance */
export function amountDue(b: Pick<BookingDoc, "status" | "plan" | "amountPaid" | "pricing">) {
  const paid = b.amountPaid ?? 0;
  if (b.status === "hold" || b.status === "awaiting-payment") return Math.max(0, (b.plan?.dueNow ?? 0) - paid);
  if (b.status === "confirmed") return Math.max(0, (b.pricing?.total ?? 0) - paid);
  return 0;
}

function paymentStatus(b: Pick<BookingDoc, "amountPaid" | "amountRefunded" | "pricing">): BookingDoc["paymentStatus"] {
  const paid = b.amountPaid ?? 0;
  const refunded = b.amountRefunded ?? 0;
  if (refunded > 0) return refunded >= paid ? "refunded" : "partially-refunded";
  if (paid <= 0) return "unpaid";
  return paid >= (b.pricing?.total ?? 0) ? "paid" : "partial";
}

function commissionFor(subtotal: number, percent: number) {
  const amount = Math.round((subtotal * percent) / 100);
  return { percent, base: subtotal, amount, ownerShare: subtotal - amount };
}

function note(b: BookingDocument, event: string, note?: string, by = "System") {
  b.timeline.push({ at: new Date(), event, note, by });
}

/* ---------- Emails ---------- */

async function stayRows(b: BookingDoc): Promise<[string, string][]> {
  return [
    ["Booking", b.ref],
    ["Villa", `${b.villaName}${b.destinationName ? `, ${b.destinationName}` : ""}`],
    ["Check-in", formatDay(b.checkIn)],
    ["Check-out", formatDay(b.checkOut)],
    ["Guests", String(b.guests)],
    ["Total", inr(b.pricing?.total ?? 0)],
    ["Paid", inr(b.amountPaid ?? 0)],
    ...((b.pricing?.total ?? 0) - (b.amountPaid ?? 0) > 0 && b.status === "confirmed" && b.plan?.balanceDueDate
      ? ([["Balance due", `${inr((b.pricing?.total ?? 0) - (b.amountPaid ?? 0))} by ${formatDay(b.plan.balanceDueDate)}`]] as [string, string][])
      : []),
  ];
}

export async function emailGuest(b: BookingDocument, template: "confirmed" | "requested" | "approved" | "declined" | "payment" | "cancel-requested" | "cancelled" | "expired-refunded") {
  const settings = await getSettings();
  const brand = settings.brand?.name ?? "Social Stays";
  const key = (await Booking.findById(b._id).select("+accessKey").lean())?.accessKey ?? "";
  const link = bookingLink(b.ref, key);
  const rows = await stayRows(b);
  const help = `Questions? WhatsApp us${settings.contact?.phoneDisplay ? ` on ${settings.contact.phoneDisplay}` : ""}${settings.contact?.email ? ` or email ${settings.contact.email}` : ""}.`;
  const first = b.guest!.name.split(" ")[0];
  const content: Record<typeof template, EmailContent> = {
    confirmed: {
      subject: `Booking confirmed: ${b.villaName}, ${formatDay(b.checkIn)}`,
      heading: `You're booked at ${b.villaName}`,
      intro: `Thank you, ${first}. Your stay is confirmed. Directions and your host's number reach you the day before you arrive.`,
      rows,
      cta: { label: "View your booking", href: link },
      footer: help,
    },
    requested: {
      subject: `We have your request for ${b.villaName}`,
      heading: "Request received",
      intro: `Thank you, ${first}. We're checking ${b.villaName} for your dates and will get back to you shortly, usually within a few hours. Nothing has been charged.`,
      rows,
      cta: { label: "View your request", href: link },
      footer: help,
    },
    approved: {
      subject: `Your dates at ${b.villaName} are available: pay to confirm`,
      heading: "Good news: your dates are available",
      intro: `We're holding ${b.villaName} for you until ${b.holdExpiresAt?.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}. Pay ${inr(amountDue(b))} to confirm the booking.`,
      rows,
      cta: { label: `Pay ${inr(amountDue(b))} and confirm`, href: link },
      footer: help,
    },
    declined: {
      subject: `About your request for ${b.villaName}`,
      heading: "We couldn't confirm these dates",
      intro: `Sorry, ${first}. ${b.villaName} isn't available for your request. Reply on WhatsApp and we'll suggest another villa or dates.`,
      rows: rows.slice(0, 5),
      footer: help,
    },
    payment: {
      subject: `Payment received: ${b.ref}`,
      heading: "Payment received",
      intro: `Thank you, ${first}. We've received your payment for ${b.villaName}.`,
      rows,
      cta: { label: "View your booking", href: link },
      footer: help,
    },
    "cancel-requested": {
      subject: `Cancellation request: ${b.ref}`,
      heading: "We've received your cancellation request",
      intro: `Our team will confirm the cancellation and any refund shortly.${b.cancellation?.suggestedRefund ? ` Under the villa's policy the refund would be ${inr(b.cancellation.suggestedRefund)}.` : ""}`,
      rows: rows.slice(0, 5),
      cta: { label: "View your booking", href: link },
      footer: help,
    },
    cancelled: {
      subject: `Booking cancelled: ${b.ref}`,
      heading: "Your booking is cancelled",
      intro: b.cancellation?.refundAmount
        ? `We've cancelled your booking and issued a refund of ${inr(b.cancellation.refundAmount)}. It reaches your original payment method in 5 to 7 working days.`
        : "We've cancelled your booking.",
      rows: rows.slice(0, 5),
      footer: help,
    },
    "expired-refunded": {
      subject: `Payment refunded: ${b.ref}`,
      heading: "Those dates were taken while you paid",
      intro: `Sorry, ${first}: your payment came through after the hold on ${b.villaName} had lapsed, and the dates were booked by someone else. We've refunded the full amount. Message us and we'll help you find another villa.`,
      rows: rows.slice(0, 5),
      footer: help,
    },
  };
  const ok = await sendEmail(b.guest!.email, content[template], brand);
  await Booking.updateOne({ _id: b._id }, { $push: { emailLog: { template, to: b.guest!.email, at: new Date(), ok } } });
}

/* ---------- Creating bookings ---------- */

export type GuestInput = { name: string; email?: string; phone: string; city?: string; note?: string };

function bookingFromQuote(q: Quote, extra: { ref: string; accessKey: string; mode: "instant" | "request"; status: BookingDoc["status"]; guest: GuestInput; occasion?: string; source: "website" | "admin"; attribution?: unknown; destinationName?: string }) {
  return {
    ref: extra.ref,
    accessKey: extra.accessKey,
    source: extra.source,
    mode: extra.mode,
    status: extra.status,
    villa: q.villa._id,
    villaName: q.villa.name,
    villaSlug: q.villa.slug,
    destinationName: extra.destinationName,
    owner: q.villa.owner,
    checkIn: q.checkIn,
    checkOut: q.checkOut,
    nights: q.nights,
    guests: q.guests,
    occasion: extra.occasion,
    guest: { name: extra.guest.name, email: extra.guest.email ?? "", phone: extra.guest.phone, city: extra.guest.city ?? "", note: extra.guest.note ?? "" },
    pricing: q.pricing,
    addOns: q.addOns,
    plan: { mode: q.plan.mode, advancePercent: q.plan.advancePercent, dueNow: q.plan.dueNow, balanceDueDate: q.plan.balanceDueDate },
    commission: commissionFor(q.pricing.subtotal, q.villa.commissionPercent),
    attribution: extra.attribution ?? {},
  };
}

/** Starts a Razorpay order for whatever is due now and records it on the booking */
export async function startPayment(b: BookingDocument) {
  const due = amountDue(b);
  if (due <= 0) throw new HttpError(422, "Nothing is due on this booking");
  const kind = b.status === "confirmed" ? "balance" : b.plan?.mode === "full" ? "full" : "advance";
  const order = await createOrder(due, b.ref, { booking: b.ref, kind });
  b.payments.push({ kind, amount: due, method: "razorpay", status: "created", razorpayOrderId: order.id });
  await b.save();
  return { ...order, amountRupees: due, name: b.guest!.name, email: b.guest!.email, phone: b.guest!.phone, description: `${b.villaName}: ${b.ref}` };
}

/** Guest checkout on the website: instant villas hold the dates and go to payment; request villas wait for the team. */
export async function createWebsiteBooking(input: {
  villa: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  addOns?: { slug: string; qty?: number }[];
  coupon?: string;
  payFull?: boolean;
  occasion?: string;
  guest: GuestInput;
  attribution?: unknown;
}) {
  const settings = await getSettings();
  if (!settings.booking?.enabled) throw new HttpError(422, "Online booking is switched off. Please enquire on WhatsApp.");
  const q = await quoteStay(input);
  if (q.couponError) throw new HttpError(422, q.couponError, { coupon: [q.couponError] });
  const mode = q.villa.mode === "request" ? "request" : "instant";
  const destination = await Destination.findById(q.villa.destination).select("name").lean();
  const nights = nightsOf(q.checkIn, q.checkOut);
  const accessKey = randomBytes(18).toString("base64url");
  const ref = await newRef();

  if (mode === "request") {
    if (!(await isAvailable(q.villa._id, nights))) throw new HttpError(409, "Those dates are already booked. Please choose other dates.");
    const b = await Booking.create(bookingFromQuote(q, { ref, accessKey, mode, status: "requested", guest: input.guest, occasion: input.occasion, source: "website", attribution: input.attribution, destinationName: destination?.name }));
    b.holdExpiresAt = new Date(Date.now() + (settings.booking.requestExpiryHours ?? 24) * 3600_000);
    note(b, "Request received", undefined, "Guest");
    await b.save();
    void emailGuest(b, "requested");
    return { booking: b, accessKey, order: null };
  }

  if (!env.razorpayEnabled) throw new HttpError(503, "Online payment isn't set up yet. Please book on WhatsApp for now.");
  const holdUntil = new Date(Date.now() + (settings.booking.holdMinutes ?? 20) * 60_000);
  const b = new Booking(bookingFromQuote(q, { ref, accessKey, mode, status: "hold", guest: input.guest, occasion: input.occasion, source: "website", attribution: input.attribution, destinationName: destination?.name }));
  b.holdExpiresAt = holdUntil;
  note(b, "Dates held for payment", undefined, "Guest");
  await lockNights(q.villa._id, nights, { booking: b._id, expiresAt: holdUntil });
  try {
    await b.save();
    const order = await startPayment(b);
    return { booking: b, accessKey, order };
  } catch (err) {
    await releaseNights({ booking: b._id });
    await Booking.deleteOne({ _id: b._id });
    throw err;
  }
}

/** A booking taken over WhatsApp or the phone, entered by the team. Confirmed straight away. */
export async function createAdminBooking(
  input: { villa: string; checkIn: Date; checkOut: Date; guests: number; addOns?: { slug: string; qty?: number }[]; coupon?: string; occasion?: string; guest: GuestInput; overrideTotal?: number; status: "confirmed" | "awaiting-payment" },
  by: string,
) {
  const settings = await getSettings();
  const q = await quoteStay(input, { forAdmin: true });
  if (input.overrideTotal !== undefined && input.overrideTotal >= 0) {
    // A negotiated price: keep the breakdown, adjust the discount line so the totals add up
    const r = 1 + q.pricing.gstPercent / 100;
    const newSubtotal = q.pricing.gstInclusive ? input.overrideTotal : Math.round(input.overrideTotal / r);
    const beforeDiscount = q.pricing.subtotal + q.pricing.discount;
    q.pricing.discount = Math.max(0, beforeDiscount - newSubtotal);
    q.pricing.subtotal = newSubtotal;
    q.pricing.gst = q.pricing.gstInclusive ? Math.round(newSubtotal - newSubtotal / r) : Math.round(input.overrideTotal - newSubtotal);
    q.pricing.total = input.overrideTotal;
    q.plan.dueNow = q.plan.mode === "full" ? input.overrideTotal : Math.round((input.overrideTotal * q.plan.advancePercent) / 100);
  }
  const destination = await Destination.findById(q.villa.destination).select("name").lean();
  const accessKey = randomBytes(18).toString("base64url");
  const ref = await newRef();
  const b = new Booking(
    bookingFromQuote(q, { ref, accessKey, mode: q.villa.mode === "request" ? "request" : "instant", status: input.status, guest: input.guest, occasion: input.occasion, source: "admin", destinationName: destination?.name }),
  );
  const holdUntil = input.status === "awaiting-payment" ? new Date(Date.now() + (settings.booking?.paymentWindowHours ?? 24) * 3600_000) : undefined;
  b.holdExpiresAt = holdUntil;
  note(b, input.status === "confirmed" ? "Booking added by the team" : "Booking added; waiting for payment", undefined, by);
  await lockNights(q.villa._id, nightsOf(q.checkIn, q.checkOut), { booking: b._id, expiresAt: holdUntil });
  try {
    await b.save();
  } catch (err) {
    await releaseNights({ booking: b._id });
    throw err;
  }
  return { booking: b, accessKey };
}

/* ---------- Payments ---------- */

async function confirm(b: BookingDocument, by: string) {
  b.status = "confirmed";
  b.holdExpiresAt = undefined;
  await confirmNights(b._id);
  if (b.pricing?.couponCode) await Coupon.updateOne({ code: b.pricing.couponCode }, { $inc: { usedCount: 1 } });
  note(b, "Booking confirmed", undefined, by);
}

/**
 * Records a successful Razorpay payment. Safe to call twice (browser callback and webhook):
 * the payment is claimed atomically, so only the first call counts it.
 */
export async function markRazorpayPaid(orderId: string, paymentId: string, method = "razorpay") {
  const claimed = await Booking.findOneAndUpdate(
    { payments: { $elemMatch: { razorpayOrderId: orderId, status: { $ne: "paid" } } } },
    { $set: { "payments.$.status": "paid", "payments.$.razorpayPaymentId": paymentId, "payments.$.paidAt": new Date(), "payments.$.reference": method } },
    { returnDocument: "after" },
  );
  if (!claimed) return Booking.findOne({ "payments.razorpayOrderId": orderId });
  const payment = claimed.payments.find((p) => p.razorpayOrderId === orderId)!;
  claimed.amountPaid = (claimed.amountPaid ?? 0) + payment.amount;

  if (claimed.status === "hold" || claimed.status === "awaiting-payment" || claimed.status === "expired") {
    const nights = nightsOf(claimed.checkIn, claimed.checkOut);
    const ours = await VillaNight.countDocuments({ booking: claimed._id });
    let secured = ours === nights.length;
    if (!secured) {
      // The hold lapsed before the payment landed: try to take the dates again
      try {
        await releaseNights({ booking: claimed._id });
        await lockNights(claimed.villa, nights, { booking: claimed._id });
        secured = true;
      } catch {
        secured = false;
      }
    }
    if (secured) {
      await confirm(claimed, "Guest");
      claimed.paymentStatus = paymentStatus(claimed);
      await claimed.save();
      void emailGuest(claimed, "confirmed");
    } else {
      note(claimed, "Payment arrived after the dates were taken; refunding automatically");
      claimed.status = "expired";
      claimed.paymentStatus = paymentStatus(claimed);
      await claimed.save();
      await issueRefund(claimed, payment.amount, "Dates taken before payment completed", "System");
      void emailGuest(claimed, "expired-refunded");
    }
    return claimed;
  }

  note(claimed, `Payment received: ${inr(payment.amount)}`, undefined, "Guest");
  claimed.paymentStatus = paymentStatus(claimed);
  await claimed.save();
  void emailGuest(claimed, "payment");
  return claimed;
}

/** A payment taken outside Razorpay (UPI, bank transfer, cash), recorded by the team */
export async function recordManualPayment(b: BookingDocument, input: { amount: number; method: "upi" | "bank" | "cash" | "other"; reference?: string; note?: string }, by: { id: Types.ObjectId; name: string }) {
  if (input.amount <= 0) throw new HttpError(422, "Enter the amount received");
  b.payments.push({ kind: "manual", amount: input.amount, method: input.method, status: "paid", reference: input.reference, note: input.note, paidAt: new Date(), recordedBy: by.id });
  b.amountPaid = (b.amountPaid ?? 0) + input.amount;
  note(b, `Payment recorded: ${inr(input.amount)} by ${input.method}`, input.reference, by.name);
  if ((b.status === "awaiting-payment" || b.status === "hold" || b.status === "requested") && b.amountPaid >= (b.plan?.dueNow ?? 0)) {
    if (b.status === "requested") await lockNights(b.villa, nightsOf(b.checkIn, b.checkOut), { booking: b._id });
    await confirm(b, by.name);
    b.paymentStatus = paymentStatus(b);
    await b.save();
    void emailGuest(b, "confirmed");
    return b;
  }
  b.paymentStatus = paymentStatus(b);
  await b.save();
  return b;
}

/**
 * Refunds up to `amount`, newest Razorpay payment first. Payments made outside Razorpay
 * are recorded as manual refunds for the team to pay back themselves.
 */
export async function issueRefund(b: BookingDocument, amount: number, reason: string, by: string, userId?: Types.ObjectId) {
  let left = Math.min(amount, (b.amountPaid ?? 0) - (b.amountRefunded ?? 0));
  if (left <= 0) return 0;
  const refundedPerPayment = new Map<string, number>();
  for (const r of b.refunds) if (r.razorpayPaymentId && r.status !== "failed") refundedPerPayment.set(r.razorpayPaymentId, (refundedPerPayment.get(r.razorpayPaymentId) ?? 0) + r.amount);

  const paid = b.payments.filter((p) => p.status === "paid").sort((a, z) => (z.paidAt?.getTime() ?? 0) - (a.paidAt?.getTime() ?? 0));
  let total = 0;
  for (const p of paid) {
    if (left <= 0) break;
    if (p.method === "razorpay" && p.razorpayPaymentId) {
      const room = p.amount - (refundedPerPayment.get(p.razorpayPaymentId) ?? 0);
      const part = Math.min(room, left);
      if (part <= 0) continue;
      try {
        const r = await refundPayment(p.razorpayPaymentId, part, { booking: b.ref, reason: reason.slice(0, 200) });
        b.refunds.push({ amount: part, status: r.status === "processed" ? "processed" : "pending", razorpayRefundId: r.id, razorpayPaymentId: p.razorpayPaymentId, reason, by: userId, processedAt: r.status === "processed" ? new Date() : undefined });
      } catch (err) {
        b.refunds.push({ amount: part, status: "failed", razorpayPaymentId: p.razorpayPaymentId, reason: `${reason} (${(err as Error).message})`, by: userId });
        note(b, `Refund of ${inr(part)} failed at Razorpay`, (err as Error).message, by);
        continue;
      }
      left -= part;
      total += part;
    }
  }
  if (left > 0) {
    // Whatever wasn't paid through Razorpay is handed back by the team
    b.refunds.push({ amount: left, status: "manual", reason: `${reason} (pay back by UPI/bank)`, by: userId });
    total += left;
    left = 0;
  }
  b.amountRefunded = (b.amountRefunded ?? 0) + total;
  b.paymentStatus = paymentStatus(b);
  note(b, `Refund issued: ${inr(total)}`, reason, by);
  await b.save();
  return total;
}

/* ---------- Requests ---------- */

export async function approveRequest(b: BookingDocument, by: string) {
  if (b.status !== "requested") throw new HttpError(422, "Only pending requests can be approved");
  const settings = await getSettings();
  const until = new Date(Date.now() + (settings.booking?.paymentWindowHours ?? 24) * 3600_000);
  await lockNights(b.villa, nightsOf(b.checkIn, b.checkOut), { booking: b._id, expiresAt: until });
  b.status = "awaiting-payment";
  b.holdExpiresAt = until;
  note(b, "Request approved; waiting for payment", undefined, by);
  await b.save();
  void emailGuest(b, "approved");
  return b;
}

export async function declineRequest(b: BookingDocument, reason: string, by: string) {
  if (b.status !== "requested" && b.status !== "awaiting-payment") throw new HttpError(422, "Only pending requests can be declined");
  if ((b.amountPaid ?? 0) > 0) throw new HttpError(422, "This booking has payments. Cancel it with a refund instead.");
  await releaseNights({ booking: b._id });
  b.status = "declined";
  b.holdExpiresAt = undefined;
  note(b, "Request declined", reason, by);
  await b.save();
  void emailGuest(b, "declined");
  return b;
}

/* ---------- Cancellations ---------- */

/** The refund the villa's cancellation policy allows if the guest cancels today */
export async function suggestedRefund(b: Pick<BookingDoc, "villa" | "checkIn" | "amountPaid" | "amountRefunded">) {
  const villa = await Villa.findById(b.villa).select("cancellationPolicy").lean();
  const policy = villa?.cancellationPolicy ? await CancellationPolicy.findById(villa.cancellationPolicy).lean() : null;
  const daysBefore = daysBetween(todayIST(), b.checkIn);
  const paid = (b.amountPaid ?? 0) - (b.amountRefunded ?? 0);
  if (!policy) return { amount: 0, percent: 0, daysBefore, policyName: "" };
  const tier = [...policy.tiers].sort((a, z) => z.daysBefore - a.daysBefore).find((t) => daysBefore >= t.daysBefore);
  const percent = tier?.refundPercent ?? 0;
  const gross = (paid * percent) / 100;
  const amount = Math.max(0, Math.round(gross - (gross * (policy.deductionPercent ?? 0)) / 100));
  return { amount, percent, daysBefore, policyName: policy.name };
}

export async function requestCancellation(b: BookingDocument, reason: string) {
  if (!["confirmed", "awaiting-payment", "requested", "hold"].includes(b.status)) throw new HttpError(422, "This booking can't be cancelled online");
  if (b.cancellation?.status === "requested") throw new HttpError(422, "You've already asked to cancel this booking");
  // Nothing paid yet: cancel straight away
  if ((b.amountPaid ?? 0) === 0) return cancelBooking(b, { refundAmount: 0, reason: reason || "Cancelled by guest" }, "Guest", "guest");
  const s = await suggestedRefund(b);
  b.cancellation = { ...b.cancellation, status: "requested", requestedAt: new Date(), requestedBy: "guest", reason, suggestedRefund: s.amount, policyName: s.policyName };
  note(b, "Guest asked to cancel", reason, "Guest");
  await b.save();
  void emailGuest(b, "cancel-requested");
  return b;
}

export async function cancelBooking(b: BookingDocument, input: { refundAmount: number; reason: string }, by: string, who: "guest" | "admin" = "admin", userId?: Types.ObjectId) {
  if (["cancelled", "declined", "expired", "completed"].includes(b.status)) throw new HttpError(422, `This booking is already ${b.status}`);
  await releaseNights({ booking: b._id });
  b.status = "cancelled";
  b.holdExpiresAt = undefined;
  b.cancellation = {
    ...b.cancellation,
    status: "approved",
    requestedAt: b.cancellation?.requestedAt ?? new Date(),
    requestedBy: b.cancellation?.requestedBy || who,
    reason: b.cancellation?.reason || input.reason,
    refundAmount: input.refundAmount,
    decidedAt: new Date(),
    decidedByName: by,
    decisionNote: input.reason,
  };
  b.commission = { percent: b.commission?.percent ?? 0, base: 0, amount: 0, ownerShare: 0 };
  note(b, "Booking cancelled", input.reason, by);
  await b.save();
  if (input.refundAmount > 0) await issueRefund(b, input.refundAmount, input.reason || "Cancellation", by, userId);
  void emailGuest(b, "cancelled");
  return b;
}

export async function rejectCancellation(b: BookingDocument, reason: string, by: string) {
  if (b.cancellation?.status !== "requested") throw new HttpError(422, "There's no open cancellation request");
  b.cancellation = { ...b.cancellation, status: "rejected", decidedAt: new Date(), decidedByName: by, decisionNote: reason };
  note(b, "Cancellation request declined", reason, by);
  await b.save();
  return b;
}

/** Moves a booking to new dates (the policy allows one move). Keeps the agreed price unless `reprice` is set. */
export async function moveBooking(b: BookingDocument, checkIn: Date, checkOut: Date, by: string, reprice = false) {
  if (!["confirmed", "awaiting-payment"].includes(b.status)) throw new HttpError(422, "Only confirmed bookings can be moved");
  const oldNights = nightsOf(b.checkIn, b.checkOut);
  const newNights = nightsOf(checkIn, checkOut);
  if (!newNights.length) throw new HttpError(422, "Check-out must be after check-in");
  await releaseNights({ booking: b._id });
  try {
    await lockNights(b.villa, newNights, { booking: b._id, expiresAt: b.status === "awaiting-payment" ? (b.holdExpiresAt ?? undefined) : undefined });
  } catch (err) {
    await lockNights(b.villa, oldNights, { booking: b._id, expiresAt: b.status === "awaiting-payment" ? (b.holdExpiresAt ?? undefined) : undefined });
    throw err;
  }
  const from = `${formatDay(b.checkIn)} – ${formatDay(b.checkOut)}`;
  b.checkIn = checkIn;
  b.checkOut = checkOut;
  b.nights = newNights.length;
  if (reprice) {
    const q = await quoteStay({ villa: String(b.villa), checkIn, checkOut, guests: b.guests, addOns: [], coupon: b.pricing?.couponCode ?? undefined }, { forAdmin: true });
    b.pricing = { ...q.pricing, addOns: b.pricing?.addOns ?? 0 } as BookingDoc["pricing"];
    b.commission = commissionFor(q.pricing.subtotal, b.commission?.percent ?? 0);
  }
  if (b.plan?.balanceDueDate) b.plan.balanceDueDate = addDays(checkIn, -((await getSettings()).booking?.balanceDueDays ?? 7));
  note(b, "Dates moved", `${from} → ${formatDay(checkIn)} – ${formatDay(checkOut)}`, by);
  await b.save();
  return b;
}

/* ---------- Housekeeping (runs every few minutes) ---------- */

export async function expireStale() {
  const now = new Date();
  const lapsed = await Booking.find({ status: { $in: ["hold", "awaiting-payment", "requested"] }, holdExpiresAt: { $lte: now } });
  for (const b of lapsed) {
    // A payment may be in flight; anything paid is handled by markRazorpayPaid
    if ((b.amountPaid ?? 0) > 0) continue;
    await releaseNights({ booking: b._id });
    const was = b.status;
    b.status = "expired";
    note(b, was === "requested" ? "Request lapsed without a reply" : "Hold lapsed without payment");
    await b.save();
  }
  const today = todayIST();
  const done = await Booking.updateMany(
    { status: "confirmed", checkOut: { $lte: today } },
    { $set: { status: "completed" }, $push: { timeline: { at: now, event: "Stay completed", by: "System" } } },
  );
  return { expired: lapsed.length, completed: done.modifiedCount };
}

/* ---------- What guests see ---------- */

export function guestView(b: BookingDoc & { _id: unknown }) {
  return {
    ref: b.ref,
    status: b.status,
    mode: b.mode,
    villa: { name: b.villaName, slug: b.villaSlug, destination: b.destinationName },
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    guests: b.guests,
    occasion: b.occasion,
    guest: { name: b.guest!.name, email: b.guest!.email, phone: b.guest!.phone },
    pricing: b.pricing,
    addOns: (b.addOns ?? []).map((a) => ({ title: a.title, qty: a.qty, amount: a.amount, onRequest: a.onRequest })),
    plan: b.plan,
    amountPaid: b.amountPaid,
    amountRefunded: b.amountRefunded,
    amountDue: amountDue(b),
    paymentStatus: b.paymentStatus,
    holdExpiresAt: b.holdExpiresAt,
    cancellation: b.cancellation?.status ? { status: b.cancellation.status, refundAmount: b.cancellation.refundAmount, suggestedRefund: b.cancellation.suggestedRefund } : null,
    canPay: amountDue(b) > 0 && ["hold", "awaiting-payment", "confirmed"].includes(b.status) && env.razorpayEnabled,
    canCancel: ["confirmed", "awaiting-payment", "requested", "hold"].includes(b.status) && b.cancellation?.status !== "requested",
  };
}
