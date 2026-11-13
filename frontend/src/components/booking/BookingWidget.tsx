"use client";

import { CircleNotchIcon, LightningIcon } from "@phosphor-icons/react/dist/ssr";
import { addDays, format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { useEnquiry } from "@/components/enquiry/EnquiryDialog";
import { DatesField, GuestsField } from "@/components/enquiry/fields";
import { CallLink } from "@/components/layout/ContactLinks";
import { useSite } from "@/components/layout/SiteProvider";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { getAvailability, getQuote, isoDay, type Quote } from "@/lib/booking";
import { cn, formatINR } from "@/lib/utils";

export type BookableVilla = {
  slug: string;
  name: string;
  destination: string;
  priceFrom: number;
  weekendPrice?: number;
  baseGuests: number;
  maxGuests: number;
  mode: "instant" | "request";
  whatsappNumber?: string;
};

export type BookingLabels = { bookLabel: string; requestLabel: string; orEnquire: string; cardNote: string; callPrompt: string };

/** Booked nights for the next year, fetched once per villa page */
export function useAvailability(slug: string) {
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  useEffect(() => {
    const from = isoDay(new Date());
    getAvailability(slug, from, isoDay(addDays(new Date(), 365)))
      .then((r) => setUnavailable(new Set(r.unavailable)))
      .catch(() => {});
  }, [slug]);
  return unavailable;
}

/** Live price for a stay; re-quotes whenever the inputs change. Keeps the last price on screen while the next one loads. */
export function useQuote(villa: string, range: DateRange | undefined, guests: number, extra: { addOns?: { slug: string; qty?: number }[]; coupon?: string; payFull?: boolean } = {}) {
  const [result, setResult] = useState<{ key: string; quote: Quote | null; error: string }>({ key: "", quote: null, error: "" });
  const checkIn = range?.from && isoDay(range.from);
  const checkOut = range?.to && isoDay(range.to);
  const complete = Boolean(checkIn && checkOut && guests);
  const key = JSON.stringify([villa, checkIn, checkOut, guests, extra]);

  useEffect(() => {
    if (!complete) return;
    const [v, ci, co, g, x] = JSON.parse(key) as [string, string, string, number, typeof extra];
    let cancelled = false;
    const t = setTimeout(() => {
      getQuote({ villa: v, checkIn: ci, checkOut: co, guests: g, ...x })
        .then((quote) => !cancelled && setResult({ key, quote, error: "" }))
        .catch((e) => !cancelled && setResult({ key, quote: null, error: e instanceof ApiError ? e.message : "Couldn't get a price. Try again." }));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [key, complete]);

  const fresh = result.key === key;
  return { quote: complete ? result.quote : null, error: complete && fresh ? result.error : "", loading: complete && !fresh };
}

/** Sidebar card on bookable villas: dates and guests, a live price, then on to checkout */
export function BookingWidget({ villa, labels }: { villa: BookableVilla; labels: BookingLabels }) {
  const site = useSite();
  const router = useRouter();
  const { openEnquiry } = useEnquiry();
  const unavailable = useAvailability(villa.slug);
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(villa.baseGuests);
  const { quote, error, loading } = useQuote(villa.slug, range, guests);
  const ready = Boolean(quote && !error);

  const href = useMemo(() => {
    const p = new URLSearchParams({ villa: villa.slug, guests: String(guests) });
    if (range?.from) p.set("in", isoDay(range.from));
    if (range?.to) p.set("out", isoDay(range.to));
    return `/booking/checkout?${p}`;
  }, [villa.slug, guests, range]);

  const cell = "px-4 py-3 border-b border-line";

  return (
    <div className="overflow-hidden rounded-[8px] border border-line bg-white shadow-[0_30px_60px_-40px_rgb(42_36_27/0.45)]">
      <div className="px-5 pt-6 pb-4">
        {quote ? (
          <p className="flex items-baseline gap-2">
            <span className="type-price text-[2rem] leading-none">{formatINR(quote.pricing.total)}</span>
            <span className="text-[0.875rem] text-ink-soft">
              for {quote.nights} night{quote.nights === 1 ? "" : "s"}
            </span>
          </p>
        ) : (
          <p className="flex items-baseline gap-2">
            <span className="text-[0.875rem] text-ink-soft">From</span>
            <span className="type-price text-[2rem] leading-none">{formatINR(villa.priceFrom)}</span>
            <span className="text-[0.875rem] text-ink-soft">/ night</span>
          </p>
        )}
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-ink-soft">
          {villa.mode === "instant" && <LightningIcon weight="fill" className="size-3.5 text-gold" aria-hidden />}
          {villa.mode === "instant" ? "Instant confirmation" : "Confirmed by our team, usually within a few hours"}
          {villa.weekendPrice && !quote ? `; weekends ${formatINR(villa.weekendPrice)}` : ""}
        </p>
      </div>

      <div className="border-t border-line">
        <DatesField id="book-dates" range={range} onChange={setRange} className={cell} unavailable={unavailable} note="Struck-through dates are already booked." />
        <GuestsField id="book-guests" value={guests} onChange={setGuests} max={villa.maxGuests} className={cell} />
      </div>

      <div className="px-5 pt-4" aria-live="polite">
        {loading && !quote && (
          <p className="flex items-center gap-2 text-[0.875rem] text-ink-soft">
            <CircleNotchIcon className="size-4 animate-spin" /> Checking price
          </p>
        )}
        {error && <p className="text-[0.875rem] font-medium text-error">{error}</p>}
        {quote && (
          <div className={cn("transition-opacity", loading && "opacity-60")}>
            <PriceSummary pricing={quote.pricing} plan={quote.plan} compact />
          </div>
        )}
        {!range?.to && !error && <p className="text-[0.875rem] text-ink-soft">Add your dates to see the full price.</p>}
      </div>

      <div className="space-y-3 px-5 pt-5 pb-6">
        <Button size="lg" className="w-full" disabled={!ready && Boolean(range?.to)} onClick={() => router.push(href)}>
          {villa.mode === "instant" ? labels.bookLabel : labels.requestLabel}
        </Button>
        <button
          type="button"
          className="w-full text-center text-[0.9375rem] font-semibold text-gold-deep underline-offset-4 hover:underline"
          onClick={() =>
            openEnquiry({
              title: `Ask about ${villa.name}`,
              villa: { name: villa.name, slug: villa.slug, destination: villa.destination, maxGuests: villa.maxGuests, whatsappNumber: villa.whatsappNumber },
            })
          }
        >
          {labels.orEnquire}
        </button>
        <p className="pt-1 text-[0.8125rem] text-ink-soft">
          {labels.callPrompt}{" "}
          <CallLink placement="villa_booking_card" className="font-semibold text-gold-deep underline-offset-4 hover:underline">
            Call {site.phone.display}
          </CallLink>
        </p>
        {range?.from && range.to && quote?.plan.balanceDueDate && (
          <p className="text-[0.8125rem] text-ink-soft">
            Check-in {format(range.from, "EEE d MMM")}. Balance due {format(parseISO(quote.plan.balanceDueDate), "d MMM")}.
          </p>
        )}
      </div>
    </div>
  );
}
