"use client";

import { CircleNotchIcon, LockSimpleIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { useAvailability, useQuote } from "@/components/booking/BookingWidget";
import { DatesField, GuestsField, SelectField } from "@/components/enquiry/fields";
import { useSite } from "@/components/layout/SiteProvider";
import { Button } from "@/components/ui/Button";
import type { Photo } from "@/data/types";
import { ApiError, api } from "@/lib/api";
import { describeAttribution, getAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";
import { bookingUrl, isoDay, payWithRazorpay, verifyPayment, type RazorpayOrder } from "@/lib/booking";
import { cn, formatINR } from "@/lib/utils";

export type CheckoutAddOn = { slug: string; title: string; summary: string; price: string; chargeType: string; bookable: boolean };

export type CheckoutProps = {
  villa: { slug: string; name: string; destination: string; photo: Photo | null; baseGuests: number; maxGuests: number; mode: "instant" | "request"; cancellation: string };
  addOns: CheckoutAddOn[];
  initial: { checkIn?: string; checkOut?: string; guests?: number };
  labels: { title: string; intro: string; requestIntro: string; payLabel: string; submitRequestLabel: string; termsNote: string };
  occasions: string[];
};

const inputClass =
  "mt-2 w-full rounded-[4px] border border-field bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-soft/80 focus:border-gold focus:ring-1 focus:ring-gold aria-[invalid=true]:border-error";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-7 first:border-t-0 first:pt-0">
      <h2 className="flex items-baseline gap-3 font-display text-[1.625rem] leading-tight font-medium">
        <span className="font-display text-[1.25rem] text-gold-deep lining-nums">{n}</span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ id, label, error, children, className }: { id: string; label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[0.9375rem] font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[0.875rem] font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** One-page checkout: stay, add-ons, guest details, then pay (instant) or send the request */
export function Checkout({ villa, addOns, initial, labels, occasions }: CheckoutProps) {
  const site = useSite();
  const router = useRouter();
  const unavailable = useAvailability(villa.slug);
  const [range, setRange] = useState<DateRange | undefined>(
    initial.checkIn && initial.checkOut ? { from: parseISO(initial.checkIn), to: parseISO(initial.checkOut) } : undefined,
  );
  const [guests, setGuests] = useState(Math.min(villa.maxGuests, initial.guests || villa.baseGuests));
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [payFull, setPayFull] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", occasion: "", note: "" });
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "working" | "paying">("idle");
  const [failure, setFailure] = useState("");

  const selectedAddOns = Object.entries(chosen).map(([slug, qty]) => ({ slug, qty }));
  const { quote, error: quoteError, loading } = useQuote(villa.slug, range, guests, { addOns: selectedAddOns, coupon: coupon || undefined, payFull });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (slug: string) => setChosen((c) => (c[slug] ? Object.fromEntries(Object.entries(c).filter(([k]) => k !== slug)) : { ...c, [slug]: 1 }));
  const qty = (slug: string, d: number) => setChosen((c) => ({ ...c, [slug]: Math.max(1, Math.min(20, (c[slug] ?? 1) + d)) }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!range?.from || !range.to) next.dates = "Choose your check-in and check-out dates.";
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email so we can send your confirmation.";
    if (!/^[+\d][\d\s-]{9,}$/.test(form.phone.trim())) next.phone = "Enter a 10-digit mobile number.";
    if (!accept) next.terms = "Please accept the terms to continue.";
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure("");
    if (!validate() || !quote) return;
    setState("working");
    const a = getAttribution();
    try {
      const res = await api<{ ref: string; key: string; status: string; order: RazorpayOrder | null }>("/bookings", {
        method: "POST",
        json: {
          villa: villa.slug,
          checkIn: isoDay(range!.from!),
          checkOut: isoDay(range!.to!),
          guests,
          addOns: selectedAddOns,
          coupon: coupon || undefined,
          payFull,
          occasion: form.occasion || undefined,
          guest: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), city: form.city.trim() || undefined, note: form.note.trim() || undefined },
          attribution: { source: a.source, medium: a.medium ?? "", campaign: a.campaign ?? "", label: describeAttribution(a) },
          acceptTerms: true,
        },
      });
      track("form_submit", { form: villa.mode === "instant" ? "booking_checkout" : "booking_request", villa: villa.slug });
      if (!res.order) {
        router.push(bookingUrl(res.ref, res.key));
        return;
      }
      setState("paying");
      try {
        const signed = await payWithRazorpay(res.order, site.name);
        await verifyPayment(res.ref, res.key, signed);
        track("form_submit", { form: "booking_paid", villa: villa.slug });
      } catch (err) {
        // Closed or failed: the dates stay held for a while and can be paid from the booking page
        if ((err as Error).message !== "dismissed") setFailure((err as Error).message);
      }
      router.push(bookingUrl(res.ref, res.key));
    } catch (err) {
      setState("idle");
      if (err instanceof ApiError) {
        if (err.details) setErrors(Object.fromEntries(Object.entries(err.details).map(([k, v]) => [k.replace(/^guest\./, ""), v[0]])));
        setFailure(err.message);
      } else setFailure("Something went wrong. Check your connection and try again.");
    }
  };

  const busy = state !== "idle";

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-14 xl:gap-16">
      <div className="min-w-0">
        <p className="max-w-2xl text-ink-soft">{villa.mode === "instant" ? labels.intro : labels.requestIntro}</p>

        <div className="mt-8">
          <Section n={1} title="Your stay">
            <div className="grid overflow-hidden rounded-[8px] border border-line sm:grid-cols-2">
              <DatesField
                id="co-dates"
                range={range}
                onChange={setRange}
                unavailable={unavailable}
                note="Struck-through dates are already booked."
                className="border-b border-line px-4 py-3 sm:border-r sm:border-b-0"
              />
              <GuestsField id="co-guests" value={guests} onChange={(v) => setGuests(Math.max(1, v))} max={villa.maxGuests} className="px-4 py-3" />
            </div>
            {(errors.dates || quoteError) && <p className="mt-2 text-[0.875rem] font-medium text-error">{errors.dates || quoteError}</p>}
            <p className="mt-2 text-[0.8125rem] text-ink-soft">
              Up to {villa.maxGuests} guests; the price covers {villa.baseGuests}, with a charge per extra guest.
            </p>
          </Section>

          {addOns.length > 0 && (
            <Section n={2} title="Add to your stay">
              <ul className="grid gap-3 sm:grid-cols-2">
                {addOns.map((a) => {
                  const on = Boolean(chosen[a.slug]);
                  return (
                    <li key={a.slug} className={cn("flex flex-col rounded-[8px] border p-4 transition-colors", on ? "border-gold bg-sand/50" : "border-line")}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={on} onChange={() => toggle(a.slug)} className="mt-1 size-4 accent-[var(--color-gold)]" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="font-semibold">{a.title}</span>
                            <span className="shrink-0 text-[0.875rem] font-semibold text-gold-deep">{a.price}</span>
                          </span>
                          <span className="mt-1 block text-[0.875rem] leading-relaxed text-ink-soft">{a.summary}</span>
                          {!a.bookable && <span className="mt-1 block text-[0.8125rem] text-ink-soft">Priced in your confirmation; nothing charged now.</span>}
                        </span>
                      </label>
                      {on && a.chargeType === "per_unit" && a.bookable && (
                        <div className="mt-3 flex items-center gap-2 pl-7">
                          <button type="button" aria-label={`Fewer ${a.title}`} onClick={() => qty(a.slug, -1)} className="grid size-8 place-items-center rounded-full border border-field">
                            <MinusIcon className="size-3.5" />
                          </button>
                          <span className="w-6 text-center tabular-nums">{chosen[a.slug]}</span>
                          <button type="button" aria-label={`More ${a.title}`} onClick={() => qty(a.slug, 1)} className="grid size-8 place-items-center rounded-full border border-field">
                            <PlusIcon className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          <Section n={addOns.length ? 3 : 2} title="Your details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="co-name" label="Full name" error={errors.name}>
                <input id="co-name" autoComplete="name" value={form.name} onChange={set("name")} className={inputClass} aria-invalid={!!errors.name} />
              </Field>
              <Field id="co-phone" label="Mobile number" error={errors.phone}>
                <input id="co-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" value={form.phone} onChange={set("phone")} className={inputClass} aria-invalid={!!errors.phone} />
              </Field>
              <Field id="co-email" label="Email" error={errors.email}>
                <input id="co-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} className={inputClass} aria-invalid={!!errors.email} />
              </Field>
              <Field id="co-city" label="City (optional)">
                <input id="co-city" autoComplete="address-level2" value={form.city} onChange={set("city")} className={inputClass} />
              </Field>
              <div className="rounded-[4px] border border-field px-4 py-2.5 sm:col-span-2">
                <SelectField
                  id="co-occasion"
                  label="Occasion (optional)"
                  value={form.occasion}
                  onChange={(v) => setForm((f) => ({ ...f, occasion: v }))}
                  options={occasions.map((o) => ({ value: o, label: o }))}
                  placeholder="Just a getaway"
                />
              </div>
              <Field id="co-note" label="Anything we should know? (optional)" className="sm:col-span-2">
                <textarea id="co-note" rows={3} value={form.note} onChange={set("note")} className={cn(inputClass, "resize-y")} placeholder="Arrival time, dietary needs, a surprise you're planning…" />
              </Field>
            </div>
          </Section>
        </div>
      </div>

      <aside className="lg:pt-0">
        <div className="sticky top-28 overflow-hidden rounded-[8px] border border-line bg-white shadow-[0_30px_60px_-40px_rgb(42_36_27/0.45)]">
          <div className="flex items-center gap-4 border-b border-line p-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-[6px] bg-sand-deep">
              {villa.photo && <Image src={villa.photo.src} alt={villa.photo.alt} fill sizes="80px" className="object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-[0.75rem] font-semibold tracking-[0.12em] text-gold-deep uppercase">{villa.destination}</p>
              <p className="truncate font-display text-[1.375rem] leading-tight font-medium">
                <Link href={`/villas/${villa.slug}`} className="hover:text-gold">
                  {villa.name}
                </Link>
              </p>
              {quote && (
                <p className="text-[0.875rem] text-ink-soft">
                  {quote.nights} night{quote.nights === 1 ? "" : "s"} · {quote.guests} guest{quote.guests === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-5 p-5">
            {quote ? (
              <div className={cn("transition-opacity", loading && "opacity-60")}>
                <PriceSummary pricing={quote.pricing} addOns={quote.addOns} plan={quote.plan} />
              </div>
            ) : (
              <p className="text-[0.9375rem] text-ink-soft">{loading ? "Working out the price…" : "Choose your dates to see the price."}</p>
            )}

            {quote?.plan.choice && (
              <fieldset className="grid grid-cols-2 gap-2">
                <legend className="sr-only">How much to pay now</legend>
                {[
                  { full: false, label: `Pay ${quote.plan.advanceOption}% now` },
                  { full: true, label: "Pay in full" },
                ].map((o) => (
                  <label key={o.label} className={cn("cursor-pointer rounded-full border px-3 py-2 text-center text-[0.875rem] font-semibold", payFull === o.full ? "border-gold bg-gold text-white" : "border-line")}>
                    <input type="radio" name="payFull" className="sr-only" checked={payFull === o.full} onChange={() => setPayFull(o.full)} />
                    {o.label}
                  </label>
                ))}
              </fieldset>
            )}

            <div>
              <div className="flex gap-2">
                <input
                  aria-label="Coupon code"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="h-11 min-w-0 flex-1 rounded-full border border-field px-4 text-[0.9375rem] uppercase outline-none focus:border-gold"
                />
                <button type="button" onClick={() => setCoupon(couponInput.trim())} className="h-11 shrink-0 rounded-full border border-ink/70 px-4 text-[0.875rem] font-semibold hover:bg-ink hover:text-white">
                  Apply
                </button>
              </div>
              {coupon && quote?.couponError && <p className="mt-1.5 text-[0.8125rem] font-medium text-error">{quote.couponError}</p>}
              {coupon && quote?.pricing.couponCode && <p className="mt-1.5 text-[0.8125rem] font-medium text-success">{quote.pricing.couponCode} applied</p>}
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3 text-[0.875rem] text-ink-soft">
                <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-gold)]" aria-invalid={!!errors.terms} />
                <span>
                  {labels.termsNote}{" "}
                  <Link href="/policies/terms" target="_blank" className="font-semibold text-gold-deep underline">
                    Terms
                  </Link>{" "}
                  ·{" "}
                  <Link href="/policies/cancellation-refund" target="_blank" className="font-semibold text-gold-deep underline">
                    Cancellation
                  </Link>
                  {villa.cancellation && <span className="mt-1 block">{villa.cancellation}</span>}
                </span>
              </label>
              {errors.terms && <p className="mt-1.5 text-[0.8125rem] font-medium text-error">{errors.terms}</p>}
            </div>

            {failure && (
              <p className="rounded-[6px] bg-error/10 px-3 py-2 text-[0.875rem] font-medium text-error" role="alert">
                {failure}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={busy || !quote || Boolean(quoteError)}
              icon={busy ? <CircleNotchIcon className="size-5 animate-spin" /> : villa.mode === "instant" ? <LockSimpleIcon className="size-5" /> : undefined}
            >
              {state === "paying"
                ? "Waiting for payment"
                : villa.mode === "instant"
                  ? `${labels.payLabel}${quote ? ` · ${formatINR(quote.plan.dueNow)}` : ""}`
                  : labels.submitRequestLabel}
            </Button>
            {villa.mode === "instant" && <p className="text-center text-[0.8125rem] text-ink-soft">Secure payment by Razorpay: UPI, cards and net banking.</p>}
          </div>
        </div>
      </aside>
    </form>
  );
}
