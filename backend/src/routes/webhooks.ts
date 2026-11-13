import { Router } from "express";
import { verifyWebhookSignature } from "../lib/razorpay.js";
import { Booking } from "../models/booking.js";
import { markRazorpayPaid } from "../services/bookings.js";

export const webhooksRouter = Router();

/**
 * Razorpay webhook (Dashboard → Webhooks → {PUBLIC_URL}/api/webhooks/razorpay, events: payment.captured,
 * order.paid, refund.processed, refund.failed). Catches payments whose browser never returned to the site.
 */
webhooksRouter.post("/razorpay", async (req, res) => {
  const raw = req.body as Buffer;
  const signature = req.header("x-razorpay-signature") ?? "";
  if (!Buffer.isBuffer(raw) || !verifyWebhookSignature(raw, signature)) {
    res.status(400).json({ error: "Invalid signature" });
    return;
  }
  const event = JSON.parse(raw.toString("utf8")) as {
    event: string;
    payload: { payment?: { entity: { id: string; order_id: string; method?: string } }; refund?: { entity: { id: string; status: string } } };
  };

  if ((event.event === "payment.captured" || event.event === "order.paid") && event.payload.payment) {
    const p = event.payload.payment.entity;
    await markRazorpayPaid(p.order_id, p.id, p.method ? `razorpay:${p.method}` : "razorpay");
  }

  if ((event.event === "refund.processed" || event.event === "refund.failed") && event.payload.refund) {
    const r = event.payload.refund.entity;
    const status = event.event === "refund.processed" ? "processed" : "failed";
    await Booking.updateOne(
      { "refunds.razorpayRefundId": r.id },
      { $set: { "refunds.$.status": status, ...(status === "processed" ? { "refunds.$.processedAt": new Date() } : {}) } },
    );
  }

  res.json({ ok: true });
});
