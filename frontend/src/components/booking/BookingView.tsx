"use client";

import { CheckCircleIcon, CircleNotchIcon, ClockIcon, WarningCircleIcon, WhatsappLogoIcon, XCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { useSite } from "@/components/layout/SiteProvider";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api";
import { payWithRazorpay, verifyPayment, type GuestBooking, type RazorpayOrder } from "@/lib/booking";
import { cn, formatINR } from "@/lib/utils";

const day = (iso: string) => format(parseISO(iso.slice(0, 10)), "EEE d MMM yyyy");

const STATUS: Record<GuestBooking["status"], { title: string; tone: "ok" | "wait" | "bad" }> = {
  confirmed: { title: "Your booking is confirmed", tone: "ok" },
  completed: { title: "Thanks for staying with us", tone: "ok" },
  requested: { title: "Request sent", tone: "wait" },
  "awaiting-payment": { title: "Your dates are available: pay to confirm", tone: "wait" },
  hold: { title: "Payment pending", tone: "wait" },
  cancelled: { title: "This booking is cancelled", tone: "bad" },
  declined: { title: "We couldn't confirm these dates", tone: "bad" },
  expired: { title: "This booking has lapsed", tone: "bad" },
};

export function BookingView({ refCode, accessKey, labels }: { refCode: string; accessKey: string; labels: { confirmedBody: string; requestedBody: string } }) {
  const site = useSite();
  const [b, setB] = useState<GuestBooking | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [preview, setPreview] = useState<{ amount: number; percent: number; daysBefore: number; policyName: string } | null>(null);
  const [reason, setReason] = useState("");

  const fetchBooking = useCallback(() => api<GuestBooking>(`/bookings/${refCode}?key=${encodeURIComponent(accessKey)}`, { cache: "no-store" }), [refCode, accessKey]);
  const fail = (e: unknown) => setError(e instanceof ApiError ? e.message : "We couldn't load this booking. Check your connection.");
  const load = async () => {
    try {
      setB(await fetchBooking());
    } catch (e) {
      fail(e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchBooking()
      .then((r) => !cancelled && setB(r))
      .catch((e) => !cancelled && fail(e));
    return () => {
      cancelled = true;
    };
  }, [fetchBooking]);

  const pay = async () => {
    setBusy(true);
    setNotice("");
    try {
      const { order } = await api<{ order: RazorpayOrder }>(`/bookings/${refCode}/pay`, { method: "POST", json: { key: accessKey } });
      const signed = await payWithRazorpay(order, site.name);
      setB(await verifyPayment(refCode, accessKey, signed));
    } catch (e) {
      if ((e as Error).message !== "dismissed") setNotice(e instanceof ApiError ? e.message : (e as Error).message);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const openCancel = async () => {
    setCancelOpen(true);
    try {
      setPreview(await api(`/bookings/${refCode}/cancel-preview?key=${encodeURIComponent(accessKey)}`));
    } catch {
      setPreview(null);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      setB(await api<GuestBooking>(`/bookings/${refCode}/cancel`, { method: "POST", json: { key: accessKey, reason } }));
      setCancelOpen(false);
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "That didn't work. Please try again or message us.");
    } finally {
      setBusy(false);
    }
  };

  if (error)
    return (
      <div className="rounded-[8px] bg-sand p-8">
        <p className="type-display-m">{error}</p>
        <Link href="/booking" className={buttonClasses("primary", "md", "mt-6")}>
          Find my booking
        </Link>
      </div>
    );
  if (!b)
    return (
      <p className="flex items-center gap-2 text-ink-soft">
        <CircleNotchIcon className="size-5 animate-spin" /> Loading your booking
      </p>
    );

  const s = STATUS[b.status];
  const Icon = s.tone === "ok" ? CheckCircleIcon : s.tone === "wait" ? ClockIcon : XCircleIcon;
  const body =
    b.status === "confirmed"
      ? labels.confirmedBody
      : b.status === "requested"
        ? labels.requestedBody
        : b.status === "awaiting-payment" && b.holdExpiresAt
          ? `We're holding the villa for you until ${format(new Date(b.holdExpiresAt), "d MMM, h:mm a")}. Pay ${formatINR(b.amountDue)} to confirm.`
          : b.status === "hold"
            ? "Your payment didn't complete. Your dates are held for a few more minutes; pay below to confirm."
            : b.status === "cancelled" && b.cancellation?.refundAmount
              ? `A refund of ${formatINR(b.cancellation.refundAmount)} is on its way to your original payment method (5 to 7 working days).`
              : "";

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
      <div className="min-w-0">
        <div className={cn("rounded-[8px] p-6 sm:p-8", s.tone === "ok" ? "bg-sand" : s.tone === "wait" ? "bg-sand" : "bg-sand-deep")}>
          <Icon weight="light" className={cn("size-11", s.tone === "bad" ? "text-error" : "text-gold")} />
          <h1 className="type-display-l mt-4">{s.title}</h1>
          {body && <p className="type-lead mt-3 max-w-xl text-ink-soft">{body}</p>}
          {b.cancellation?.status === "requested" && (
            <p className="mt-4 flex items-start gap-2 font-medium">
              <WarningCircleIcon className="mt-0.5 size-5 shrink-0 text-gold" /> You&apos;ve asked to cancel. Our team will confirm the cancellation and refund shortly.
            </p>
          )}
          <p className="mt-5 text-[0.9375rem]">
            Booking reference <strong className="font-semibold tracking-wide">{b.ref}</strong>
          </p>
        </div>

        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            ["Villa", `${b.villa.name}${b.villa.destination ? `, ${b.villa.destination}` : ""}`],
            ["Guests", `${b.guests}${b.occasion ? ` · ${b.occasion}` : ""}`],
            ["Check-in", day(b.checkIn)],
            ["Check-out", day(b.checkOut)],
            ["Booked by", b.guest.name],
            ["Contact", [b.guest.phone, b.guest.email].filter(Boolean).join(" · ")],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[8px] border border-line px-4 py-3">
              <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-gold-deep uppercase">{k}</dt>
              <dd className="mt-1 font-semibold break-words">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <WhatsAppLink placement="booking_page" message={`Hello ${site.name}, I have a question about booking ${b.ref}.`} className={buttonClasses("outline", "md")}>
            <WhatsappLogoIcon className="size-5" /> Message us
          </WhatsAppLink>
          <Link href={`/villas/${b.villa.slug}`} className="font-semibold text-gold-deep underline-offset-4 hover:underline">
            View the villa
          </Link>
          {b.canCancel && b.status !== "hold" && (
            <button type="button" onClick={openCancel} className="font-semibold text-ink-soft underline-offset-4 hover:underline">
              {b.status === "requested" ? "Withdraw request" : "Cancel booking"}
            </button>
          )}
        </div>

        {cancelOpen && (
          <div className="mt-6 rounded-[8px] border border-line p-5 sm:p-6">
            <h2 className="type-display-m">Cancel this booking?</h2>
            {b.amountPaid > 0 ? (
              <p className="mt-2 text-ink-soft">
                {preview
                  ? `You're ${preview.daysBefore} day${preview.daysBefore === 1 ? "" : "s"} from check-in. Under the ${preview.policyName.toLowerCase()} policy the refund would be ${formatINR(preview.amount)}${preview.percent ? ` (${preview.percent}% of what you've paid, less payment charges)` : ""}. Our team confirms the final amount.`
                  : "Our team will confirm the refund under the villa's cancellation policy."}
              </p>
            ) : (
              <p className="mt-2 text-ink-soft">Nothing has been paid, so it&apos;s cancelled straight away.</p>
            )}
            <label htmlFor="cancel-reason" className="mt-4 block text-[0.9375rem] font-semibold">
              Reason (optional)
            </label>
            <textarea id="cancel-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full rounded-[4px] border border-field px-4 py-3 outline-none focus:border-gold" />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="dark" size="md" onClick={cancel} disabled={busy}>
                {b.amountPaid > 0 ? "Ask to cancel" : "Cancel"}
              </Button>
              <Button variant="outline" size="md" onClick={() => setCancelOpen(false)}>
                Keep my booking
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside>
        <div className="sticky top-28 rounded-[8px] border border-line p-5">
          <h2 className="font-display text-[1.5rem] font-medium">Payment</h2>
          <div className="mt-4">
            <PriceSummary pricing={b.pricing} addOns={b.addOns} paid={b.amountPaid} refunded={b.amountRefunded} />
          </div>
          {b.amountDue > 0 && (
            <p className="mt-4 flex items-baseline justify-between border-t border-line pt-3 font-semibold">
              <span>{b.status === "confirmed" ? `Balance${b.plan.balanceDueDate ? `, due ${day(b.plan.balanceDueDate)}` : ""}` : "Due now"}</span>
              <span>{formatINR(b.amountDue)}</span>
            </p>
          )}
          {notice && (
            <p className="mt-4 rounded-[6px] bg-error/10 px-3 py-2 text-[0.875rem] font-medium text-error" role="alert">
              {notice}
            </p>
          )}
          {b.canPay && (
            <Button size="lg" className="mt-5 w-full" onClick={pay} disabled={busy} icon={busy ? <CircleNotchIcon className="size-5 animate-spin" /> : undefined}>
              Pay {formatINR(b.amountDue)}
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
