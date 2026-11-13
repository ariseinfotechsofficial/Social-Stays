import { format } from "date-fns";
import { api } from "@/lib/api";

export type QuoteLine = { title: string; chargeType: string; unitPrice: number; qty: number; amount: number; onRequest: boolean };

export type Quote = {
  nights: number;
  guests: number;
  minNights: number;
  checkIn: string;
  checkOut: string;
  mode: "instant" | "request" | "enquiry";
  pricing: {
    nightly: { date: string; price: number; label: string }[];
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
  addOns: QuoteLine[];
  couponError?: string;
  plan: { mode: "advance" | "full"; choice: boolean; advancePercent: number; advanceOption: number; dueNow: number; balance: number; balanceDueDate?: string };
};

export type StayRequest = {
  villa: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  addOns?: { slug: string; qty?: number }[];
  coupon?: string;
  payFull?: boolean;
};

export type RazorpayOrder = { id: string; amount: number; currency: string; keyId: string; amountRupees: number; name: string; email: string; phone: string; description: string };

export type GuestBooking = {
  ref: string;
  status: "hold" | "requested" | "awaiting-payment" | "confirmed" | "completed" | "cancelled" | "declined" | "expired";
  mode: "instant" | "request";
  villa: { name: string; slug: string; destination?: string };
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  occasion?: string;
  guest: { name: string; email: string; phone: string };
  pricing: Quote["pricing"];
  addOns: { title: string; qty: number; amount: number; onRequest: boolean }[];
  plan: { mode: "advance" | "full"; advancePercent: number; dueNow: number; balanceDueDate?: string };
  amountPaid: number;
  amountRefunded: number;
  amountDue: number;
  paymentStatus: string;
  holdExpiresAt?: string;
  cancellation: { status: string; refundAmount?: number; suggestedRefund?: number } | null;
  canPay: boolean;
  canCancel: boolean;
};

export const isoDay = (d: Date) => format(d, "yyyy-MM-dd");

export const getAvailability = (slug: string, from: string, to: string) =>
  api<{ unavailable: string[]; minNights: number; today: string }>(`/villas/${slug}/availability?from=${from}&to=${to}`, { cache: "no-store" });

export const getQuote = (req: StayRequest) => api<Quote>("/quote", { method: "POST", json: req });

/* ---------- Razorpay Checkout ---------- */

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
  }
}

let scriptPromise: Promise<void> | undefined;

/** Razorpay's checkout script, loaded only when someone pays */
function loadRazorpay() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = undefined;
      reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Opens Razorpay Checkout for an order and resolves with the signed response.
 * Rejects with "dismissed" when the guest closes the window.
 */
export async function payWithRazorpay(order: RazorpayOrder, brand: string): Promise<RazorpayResponse> {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: brand,
      description: order.description,
      prefill: { name: order.name, email: order.email, contact: order.phone },
      theme: { color: "#8A6B24" },
      handler: (response: RazorpayResponse) => resolve(response),
      modal: { ondismiss: () => reject(new Error("dismissed")) },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r.error?.description ?? "The payment didn't go through")));
    rzp.open();
  });
}

export const verifyPayment = (ref: string, key: string, r: RazorpayResponse) => api<GuestBooking>(`/bookings/${ref}/verify`, { method: "POST", json: { key, ...r } });

export const bookingUrl = (ref: string, key: string) => `/booking/${ref}?key=${encodeURIComponent(key)}`;
