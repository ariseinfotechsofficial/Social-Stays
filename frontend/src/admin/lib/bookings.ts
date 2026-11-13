export type BookingStatus = "hold" | "requested" | "awaiting-payment" | "confirmed" | "completed" | "cancelled" | "declined" | "expired";

export const STATUS: Record<BookingStatus, { label: string; tone: "gold" | "info" | "success" | "neutral" | "warn" | "error" }> = {
  hold: { label: "Paying now", tone: "warn" },
  requested: { label: "Request", tone: "gold" },
  "awaiting-payment": { label: "Awaiting payment", tone: "warn" },
  confirmed: { label: "Confirmed", tone: "success" },
  completed: { label: "Completed", tone: "info" },
  cancelled: { label: "Cancelled", tone: "error" },
  declined: { label: "Declined", tone: "neutral" },
  expired: { label: "Lapsed", tone: "neutral" },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: "neutral" | "warn" | "success" | "info" }> = {
  unpaid: { label: "Unpaid", tone: "neutral" },
  partial: { label: "Part paid", tone: "warn" },
  paid: { label: "Paid", tone: "success" },
  refunded: { label: "Refunded", tone: "info" },
  "partially-refunded": { label: "Part refunded", tone: "info" },
};

export type Pricing = {
  nightly: { date: string; price: number; label?: string }[];
  accommodation: number;
  extraGuests: number;
  extraGuestCount: number;
  addOns: number;
  discount: number;
  couponCode?: string;
  subtotal: number;
  gstPercent: number;
  gstInclusive: boolean;
  gst: number;
  total: number;
  securityDeposit: number;
};

export type Booking = {
  _id: string;
  ref: string;
  source: "website" | "admin";
  mode: "instant" | "request";
  status: BookingStatus;
  holdExpiresAt?: string;
  villa: string;
  villaName: string;
  villaSlug: string;
  destinationName?: string;
  owner?: { _id: string; name: string; email: string; phone?: string } | string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  occasion?: string;
  guest: { name: string; email: string; phone: string; city?: string; note?: string };
  pricing: Pricing;
  addOns: { title: string; qty: number; amount: number; unitPrice: number; onRequest: boolean }[];
  plan: { mode: "advance" | "full"; advancePercent: number; dueNow: number; balanceDueDate?: string };
  amountPaid: number;
  amountRefunded: number;
  amountDue?: number;
  paymentStatus: string;
  payments: { _id: string; kind: string; amount: number; method: string; status: string; razorpayPaymentId?: string; reference?: string; note?: string; paidAt?: string; createdAt: string }[];
  refunds: { _id: string; amount: number; status: string; reason?: string; razorpayRefundId?: string; createdAt: string }[];
  cancellation?: { status: string; requestedAt?: string; requestedBy?: string; reason?: string; suggestedRefund?: number; refundAmount?: number; decidedByName?: string; decisionNote?: string };
  commission: { percent: number; base: number; amount: number; ownerShare: number };
  payout?: string;
  attribution?: Record<string, string>;
  timeline: { at: string; event: string; note?: string; by?: string }[];
  notes: { _id: string; text: string; byName?: string; at: string }[];
  emailLog: { template: string; to: string; at: string; ok: boolean }[];
  link?: string;
  refundPreview?: { amount: number; percent: number; daysBefore: number; policyName: string } | null;
  createdAt: string;
};
