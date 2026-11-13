"use client";

import {
  CalendarCheckIcon,
  CheckIcon,
  CopyIcon,
  CurrencyInrIcon,
  EnvelopeSimpleIcon,
  PencilSimpleIcon,
  PhoneIcon,
  ProhibitIcon,
  WarningCircleIcon,
  WhatsappLogoIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { NoAccess } from "@admin/components/NoAccess";
import { Button, buttonClass } from "@admin/components/ui/button";
import { Alert, Badge, Card, Loading } from "@admin/components/ui/feedback";
import { Field, Input, MoneyInput, Select, Textarea } from "@admin/components/ui/form";
import { PageHeader } from "@admin/components/ui/layout";
import { Dialog } from "@admin/components/ui/overlay";
import { ApiError, api } from "@admin/lib/api";
import { PAYMENT_STATUS, STATUS, type Booking } from "@admin/lib/bookings";
import { useCan } from "@admin/lib/session";
import { SITE_URL, ago, dateTime, formatINR, stayDay } from "@admin/lib/utils";

const wa = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
};

function Row({ label, value, strong, muted }: { label: ReactNode; value: ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1 ${strong ? "font-semibold" : ""} ${muted ? "text-ink-soft" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

type DialogKind = "decline" | "payment" | "cancel" | "reject" | "move" | "guest" | "refund" | "commission" | null;

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const qc = useQueryClient();
  const { data: b, isLoading, error } = useQuery({ queryKey: ["booking", id], queryFn: () => api<Booking>(`/admin/bookings/${id}`), enabled: can("bookings") });
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const [note, setNote] = useState("");

  if (!can("bookings")) return <NoAccess />;
  if (isLoading) return <Loading />;
  if (error || !b) return <Alert tone="error">{error?.message ?? "Booking not found"}</Alert>;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["booking", id] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["nav-counts"] });
    qc.invalidateQueries({ queryKey: ["calendar"] });
  };

  const act = async (path: string, body: unknown, success: string) => {
    setBusy(true);
    try {
      await api(`/admin/bookings/${id}${path}`, { method: path ? "POST" : "PATCH", json: body });
      toast.success(success);
      setDialog(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "That didn't work");
    } finally {
      setBusy(false);
    }
  };

  const open = (kind: DialogKind, initial: Record<string, string | number | boolean> = {}) => {
    setForm(initial);
    setDialog(kind);
  };

  const s = STATUS[b.status];
  const due = b.amountDue ?? 0;
  const paid = b.amountPaid - b.amountRefunded;
  const cancelRequested = b.cancellation?.status === "requested";
  const active = ["confirmed", "awaiting-payment", "hold", "requested"].includes(b.status);
  const owner = typeof b.owner === "object" ? b.owner : null;

  const copyLink = async () => {
    if (!b.link) return;
    await navigator.clipboard.writeText(b.link);
    toast.success("Booking link copied. Paste it into WhatsApp for the guest.");
  };

  return (
    <>
      <PageHeader
        back={{ href: "/admin/bookings", label: "Bookings" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {b.ref}
            <Badge tone={s.tone} className="font-sans text-[0.8125rem]">
              {s.label}
            </Badge>
            <Badge tone={PAYMENT_STATUS[b.paymentStatus]?.tone} className="font-sans text-[0.8125rem]">
              {PAYMENT_STATUS[b.paymentStatus]?.label}
            </Badge>
          </span>
        }
        description={`${b.villaName}${b.destinationName ? `, ${b.destinationName}` : ""} · ${stayDay(b.checkIn, "EEE d MMM")} – ${stayDay(b.checkOut, "EEE d MMM yyyy")}`}
        actions={
          <>
            {b.status === "requested" && (
              <>
                <Button variant="secondary" onClick={() => open("decline", { reason: "" })} icon={<XIcon className="size-4" />}>
                  Decline
                </Button>
                <Button onClick={() => act("/approve", {}, "Approved. The guest has been emailed a payment link.")} loading={busy} icon={<CheckIcon className="size-4" />}>
                  Approve
                </Button>
              </>
            )}
            {active && b.status !== "requested" && due > 0 && (
              <Button variant="secondary" onClick={() => open("payment", { amount: due, method: "upi", reference: "" })} icon={<CurrencyInrIcon className="size-4" />}>
                Record payment
              </Button>
            )}
            {b.link && active && (
              <Button variant="secondary" onClick={copyLink} icon={<CopyIcon className="size-4" />}>
                Copy guest link
              </Button>
            )}
            {["confirmed", "awaiting-payment"].includes(b.status) && (
              <Button variant="secondary" onClick={() => open("move", { checkIn: b.checkIn.slice(0, 10), checkOut: b.checkOut.slice(0, 10), reprice: false })} icon={<CalendarCheckIcon className="size-4" />}>
                Move dates
              </Button>
            )}
            {active && can("payments") && (
              <Button variant="danger" onClick={() => open("cancel", { refundAmount: b.refundPreview?.amount ?? 0, reason: "" })} icon={<ProhibitIcon className="size-4" />}>
                Cancel
              </Button>
            )}
          </>
        }
      />

      {b.status === "requested" && (
        <Alert tone="warn" className="mb-5">
          This is a request to book. Check the dates and the group, then approve (the guest gets a link to pay within the payment window) or decline.
          {b.holdExpiresAt && ` Without a reply it lapses at ${dateTime(b.holdExpiresAt)}.`}
        </Alert>
      )}
      {(b.status === "awaiting-payment" || b.status === "hold") && b.holdExpiresAt && (
        <Alert tone="info" className="mb-5">
          Dates are held until {dateTime(b.holdExpiresAt)}. Send the guest their link, or record a payment taken by UPI or bank transfer.
        </Alert>
      )}
      {cancelRequested && (
        <Alert tone="error" className="mb-5">
          <p className="font-semibold">The guest asked to cancel {b.cancellation?.requestedAt ? ago(b.cancellation.requestedAt) : ""}.</p>
          {b.cancellation?.reason && <p className="mt-1">“{b.cancellation.reason}”</p>}
          <p className="mt-1">Suggested refund under the policy: {formatINR(b.cancellation?.suggestedRefund ?? 0)}.</p>
          {can("payments") && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="dark" onClick={() => open("cancel", { refundAmount: b.cancellation?.suggestedRefund ?? 0, reason: "Cancelled at guest's request" })}>
                Cancel and refund
              </Button>
              <Button size="sm" variant="secondary" onClick={() => open("reject", { reason: "" })}>
                Keep booking
              </Button>
            </div>
          )}
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <Card
            title="Guest"
            action={
              <Button variant="ghost" size="sm" icon={<PencilSimpleIcon className="size-4" />} onClick={() => open("guest", { ...b.guest, occasion: b.occasion ?? "", guests: b.guests })}>
                Edit
              </Button>
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[1.125rem] font-semibold">{b.guest.name}</p>
                <p className="text-ink-soft">{[b.guest.phone, b.guest.email, b.guest.city].filter(Boolean).join(" · ")}</p>
                <p className="mt-2 text-[0.875rem]">
                  {b.guests} guests{b.occasion ? ` · ${b.occasion}` : ""} · {b.nights} night{b.nights === 1 ? "" : "s"}
                </p>
                {b.guest.note && <p className="mt-2 rounded-[8px] bg-sand px-3 py-2 text-[0.875rem]">“{b.guest.note}”</p>}
              </div>
              <div className="flex gap-2">
                <a href={`https://wa.me/${wa(b.guest.phone)}?text=${encodeURIComponent(`Hello ${b.guest.name.split(" ")[0]}, this is Social Stays about your booking ${b.ref}.`)}`} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "sm")}>
                  <WhatsappLogoIcon className="size-4" /> WhatsApp
                </a>
                <a href={`tel:${b.guest.phone}`} className={buttonClass("secondary", "sm")}>
                  <PhoneIcon className="size-4" /> Call
                </a>
                {b.guest.email && (
                  <Button size="sm" variant="secondary" icon={<EnvelopeSimpleIcon className="size-4" />} onClick={() => act("/send-link", {}, "Email sent")} disabled={!b.link}>
                    Email link
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card title="Payments" padded={false}>
            {b.payments.filter((p) => p.status === "paid").length === 0 && !b.refunds.length ? (
              <p className="px-5 py-4 text-[0.875rem] text-ink-soft">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-line text-[0.875rem]">
                {b.payments
                  .filter((p) => p.status === "paid")
                  .map((p) => (
                    <li key={p._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5">
                      <CheckIcon className="size-4 text-success" />
                      <span className="font-semibold tabular-nums">{formatINR(p.amount)}</span>
                      <span className="text-ink-soft capitalize">
                        {p.kind} · {p.method === "razorpay" ? "Razorpay" : p.method.toUpperCase()}
                        {p.reference && p.method !== "razorpay" ? ` · ${p.reference}` : ""}
                        {p.razorpayPaymentId ? ` · ${p.razorpayPaymentId}` : ""}
                      </span>
                      <span className="ml-auto text-ink-soft">{dateTime(p.paidAt)}</span>
                    </li>
                  ))}
                {b.refunds.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5">
                    <WarningCircleIcon className="size-4 text-info" />
                    <span className="font-semibold tabular-nums">− {formatINR(r.amount)}</span>
                    <span className="text-ink-soft">
                      Refund · {r.status === "manual" ? "pay back by UPI/bank" : r.status}
                      {r.reason ? ` · ${r.reason}` : ""}
                    </span>
                    <span className="ml-auto text-ink-soft">{dateTime(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            {can("payments") && paid > 0 && b.status !== "cancelled" && (
              <div className="border-t border-line px-5 py-3">
                <Button variant="ghost" size="sm" onClick={() => open("refund", { amount: 0, reason: "" })}>
                  Issue a partial refund
                </Button>
              </div>
            )}
          </Card>

          <Card title="Notes">
            <ul className="space-y-2">
              {b.notes.map((n) => (
                <li key={n._id} className="rounded-[8px] bg-sand px-3 py-2 text-[0.875rem]">
                  <p className="whitespace-pre-line">{n.text}</p>
                  <p className="mt-1 text-[0.75rem] text-ink-soft">
                    {n.byName} · {ago(n.at)}
                  </p>
                </li>
              ))}
            </ul>
            <Textarea className="mt-2" rows={2} placeholder="Internal note (not shown to the guest or owner)" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              disabled={!note.trim()}
              onClick={async () => {
                await api(`/admin/bookings/${id}/notes`, { method: "POST", json: { text: note } });
                setNote("");
                refresh();
              }}
            >
              Add note
            </Button>
          </Card>

          <Card title="History">
            <ol className="space-y-3 border-l border-line pl-4 text-[0.875rem]">
              {[...b.timeline].reverse().map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-brass" />
                  <p className="font-medium">{t.event}</p>
                  {t.note && <p className="text-ink-soft">{t.note}</p>}
                  <p className="text-[0.75rem] text-ink-muted">
                    {dateTime(t.at)}
                    {t.by ? ` · ${t.by}` : ""}
                  </p>
                </li>
              ))}
            </ol>
            {b.emailLog.length > 0 && (
              <p className="mt-4 text-[0.75rem] text-ink-soft">
                Emails: {b.emailLog.map((e) => `${e.template} (${e.ok ? "sent" : "not sent"})`).join(", ")}
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Price">
            <dl className="text-[0.875rem]">
              {b.pricing.nightly.length > 0 && (
                <Row
                  label={`${b.nights} night${b.nights === 1 ? "" : "s"}`}
                  value={formatINR(b.pricing.accommodation)}
                />
              )}
              {b.pricing.extraGuests > 0 && <Row label={`${b.pricing.extraGuestCount} extra guests`} value={formatINR(b.pricing.extraGuests)} />}
              {b.addOns.map((a) => (
                <Row key={a.title} label={`${a.title}${a.qty > 1 ? ` × ${a.qty}` : ""}`} value={a.onRequest ? "Quote" : formatINR(a.amount)} muted={a.onRequest} />
              ))}
              {b.pricing.discount > 0 && <Row label={`Discount${b.pricing.couponCode ? ` (${b.pricing.couponCode})` : ""}`} value={`− ${formatINR(b.pricing.discount)}`} />}
              {b.pricing.gstPercent > 0 && <Row label={`GST ${b.pricing.gstPercent}%${b.pricing.gstInclusive ? " incl." : ""}`} value={formatINR(b.pricing.gst)} muted />}
              <div className="my-2 border-t border-line" />
              <Row label="Total" value={formatINR(b.pricing.total)} strong />
              <Row label="Paid" value={formatINR(b.amountPaid)} muted />
              {b.amountRefunded > 0 && <Row label="Refunded" value={`− ${formatINR(b.amountRefunded)}`} muted />}
              {due > 0 && <Row label={b.status === "confirmed" ? `Balance${b.plan.balanceDueDate ? `, due ${stayDay(b.plan.balanceDueDate, "d MMM")}` : ""}` : "Due to confirm"} value={formatINR(due)} strong />}
              {b.pricing.securityDeposit > 0 && <p className="mt-2 text-[0.75rem] text-ink-soft">Security deposit {formatINR(b.pricing.securityDeposit)} (collected separately)</p>}
            </dl>
          </Card>

          <Card
            title="Owner share"
            action={
              can("payouts") && (
                <Button variant="ghost" size="sm" icon={<PencilSimpleIcon className="size-4" />} onClick={() => open("commission", { percent: b.commission.percent })}>
                  Edit
                </Button>
              )
            }
          >
            <dl className="text-[0.875rem]">
              <Row label="Commission base (excl. GST)" value={formatINR(b.commission.base)} />
              <Row label={`Social Stays ${b.commission.percent}%`} value={formatINR(b.commission.amount)} />
              <Row label={`Owner${owner ? `: ${owner.name}` : ""}`} value={formatINR(b.commission.ownerShare)} strong />
            </dl>
            <p className="mt-2 text-[0.75rem] text-ink-soft">{b.payout ? "Included in a payout." : owner ? "Not paid out yet." : "No owner account linked to this villa."}</p>
          </Card>

          <Card title="Details">
            <dl className="space-y-1.5 text-[0.875rem]">
              <Row label="Booked" value={dateTime(b.createdAt)} muted />
              <Row label="Source" value={b.source === "admin" ? "Team" : b.attribution?.label || b.attribution?.source || "Website"} muted />
              <Row label="Type" value={b.mode === "request" ? "Request to book" : "Instant"} muted />
            </dl>
            <a href={`${SITE_URL}/villas/${b.villaSlug}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[0.875rem] font-semibold text-gold-deep underline">
              View villa
            </a>
          </Card>
        </div>
      </div>

      {/* ---------- Dialogs ---------- */}

      <Dialog
        open={dialog === "decline"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Decline this request?"
        description="The guest is emailed that the dates couldn't be confirmed."
        footer={
          <Button variant="danger" loading={busy} onClick={() => act("/decline", { reason: form.reason }, "Request declined")}>
            Decline request
          </Button>
        }
      >
        <Field label="Reason (internal)">
          <Textarea value={String(form.reason ?? "")} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </Field>
      </Dialog>

      <Dialog
        open={dialog === "payment"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Record a payment"
        description="For money received outside Razorpay. If it covers the amount due, the booking is confirmed and the guest emailed."
        footer={
          <Button loading={busy} onClick={() => act("/payments", { amount: Number(form.amount), method: form.method, reference: form.reference }, "Payment recorded")}>
            Record {formatINR(Number(form.amount) || 0)}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount">
            <MoneyInput value={Number(form.amount)} onChange={(v) => setForm({ ...form, amount: v })} />
          </Field>
          <Field label="Method">
            <Select value={String(form.method)} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="upi">UPI</option>
              <option value="bank">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Reference (UTR / note)" className="sm:col-span-2">
            <Input value={String(form.reference ?? "")} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={dialog === "cancel"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Cancel ${b.ref}?`}
        description="The dates are released straight away and the guest is emailed."
        footer={
          <Button variant="danger" loading={busy} onClick={() => act("/cancel", { refundAmount: Number(form.refundAmount) || 0, reason: form.reason }, "Booking cancelled")}>
            Cancel booking{Number(form.refundAmount) > 0 ? ` and refund ${formatINR(Number(form.refundAmount))}` : ""}
          </Button>
        }
      >
        <div className="space-y-4">
          {paid > 0 && (
            <>
              <p className="text-[0.875rem] text-ink-soft">
                Paid so far: {formatINR(paid)}.
                {b.refundPreview && ` ${b.refundPreview.daysBefore} days before check-in, the ${b.refundPreview.policyName.toLowerCase()} policy allows ${b.refundPreview.percent}%: ${formatINR(b.refundPreview.amount)}.`}
              </p>
              <Field label="Refund" help="Razorpay payments are refunded automatically; UPI/bank payments are marked for you to pay back.">
                <MoneyInput value={Number(form.refundAmount)} onChange={(v) => setForm({ ...form, refundAmount: Math.min(v, paid) })} />
              </Field>
            </>
          )}
          <Field label="Reason">
            <Textarea value={String(form.reason ?? "")} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={dialog === "reject"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Keep the booking?"
        description="The cancellation request is closed and the booking stays confirmed. Tell the guest why on WhatsApp."
        footer={
          <Button loading={busy} onClick={() => act("/cancellation/reject", { reason: form.reason }, "Cancellation request closed")}>
            Keep booking
          </Button>
        }
      >
        <Field label="Note (internal)">
          <Textarea value={String(form.reason ?? "")} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </Field>
      </Dialog>

      <Dialog
        open={dialog === "refund"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Issue a refund"
        description="For example a goodwill refund or a removed add-on. The booking stays as it is."
        footer={
          <Button loading={busy} onClick={() => act("/refund", { amount: Number(form.amount), reason: form.reason }, "Refund issued")} disabled={!(Number(form.amount) > 0)}>
            Refund {formatINR(Number(form.amount) || 0)}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Amount" help={`Up to ${formatINR(paid)}`}>
            <MoneyInput value={Number(form.amount)} onChange={(v) => setForm({ ...form, amount: Math.min(v, paid) })} />
          </Field>
          <Field label="Reason">
            <Input value={String(form.reason ?? "")} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={dialog === "move"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Move dates"
        description="The new dates must be free. The agreed price stays unless you re-price."
        footer={
          <Button loading={busy} onClick={() => act("/move", { checkIn: form.checkIn, checkOut: form.checkOut, reprice: form.reprice }, "Dates moved")}>
            Move booking
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Check-in">
            <Input type="date" value={String(form.checkIn)} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
          </Field>
          <Field label="Check-out">
            <Input type="date" value={String(form.checkOut)} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-[0.875rem] sm:col-span-2">
            <input type="checkbox" checked={Boolean(form.reprice)} onChange={(e) => setForm({ ...form, reprice: e.target.checked })} /> Re-price for the new dates
          </label>
        </div>
      </Dialog>

      <Dialog
        open={dialog === "guest"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Edit guest details"
        footer={
          <Button loading={busy} onClick={() => act("", { guest: { name: form.name, phone: form.phone, email: form.email, city: form.city, note: form.note }, occasion: form.occasion, guests: Number(form.guests) }, "Saved")}>
            Save
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(["name", "phone", "email", "city", "occasion"] as const).map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
              <Input value={String(form[k] ?? "")} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </Field>
          ))}
          <Field label="Guests">
            <Input type="number" min={1} value={String(form.guests ?? "")} onChange={(e) => setForm({ ...form, guests: e.target.value })} />
          </Field>
          <Field label="Guest's note" className="sm:col-span-2">
            <Textarea value={String(form.note ?? "")} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={dialog === "commission"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Commission for this booking"
        footer={
          <Button loading={busy} onClick={() => act("", { commissionPercent: Number(form.percent) }, "Commission updated")}>
            Save
          </Button>
        }
      >
        <Field label="Social Stays commission %" help="Changes only this booking. The villa's default is set on the villa.">
          <Input type="number" min={0} max={100} value={String(form.percent ?? "")} onChange={(e) => setForm({ ...form, percent: e.target.value })} />
        </Field>
      </Dialog>
    </>
  );
}
