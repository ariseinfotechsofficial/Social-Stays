import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { HttpError } from "./http.js";

let client: Razorpay | undefined;

function rzp() {
  if (!env.razorpayEnabled) throw new HttpError(503, "Online payment isn't set up yet. Please book on WhatsApp for now.");
  client ??= new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return client;
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Amounts are whole rupees here and paise at Razorpay */
export async function createOrder(amountRupees: number, receipt: string, notes: Record<string, string>) {
  const order = await rzp().orders.create({ amount: Math.round(amountRupees * 100), currency: "INR", receipt: receipt.slice(0, 40), notes });
  return { id: order.id, amount: Number(order.amount), currency: order.currency, keyId: env.RAZORPAY_KEY_ID };
}

/** Checks the signature Razorpay Checkout returns to the browser */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

export async function refundPayment(paymentId: string, amountRupees: number, notes: Record<string, string>) {
  const refund = await rzp().payments.refund(paymentId, { amount: Math.round(amountRupees * 100), notes });
  return { id: refund.id, status: refund.status };
}

export async function fetchPayment(paymentId: string) {
  const p = await rzp().payments.fetch(paymentId);
  return { id: p.id, status: p.status, amount: Number(p.amount) / 100, orderId: p.order_id, method: p.method };
}
