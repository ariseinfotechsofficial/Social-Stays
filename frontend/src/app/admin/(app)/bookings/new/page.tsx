"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { NoAccess } from "@admin/components/NoAccess";
import { Button } from "@admin/components/ui/button";
import { Alert, Card } from "@admin/components/ui/feedback";
import { Checkbox, Field, Input, MoneyInput, Select, Textarea } from "@admin/components/ui/form";
import { FormSection, PageHeader } from "@admin/components/ui/layout";
import { ApiError, api, fieldErrors, type ListResponse } from "@admin/lib/api";
import type { Pricing } from "@admin/lib/bookings";
import { useCan } from "@admin/lib/session";
import { formatINR } from "@admin/lib/utils";

type Quote = { nights: number; pricing: Pricing; addOns: { title: string; amount: number; onRequest: boolean }[]; plan: { mode: string; advancePercent: number; dueNow: number }; couponError?: string };
type Exp = { _id: string; slug: string; title: string; chargeType: string };

export default function NewBooking() {
  const can = useCan();
  const router = useRouter();
  const villas = useQuery({ queryKey: ["ref", "/admin/villas"], queryFn: () => api<ListResponse<{ _id: string; name: string; status: string }>>("/admin/villas", { query: { limit: 200 } }) });
  const exps = useQuery({ queryKey: ["ref", "/admin/experiences"], queryFn: () => api<ListResponse<Exp>>("/admin/experiences", { query: { limit: 200 } }) });

  const [stay, setStay] = useState({ villa: "", checkIn: "", checkOut: "", guests: 2, coupon: "" });
  const [addOns, setAddOns] = useState<Record<string, number>>({});
  const [guest, setGuest] = useState({ name: "", phone: "", email: "", city: "", note: "" });
  const [occasion, setOccasion] = useState("");
  const [status, setStatus] = useState<"confirmed" | "awaiting-payment">("confirmed");
  const [override, setOverride] = useState<number | null>(null);
  const [paymentInput, setPayment] = useState<{ amount: number | null; method: string; reference: string }>({ amount: null, method: "upi", reference: "" });
  const [sendEmail, setSendEmail] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const ready = stay.villa && stay.checkIn && stay.checkOut && stay.guests > 0;
  const quoteBody = { ...stay, addOns: Object.entries(addOns).map(([slug, qty]) => ({ slug, qty })), coupon: stay.coupon || undefined };
  const quote = useQuery({
    queryKey: ["admin-quote", quoteBody],
    queryFn: () => api<Quote>("/admin/bookings/quote", { method: "POST", json: quoteBody }),
    enabled: Boolean(ready),
    retry: false,
  });

  // Until someone types an amount, suggest the advance as the payment received
  const payment = { ...paymentInput, amount: paymentInput.amount ?? quote.data?.plan.dueNow ?? 0 };

  if (!can("bookings")) return <NoAccess />;

  const submit = async () => {
    setBusy(true);
    setErrors({});
    try {
      const res = await api<{ _id: string }>("/admin/bookings", {
        method: "POST",
        json: {
          ...quoteBody,
          occasion: occasion || undefined,
          guest,
          status,
          overrideTotal: override ?? undefined,
          payment: payment.amount > 0 ? payment : undefined,
          sendEmail,
        },
      });
      toast.success("Booking added and dates blocked");
      router.push(`/admin/bookings/${res._id}`);
    } catch (e) {
      setErrors(fieldErrors(e));
      toast.error(e instanceof ApiError ? e.message : "Couldn't add the booking");
      setBusy(false);
    }
  };

  const total = override ?? quote.data?.pricing.total ?? 0;

  return (
    <>
      <PageHeader back={{ href: "/admin/bookings", label: "Bookings" }} title="Add a booking" description="For stays booked on WhatsApp or the phone. The dates are blocked on the calendar straight away, and the owner sees it in their dashboard." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <FormSection title="Stay">
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label="Villa" className="sm:col-span-6" error={errors.villa}>
                <Select value={stay.villa} onChange={(e) => setStay({ ...stay, villa: e.target.value })}>
                  <option value="">Choose a villa…</option>
                  {villas.data?.items.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name}
                      {v.status !== "live" ? ` (${v.status})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Check-in" className="sm:col-span-2" error={errors.checkIn}>
                <Input type="date" value={stay.checkIn} onChange={(e) => setStay({ ...stay, checkIn: e.target.value })} />
              </Field>
              <Field label="Check-out" className="sm:col-span-2" error={errors.checkOut}>
                <Input type="date" value={stay.checkOut} min={stay.checkIn} onChange={(e) => setStay({ ...stay, checkOut: e.target.value })} />
              </Field>
              <Field label="Guests" className="sm:col-span-2" error={errors.guests}>
                <Input type="number" min={1} value={stay.guests} onChange={(e) => setStay({ ...stay, guests: Number(e.target.value) })} />
              </Field>
              <Field label="Occasion" className="sm:col-span-3">
                <Input value={occasion} onChange={(e) => setOccasion(e.target.value)} />
              </Field>
              <Field label="Coupon" className="sm:col-span-3" error={quote.data?.couponError}>
                <Input value={stay.coupon} onChange={(e) => setStay({ ...stay, coupon: e.target.value.toUpperCase() })} />
              </Field>
            </div>
          </FormSection>
          <FormSection title="Add-ons">
            <div className="grid gap-2 sm:grid-cols-2">
              {exps.data?.items.map((x) => (
                <div key={x.slug} className="flex items-center justify-between gap-3 rounded-[8px] border border-line px-3 py-2">
                  <Checkbox
                    checked={Boolean(addOns[x.slug])}
                    onChange={(on) => setAddOns((cur) => (on ? { ...cur, [x.slug]: 1 } : Object.fromEntries(Object.entries(cur).filter(([k]) => k !== x.slug))))}
                    label={x.title}
                  />
                  {addOns[x.slug] && x.chargeType === "per_unit" && (
                    <Input type="number" min={1} max={20} value={addOns[x.slug]} onChange={(e) => setAddOns({ ...addOns, [x.slug]: Number(e.target.value) || 1 })} className="h-8 w-16" aria-label="Quantity" />
                  )}
                </div>
              ))}
            </div>
          </FormSection>
          <FormSection title="Guest">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors["guest.name"]}>
                <Input value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
              </Field>
              <Field label="Phone" error={errors["guest.phone"]}>
                <Input value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
              </Field>
              <Field label="Email (optional)" error={errors["guest.email"]}>
                <Input type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
              </Field>
              <Field label="City (optional)">
                <Input value={guest.city} onChange={(e) => setGuest({ ...guest, city: e.target.value })} />
              </Field>
              <Field label="Note" className="sm:col-span-2">
                <Textarea rows={2} value={guest.note} onChange={(e) => setGuest({ ...guest, note: e.target.value })} />
              </Field>
            </div>
          </FormSection>
          <FormSection title="Status & payment">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" className="sm:col-span-2">
                <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="confirmed">Confirmed</option>
                  <option value="awaiting-payment">Hold the dates until the guest pays</option>
                </Select>
              </Field>
              <Field label="Payment received now" help="Leave 0 if nothing has been paid yet.">
                <MoneyInput value={payment.amount} onChange={(v) => setPayment({ ...payment, amount: v })} />
              </Field>
              <Field label="Method">
                <Select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Reference" className="sm:col-span-2">
                <Input value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} placeholder="UTR or note" />
              </Field>
              <Checkbox checked={sendEmail} onChange={setSendEmail} label="Email the guest their booking (needs an email address)" className="sm:col-span-2" />
            </div>
          </FormSection>
        </Card>

        <div>
          <Card title="Price" className="sticky top-20">
            {!ready ? (
              <p className="text-[0.875rem] text-ink-soft">Choose a villa, dates and guests to see the price.</p>
            ) : quote.isLoading ? (
              <p className="text-[0.875rem] text-ink-soft">Working it out…</p>
            ) : quote.error ? (
              <Alert tone="error">{quote.error.message}</Alert>
            ) : quote.data ? (
              <dl className="space-y-1.5 text-[0.875rem]">
                <div className="flex justify-between">
                  <dt>{quote.data.nights} nights</dt>
                  <dd className="tabular-nums">{formatINR(quote.data.pricing.accommodation)}</dd>
                </div>
                {quote.data.pricing.extraGuests > 0 && (
                  <div className="flex justify-between">
                    <dt>Extra guests</dt>
                    <dd className="tabular-nums">{formatINR(quote.data.pricing.extraGuests)}</dd>
                  </div>
                )}
                {quote.data.pricing.addOns > 0 && (
                  <div className="flex justify-between">
                    <dt>Add-ons</dt>
                    <dd className="tabular-nums">{formatINR(quote.data.pricing.addOns)}</dd>
                  </div>
                )}
                {quote.data.pricing.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Discount</dt>
                    <dd className="tabular-nums">− {formatINR(quote.data.pricing.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-ink-soft">
                  <dt>GST {quote.data.pricing.gstPercent}%</dt>
                  <dd className="tabular-nums">{formatINR(quote.data.pricing.gst)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatINR(quote.data.pricing.total)}</dd>
                </div>
                <Field label="Agreed total (optional)" help="If you quoted a different price on WhatsApp, enter it here (including GST)." className="pt-3">
                  <MoneyInput value={override ?? undefined} onChange={(v) => setOverride(v || null)} placeholder={String(quote.data.pricing.total)} />
                </Field>
              </dl>
            ) : null}
            <Button className="mt-5 w-full" onClick={submit} loading={busy} disabled={!ready || !guest.name || !guest.phone || Boolean(quote.error)}>
              Add booking{total ? ` · ${formatINR(total)}` : ""}
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
