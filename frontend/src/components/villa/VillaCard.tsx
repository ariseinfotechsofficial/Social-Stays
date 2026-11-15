import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { EnquireTrigger } from "@/components/enquiry/EnquiryDialog";
import { buttonClasses } from "@/components/ui/Button";
import type { Villa } from "@/data/types";
import { destinationName, fill, getContent, labels, type SectionData } from "@/lib/content";
import { cn, formatINR } from "@/lib/utils";

/** Short pills for the listing grid, most distinctive first. Labels come from the admin (villa card text and amenity names). */
export function villaPills(v: Villa, max = 4, t?: SectionData, amenityLabel: (key: string) => string | undefined = () => undefined) {
  const has = (key: Villa["amenities"][number]) => v.amenities.includes(key);
  const label = (key: string, fallback: string) => amenityLabel(key) ?? fallback;
  return [
    v.privatePool && (t?.text("pillPool", "Private pool") ?? "Private pool"),
    has("lawn") && has("bonfire") ? "Lawn & bonfire" : has("lawn") ? label("lawn", "Lawn") : has("bonfire") && label("bonfire", "Bonfire"),
    has("events") && (t?.text("pillEvents", "Event lawn") ?? "Event lawn"),
    has("view") && label("view", "Views"),
    has("terrace") && label("terrace", "Terrace"),
    v.petFriendly && (t?.text("pillPets", "Pets OK") ?? "Pets OK"),
  ]
    .filter((p): p is string => Boolean(p))
    .slice(0, max);
}

type Props = {
  villa: Villa;
  sizes?: string;
  /** Shared-element morph into the villa page. Turn off where the same villa can appear twice. */
  morph?: boolean;
  priority?: boolean;
  /** Portrait for the home carousel; landscape for grids, which are scanned rather than browsed */
  ratio?: "portrait" | "landscape";
  /** Villas listing: one row of amenity pills, then "View villa" and "Check dates" pinned to the bottom */
  detailed?: boolean;
  className?: string;
};

export async function VillaCard({ villa, sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 88vw", morph = true, priority, ratio = "portrait", detailed, className }: Props) {
  const c = await getContent();
  const cover = villa.photos[0];
  const soon = villa.status === "coming-soon";
  const destination = destinationName(c, villa.destination);
  const t = labels(c, "villa");
  const badge = soon ? (villa.openingNote ?? t.text("comingSoonBadge", "Coming soon")) : villa.badge;
  const fromLabel = soon ? t.text("soonFromLabel", "Expected from") : t.text("fromLabel", "from");
  const perNight = t.text("perNightLabel", "per night");
  const facts = fill(t.text("cardFacts", "{bedrooms} bedrooms · up to {guests} guests · {baths} baths"), { bedrooms: villa.bedrooms, guests: villa.guests.max, baths: villa.bathrooms });
  const datesLabel = t.text("cardDatesLabel", "Check dates");
  const amenityLabel = (key: string) => c.amenities.find((a) => a.key === key)?.label;
  const img = cover ? (
    <Image
      src={cover.src}
      alt={cover.alt}
      fill
      sizes={sizes}
      preload={priority}
      className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.045]"
    />
  ) : null;

  return (
    <article className={cn("group relative", detailed && "flex h-full flex-col", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-photo bg-sand-deep transition-shadow duration-500 ease-out-expo group-hover:shadow-[0_28px_50px_-30px_rgb(42_36_27/0.6)]",
          ratio === "portrait" ? "aspect-[4/5]" : "aspect-[4/3]",
        )}
      >
        {morph ? (
          <ViewTransition name={`villa-${villa.slug}`} share="morph" default="none">
            {img}
          </ViewTransition>
        ) : (
          img
        )}
        {badge && (
          <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3.5 py-1.5 text-[0.75rem] font-semibold tracking-[0.12em] text-gold-deep uppercase">
            {badge}
          </span>
        )}
      </div>
      {detailed ? (
        <div className="mt-4 flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[0.8125rem] font-semibold tracking-[0.14em] text-gold-deep uppercase">{destination}</p>
              <h3 className="mt-1 truncate font-display text-[1.625rem] leading-tight font-medium">
                <Link href={`/villas/${villa.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-gold">
                  {villa.name}
                </Link>
              </h3>
            </div>
            <p className="shrink-0 text-right">
              <span className="block text-[0.8125rem] text-ink-soft">{fromLabel}</span>
              <span className="type-price text-[1.375rem] leading-tight">{formatINR(villa.priceFrom)}</span>
              <span className="block text-[0.8125rem] text-ink-soft">{perNight}</span>
            </p>
          </div>
          <p className="mt-2 text-[0.9375rem] text-ink-soft">
            {facts}
          </p>
          {/* One row only, so every card in a row ends at the same height */}
          <ul className="mt-3 mb-5 flex gap-1.5 overflow-hidden">
            {villaPills(villa, 3, t, amenityLabel).map((p) => (
              <li key={p} className="shrink-0 rounded-full bg-sand px-3 py-1 text-[0.8125rem] font-medium whitespace-nowrap">
                {p}
              </li>
            ))}
          </ul>
          {/* Pinned to the bottom, above the card's stretched link */}
          <div className="relative z-10 mt-auto grid grid-cols-2 gap-2.5 border-t border-line pt-4">
            <Link href={`/villas/${villa.slug}`} className={buttonClasses("outline", "sm", cn("w-full", soon && "col-span-2"))}>
              {t.text("cardViewLabel", "View villa")}
            </Link>
            {!soon && (
              <EnquireTrigger
                className={buttonClasses("primary", "sm", "w-full")}
                prefill={{ title: datesLabel, villa: { name: villa.name, slug: villa.slug, destination, maxGuests: villa.guests.max, whatsappNumber: villa.whatsappNumber } }}
              >
                {datesLabel}
              </EnquireTrigger>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[0.8125rem] font-semibold tracking-[0.14em] text-gold-deep uppercase">{destination}</p>
              <h3 className="mt-1 font-display text-[1.625rem] leading-tight font-medium">
                <Link href={`/villas/${villa.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-gold">
                  {villa.name}
                </Link>
              </h3>
            </div>
            <p className="shrink-0 pt-1 text-right">
              <span className="block text-[0.8125rem] text-ink-soft">{fromLabel}</span>
              <span className="type-price text-[1.375rem] leading-none">{formatINR(villa.priceFrom)}</span>
              <span className="block text-[0.8125rem] text-ink-soft">{perNight}</span>
            </p>
          </div>
          <p className="mt-1.5 text-[0.9375rem] text-ink-soft">
            {facts}
          </p>
        </>
      )}
    </article>
  );
}
