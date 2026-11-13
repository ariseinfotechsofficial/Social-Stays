import type { Types } from "mongoose";
import { HttpError } from "../lib/http.js";
import { Destination, Experience, PriceRule, Villa } from "../models/catalog.js";
import { Coupon } from "../models/booking.js";
import { getSettings } from "../models/settings.js";
import { addDays, daysBetween, dayKey, nightsOf, todayIST } from "./dates.js";

export type QuoteInput = {
  villa: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  addOns?: { slug: string; qty?: number }[];
  coupon?: string;
  /** Only when the payment mode lets the guest choose */
  payFull?: boolean;
};

const rupees = (n: number) => Math.round(n);

/** Loads a villa by slug or id with what pricing needs */
async function loadVilla(villa: string | Types.ObjectId) {
  const query = typeof villa === "string" && !/^[a-f0-9]{24}$/.test(villa) ? Villa.findOne({ slug: villa }) : Villa.findById(villa);
  const doc = await query.lean();
  if (!doc) throw new HttpError(404, "We couldn't find that villa");
  return doc;
}

/**
 * The full price of a stay: nightly rates (seasonal rules, weekends), extra guests, add-ons,
 * coupon, GST and the payment plan. Used by the booking card, checkout and the admin.
 * `forAdmin` skips the rules that only apply to guests booking online.
 */
export async function quoteStay(input: QuoteInput, opts: { forAdmin?: boolean } = {}) {
  const [villa, settings] = await Promise.all([loadVilla(input.villa), getSettings()]);
  const b = settings.booking!;
  const nights = nightsOf(input.checkIn, input.checkOut);

  if (!nights.length) throw new HttpError(422, "Check-out must be after check-in", { checkOut: ["Choose a check-out date after check-in"] });
  if (!opts.forAdmin) {
    if (villa.status !== "live") throw new HttpError(422, "This villa is not open for bookings yet");
    if (villa.booking?.mode === "enquiry") throw new HttpError(422, "This villa is booked through WhatsApp only");
    const today = todayIST();
    if (input.checkIn < today) throw new HttpError(422, "Check-in can't be in the past", { checkIn: ["Choose a date from today"] });
    if (daysBetween(today, input.checkIn) > (b.maxAdvanceDays ?? 365)) throw new HttpError(422, "That's further ahead than we take bookings");
  }
  const maxGuests = villa.guests?.max ?? 1;
  if (input.guests < 1) throw new HttpError(422, "Add at least one guest", { guests: ["Add at least one guest"] });
  if (input.guests > maxGuests) throw new HttpError(422, `${villa.name} sleeps up to ${maxGuests}`, { guests: [`Up to ${maxGuests} guests`] });

  /* Nightly rates: the narrowest active rule covering a night wins over the villa's own prices */
  const rules = await PriceRule.find({ villa: villa._id, active: true, from: { $lte: nights.at(-1)! }, to: { $gte: nights[0] } }).lean();
  const weekend = new Set(b.weekendNights ?? [5, 6]);
  let minNights = villa.minNights || 1;
  const nightly = nights.map((date) => {
    const isWeekend = weekend.has(date.getUTCDay());
    const rule = rules
      .filter((r) => r.from <= date && r.to >= date)
      .sort((a, z) => a.to.getTime() - a.from.getTime() - (z.to.getTime() - z.from.getTime()))[0];
    if (rule) {
      minNights = Math.max(minNights, rule.minNights || 0);
      return { date, price: isWeekend && rule.weekendPrice ? rule.weekendPrice : rule.price, label: rule.label };
    }
    return { date, price: isWeekend && villa.weekendPrice ? villa.weekendPrice : villa.priceFrom, label: isWeekend && villa.weekendPrice ? "Weekend" : "" };
  });
  if (!opts.forAdmin && nights.length < minNights) {
    throw new HttpError(422, `Book at least ${minNights} nights for these dates`, { checkOut: [`Minimum stay is ${minNights} nights`] });
  }
  const accommodation = nightly.reduce((s, n) => s + n.price, 0);

  const extraGuestCount = Math.max(0, input.guests - (villa.guests?.base ?? maxGuests));
  const extraGuests = extraGuestCount * (villa.extraGuestCharge ?? 0) * nights.length;

  /* Add-ons from the experiences available at this villa's destination */
  const addOns: { experience: Types.ObjectId; title: string; chargeType: string; unitPrice: number; qty: number; amount: number; onRequest: boolean }[] = [];
  if (input.addOns?.length) {
    const destination = await Destination.findById(villa.destination).select("_id").lean();
    const exps = await Experience.find({ slug: { $in: input.addOns.map((a) => a.slug) }, status: "published" }).lean();
    for (const req of input.addOns) {
      const e = exps.find((x) => x.slug === req.slug);
      if (!e) continue;
      if (e.availableAt?.length && !e.availableAt.some((d) => String(d) === String(destination?._id))) continue;
      const unit = e.price?.amount ?? 0;
      const qty = Math.max(1, Math.min(20, Math.round(req.qty ?? 1)));
      const people = Math.max(input.guests, e.minGuests ?? 0);
      const onRequest = e.chargeType === "on_request" || !e.bookable;
      const amount = onRequest
        ? 0
        : e.chargeType === "per_person"
          ? unit * people
          : e.chargeType === "per_person_per_night"
            ? unit * people * nights.length
            : e.chargeType === "per_night"
              ? unit * nights.length
              : unit * qty;
      addOns.push({ experience: e._id, title: e.title, chargeType: e.chargeType, unitPrice: unit, qty: e.chargeType === "per_unit" ? qty : 1, amount, onRequest });
    }
  }
  const addOnTotal = addOns.reduce((s, a) => s + a.amount, 0);
  const beforeDiscount = accommodation + extraGuests + addOnTotal;

  /* Coupon */
  let discount = 0;
  let couponCode: string | undefined;
  let couponError: string | undefined;
  if (input.coupon?.trim()) {
    const code = input.coupon.trim().toUpperCase();
    const c = await Coupon.findOne({ code }).lean();
    const now = new Date();
    if (!c || !c.active) couponError = "That code isn't valid";
    else if (c.validFrom && c.validFrom > now) couponError = "That code isn't active yet";
    else if (c.validTo && c.validTo < now) couponError = "That code has expired";
    else if (c.usageLimit && c.usedCount >= c.usageLimit) couponError = "That code has been fully used";
    else if (c.villas?.length && !c.villas.some((v) => String(v) === String(villa._id))) couponError = `That code doesn't apply to ${villa.name}`;
    else if (c.minNights && nights.length < c.minNights) couponError = `That code needs a stay of ${c.minNights}+ nights`;
    else if (c.minAmount && beforeDiscount < c.minAmount) couponError = `That code needs a booking of ₹${c.minAmount.toLocaleString("en-IN")} or more`;
    else {
      discount = c.type === "percent" ? (beforeDiscount * c.value) / 100 : c.value;
      if (c.type === "percent" && c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
      discount = rupees(Math.min(discount, beforeDiscount));
      couponCode = c.code;
    }
  }

  const subtotal = beforeDiscount - discount;
  const gstPercent = b.gstPercent ?? 0;
  const gstInclusive = Boolean(b.gstInclusive);
  const gst = gstInclusive ? rupees(subtotal - subtotal / (1 + gstPercent / 100)) : rupees((subtotal * gstPercent) / 100);
  const total = gstInclusive ? subtotal : subtotal + gst;

  /* Payment plan: the villa's own setting, else the global one */
  const villaMode = villa.booking?.paymentMode && villa.booking.paymentMode !== "default" ? villa.booking.paymentMode : (b.paymentMode ?? "advance");
  const advancePercent = villa.booking?.advancePercent || b.advancePercent || 50;
  const balanceDueDays = b.balanceDueDays ?? 7;
  const balanceDueDate = addDays(input.checkIn, -balanceDueDays);
  // Too close to check-in for a balance later: pay everything now
  const late = balanceDueDate <= todayIST();
  const payFull = villaMode === "full" || late || (villaMode === "choice" && Boolean(input.payFull)) || advancePercent >= 100;
  const dueNow = payFull ? total : rupees((total * advancePercent) / 100);

  return {
    villa: { _id: villa._id, slug: villa.slug, name: villa.name, mode: (villa.booking?.mode ?? "enquiry") as "instant" | "request" | "enquiry", commissionPercent: villa.commissionPercent ?? 0, owner: villa.owner, securityDeposit: villa.securityDeposit ?? 0, destination: villa.destination },
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights: nights.length,
    guests: input.guests,
    minNights,
    pricing: {
      nightly,
      accommodation,
      extraGuests,
      extraGuestCount,
      addOns: addOnTotal,
      discount,
      couponCode,
      subtotal,
      gstPercent,
      gstInclusive,
      gst,
      total,
      securityDeposit: villa.securityDeposit ?? 0,
    },
    addOns,
    couponError,
    plan: {
      mode: (payFull ? "full" : "advance") as "full" | "advance",
      choice: villaMode === "choice" && !late && advancePercent < 100,
      advancePercent: payFull ? 100 : advancePercent,
      /** The advance on offer, even when the guest chose to pay in full */
      advanceOption: advancePercent,
      dueNow,
      balance: total - dueNow,
      balanceDueDate: payFull ? undefined : balanceDueDate,
    },
  };
}

export type Quote = Awaited<ReturnType<typeof quoteStay>>;

/** The quote as the website shows it */
export const publicQuote = (q: Quote) => ({
  nights: q.nights,
  guests: q.guests,
  minNights: q.minNights,
  checkIn: dayKey(q.checkIn),
  checkOut: dayKey(q.checkOut),
  mode: q.villa.mode,
  pricing: { ...q.pricing, nightly: q.pricing.nightly.map((n) => ({ date: dayKey(n.date), price: n.price, label: n.label })) },
  addOns: q.addOns.map((a) => ({ title: a.title, chargeType: a.chargeType, unitPrice: a.unitPrice, qty: a.qty, amount: a.amount, onRequest: a.onRequest })),
  couponError: q.couponError,
  plan: { ...q.plan, balanceDueDate: q.plan.balanceDueDate ? dayKey(q.plan.balanceDueDate) : undefined },
});
