import { Schema, model, type InferSchemaType } from "mongoose";
import { NoteSchema } from "./common.js";

/**
 * One document per villa per night that is booked, held or blocked.
 * The unique index makes double bookings impossible: a clashing insert fails in the database.
 * Holds carry `expiresAt`, and the TTL index removes them once a checkout lapses.
 */
const VillaNightSchema = new Schema({
  villa: { type: Schema.Types.ObjectId, ref: "Villa", required: true },
  /** The night, as UTC midnight of its date */
  date: { type: Date, required: true },
  kind: { type: String, enum: ["booking", "block"], required: true },
  booking: { type: Schema.Types.ObjectId, ref: "Booking" },
  block: { type: Schema.Types.ObjectId, ref: "Block" },
  expiresAt: { type: Date },
});

VillaNightSchema.index({ villa: 1, date: 1 }, { unique: true });
VillaNightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
VillaNightSchema.index({ booking: 1 });
VillaNightSchema.index({ block: 1 });

export const VillaNight = model("VillaNight", VillaNightSchema);

/* ---------- Date blocks (owner use, maintenance, offline bookings) ---------- */

const BlockSchema = new Schema(
  {
    villa: { type: Schema.Types.ObjectId, ref: "Villa", required: true, index: true },
    /** First and last blocked night, inclusive */
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String, enum: ["owner", "maintenance", "offline-booking", "other"], default: "owner" },
    note: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByName: String,
  },
  { timestamps: true },
);

export const Block = model("Block", BlockSchema);

/* ---------- Bookings ---------- */

export const BOOKING_STATUS = [
  /** Instant booking, waiting for payment; nights held until holdExpiresAt */
  "hold",
  /** Request to book, waiting for the team */
  "requested",
  /** Request approved, waiting for payment; nights held until holdExpiresAt */
  "awaiting-payment",
  "confirmed",
  "completed",
  "cancelled",
  "declined",
  "expired",
] as const;
export type BookingStatus = (typeof BOOKING_STATUS)[number];

const AddOnLineSchema = new Schema(
  {
    experience: { type: Schema.Types.ObjectId, ref: "Experience" },
    title: String,
    chargeType: String,
    unitPrice: Number,
    qty: { type: Number, default: 1 },
    amount: { type: Number, default: 0 },
    /** on_request add-ons are noted, not charged online */
    onRequest: { type: Boolean, default: false },
  },
  { _id: false },
);

const NightLineSchema = new Schema({ date: Date, price: Number, label: String }, { _id: false });

const PaymentSchema = new Schema(
  {
    kind: { type: String, enum: ["advance", "full", "balance", "manual"], required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["razorpay", "upi", "bank", "cash", "other"], default: "razorpay" },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    reference: String,
    note: String,
    paidAt: Date,
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const RefundSchema = new Schema(
  {
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "processed", "failed", "manual"], default: "pending" },
    razorpayRefundId: String,
    razorpayPaymentId: String,
    reason: String,
    by: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: Date,
  },
  { timestamps: true },
);

const TimelineSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    event: { type: String, required: true },
    note: String,
    by: String,
  },
  { _id: false },
);

const BookingSchema = new Schema(
  {
    ref: { type: String, required: true, unique: true },
    /** Secret for the guest's booking link */
    accessKey: { type: String, required: true, select: false },
    source: { type: String, enum: ["website", "admin"], default: "website" },
    mode: { type: String, enum: ["instant", "request"], required: true },
    status: { type: String, enum: BOOKING_STATUS, required: true, index: true },
    holdExpiresAt: Date,

    villa: { type: Schema.Types.ObjectId, ref: "Villa", required: true, index: true },
    villaName: String,
    villaSlug: String,
    destinationName: String,
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true },

    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true },
    guests: { type: Number, required: true },
    occasion: String,

    guest: {
      name: { type: String, required: true },
      email: { type: String, default: "" },
      phone: { type: String, required: true },
      city: { type: String, default: "" },
      note: { type: String, default: "" },
    },

    pricing: {
      nightly: { type: [NightLineSchema], default: [] },
      accommodation: { type: Number, default: 0 },
      extraGuests: { type: Number, default: 0 },
      extraGuestCount: { type: Number, default: 0 },
      addOns: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      couponCode: String,
      /** After discount, before GST */
      subtotal: { type: Number, default: 0 },
      gstPercent: { type: Number, default: 0 },
      gstInclusive: { type: Boolean, default: false },
      gst: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      securityDeposit: { type: Number, default: 0 },
    },
    addOns: { type: [AddOnLineSchema], default: [] },

    plan: {
      mode: { type: String, enum: ["advance", "full"], default: "advance" },
      advancePercent: { type: Number, default: 100 },
      dueNow: { type: Number, default: 0 },
      balanceDueDate: Date,
    },
    amountPaid: { type: Number, default: 0 },
    amountRefunded: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "partial", "paid", "refunded", "partially-refunded"], default: "unpaid", index: true },
    payments: { type: [PaymentSchema], default: [] },
    refunds: { type: [RefundSchema], default: [] },

    cancellation: {
      status: { type: String, enum: ["", "requested", "approved", "rejected"], default: "" },
      requestedAt: Date,
      requestedBy: { type: String, enum: ["", "guest", "admin"], default: "" },
      reason: String,
      suggestedRefund: Number,
      refundAmount: Number,
      policyName: String,
      decidedAt: Date,
      decidedByName: String,
      decisionNote: String,
    },

    commission: {
      percent: { type: Number, default: 0 },
      base: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      ownerShare: { type: Number, default: 0 },
    },
    payout: { type: Schema.Types.ObjectId, ref: "Payout" },

    attribution: { type: Schema.Types.Mixed, default: {} },
    timeline: { type: [TimelineSchema], default: [] },
    notes: { type: [NoteSchema], default: [] },
    emailLog: { type: [{ template: String, to: String, at: Date, ok: Boolean }], default: [] },
  },
  { timestamps: true },
);

BookingSchema.index({ "payments.razorpayOrderId": 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ "guest.phone": 1 });

export const Booking = model("Booking", BookingSchema);
export type BookingDoc = InferSchemaType<typeof BookingSchema>;

/* ---------- Coupons ---------- */

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percent", "flat"], default: "percent" },
    value: { type: Number, required: true, min: 0 },
    /** Cap for percentage coupons (0 = no cap) */
    maxDiscount: { type: Number, default: 0 },
    minAmount: { type: Number, default: 0 },
    minNights: { type: Number, default: 0 },
    validFrom: Date,
    validTo: Date,
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    /** Empty = every villa */
    villas: [{ type: Schema.Types.ObjectId, ref: "Villa" }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Coupon = model("Coupon", CouponSchema);

/* ---------- Owner payouts ---------- */

const PayoutSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerName: String,
    /** First day of the month the payout covers */
    period: { type: Date, required: true },
    bookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }],
    gross: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    paidAt: Date,
    method: String,
    reference: String,
    note: String,
  },
  { timestamps: true },
);

PayoutSchema.index({ owner: 1, period: 1 }, { unique: true });

export const Payout = model("Payout", PayoutSchema);

/* ---------- Owner listing edit requests ---------- */

const ListingRequestSchema = new Schema(
  {
    villa: { type: Schema.Types.ObjectId, ref: "Villa", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerName: String,
    /** Proposed values for villa fields, e.g. { tagline, priceFrom, photos } */
    changes: { type: Schema.Types.Mixed, default: {} },
    message: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedByName: String,
    reviewNote: String,
    reviewedAt: Date,
  },
  { timestamps: true, minimize: false },
);

export const ListingRequest = model("ListingRequest", ListingRequestSchema);
