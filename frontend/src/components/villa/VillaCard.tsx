import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { destinationName } from "@/data/destinations";
import { photo } from "@/data/photos";
import type { Villa } from "@/data/types";
import { cn, formatINR } from "@/lib/utils";

export function villaFactsLine(v: Villa) {
  const parts = [`${v.bedrooms} bedrooms`, `sleeps ${v.guests.max}`];
  if (v.privatePool) parts.push("private pool");
  if (v.petFriendly) parts.push("pets welcome");
  return parts.join(", ").replace(/^./, (c) => c.toUpperCase());
}

type Props = {
  villa: Villa;
  sizes?: string;
  /** Shared-element morph into the villa page. Turn off where the same villa can appear twice. */
  morph?: boolean;
  priority?: boolean;
  /** Portrait for the home carousel; landscape for grids, which are scanned rather than browsed */
  ratio?: "portrait" | "landscape";
  className?: string;
};

export function VillaCard({ villa, sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 88vw", morph = true, priority, ratio = "portrait", className }: Props) {
  const cover = photo(villa.photos[0]);
  const soon = villa.status === "coming-soon";
  const img = (
    <Image
      src={cover.src}
      alt={cover.alt}
      fill
      sizes={sizes}
      preload={priority}
      className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.045]"
    />
  );

  return (
    <article className={cn("group relative", className)}>
      <div className={cn("relative overflow-hidden rounded-photo bg-sand-deep", ratio === "portrait" ? "aspect-[4/5]" : "aspect-[4/3]")}>
        {morph ? (
          <ViewTransition name={`villa-${villa.slug}`} share="morph" default="none">
            {img}
          </ViewTransition>
        ) : (
          img
        )}
        {soon && (
          <span className="absolute top-4 left-4 rounded-full bg-white px-3.5 py-1.5 text-[0.8125rem] font-semibold text-ink">
            {villa.openingNote ?? "Coming soon"}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[0.875rem] font-medium text-gold-deep">{destinationName(villa.destination)}</p>
          <h3 className="mt-0.5 font-display text-[1.625rem] leading-tight font-medium">
            <Link href={`/villas/${villa.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-gold">
              {villa.name}
            </Link>
          </h3>
        </div>
        <p className="shrink-0 pt-1 text-right">
          <span className="block text-[0.8125rem] text-ink-soft">{soon ? "Expected from" : "From"}</span>
          <span className="type-price text-[1.375rem] leading-none">{formatINR(villa.priceFrom)}</span>
          <span className="block text-[0.8125rem] text-ink-soft">per night</span>
        </p>
      </div>
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">{villaFactsLine(villa)}</p>
    </article>
  );
}
