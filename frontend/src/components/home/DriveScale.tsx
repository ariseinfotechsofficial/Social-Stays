"use client";

import { m, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Photo } from "@/data/photos";
import { cn, formatDriveTime, formatINR } from "@/lib/utils";

export type ScaleStop = {
  slug: string;
  name: string;
  minutes: number;
  km: number;
  villas: number;
  priceFrom: number;
  tagline: string;
  photo: Photo;
};

const MAX = 150; // minutes shown on the scale
const TICKS = [0, 30, 60, 90, 120, 150];
const ease = [0.16, 1, 0.3, 1] as const;

const CARD = 16; // card width, % of the scale
const pct = (m: number) => (m / MAX) * 100;
/** Left edge of a card centred on its stop, kept inside the scale */
const cardLeft = (m: number) => Math.min(Math.max(pct(m) - CARD / 2, 0), 100 - CARD);
/** Where the connector sits inside the card, so it always points at the stop */
const connector = (m: number) => `${((pct(m) - cardLeft(m)) / CARD) * 100}%`;

function StopCard({ stop, compact = false }: { stop: ScaleStop; compact?: boolean }) {
  return (
    <Link href={`/destinations/${stop.slug}`} className={cn("group", compact ? "flex items-center gap-5" : "block")}>
      <div className={cn("relative overflow-hidden rounded-t-full bg-sand-deep", compact ? "aspect-[4/5] w-24 shrink-0" : "aspect-[4/5] w-full")}>
        <Image
          src={stop.photo.src}
          alt={stop.photo.alt}
          fill
          sizes={compact ? "96px" : "(min-width: 1024px) 15vw, 40vw"}
          className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
        />
      </div>
      <div className={compact ? "min-w-0" : "mt-3.5"}>
        <h3 className="font-display text-[1.5rem] leading-tight font-medium transition-colors group-hover:text-gold xl:text-[1.625rem]">{stop.name}</h3>
        <p className="mt-0.5 text-[0.875rem] text-ink-soft">
          {formatDriveTime(stop.minutes)}, {stop.km} km
        </p>
        <p className="text-[0.875rem] text-ink-soft">
          {stop.villas} {stop.villas === 1 ? "villa" : "villas"} from {formatINR(stop.priceFrom)}
        </p>
      </div>
    </Link>
  );
}

/**
 * The signature section: the four destinations placed on a drive-time scale from Indore.
 * Hovering a destination draws the route along the line.
 */
export function DriveScale({ stops, heading, note }: { stops: ScaleStop[]; heading: React.ReactNode; note?: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);
  const sorted = [...stops].sort((a, b) => a.minutes - b.minutes);
  const activeStop = sorted.find((s) => s.slug === active);
  const view = { once: true, amount: 0.35 } as const;

  return (
    <>
      {/* Large screens: horizontal scale, cards alternate above and below the line */}
      <div className="mb-10 lg:hidden">{heading}</div>
      <div className="relative hidden lg:block" onMouseLeave={() => setActive(null)}>
        <div className="relative h-[23rem] xl:h-[24.5rem]">
          <div className="absolute top-0 left-0 w-[36%]">{heading}</div>
          {sorted.map((s, i) =>
            i % 2 === 0 ? (
              <m.div
                key={s.slug}
                className="absolute bottom-0"
                style={{ left: `${cardLeft(s.minutes)}%`, width: `${CARD}%` }}
                onMouseEnter={() => setActive(s.slug)}
                onFocus={() => setActive(s.slug)}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={view}
                transition={{ duration: 1, ease, delay: 0.5 + i * 0.12 }}
              >
                <StopCard stop={s} />
                <div className="mt-3 h-6 w-px bg-ink/20" style={{ marginLeft: connector(s.minutes) }} />
              </m.div>
            ) : null,
          )}
        </div>

        {/* The line */}
        <div className="relative my-1 h-12">
          <m.div
            className="absolute top-1/2 right-0 left-0 h-px origin-left bg-ink/25"
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={view}
            transition={{ duration: 1.6, ease }}
          />
          <div
            className="absolute top-1/2 left-0 h-[2px] -translate-y-px bg-gold transition-[width] duration-700 ease-out-expo"
            style={{ width: activeStop ? `${pct(activeStop.minutes)}%` : "0%" }}
          />
          {TICKS.map((t) => (
            <div key={t} className="absolute top-1/2 -translate-x-1/2" style={{ left: `${pct(t)}%` }}>
              {t === 0 ? (
                <div className="-translate-y-1/2">
                  <span className="block size-3.5 rounded-full bg-ink" />
                </div>
              ) : (
                <span className="block h-2.5 w-px -translate-y-1/2 bg-ink/30" />
              )}
              <span className={cn("absolute top-5 left-1/2 -translate-x-1/2 text-[0.8125rem] whitespace-nowrap", t === 0 ? "font-semibold text-ink" : "text-ink-soft")}>
                {t === 0 ? "Indore" : formatDriveTime(t)}
              </span>
            </div>
          ))}
          {sorted.map((s) => (
            <span
              key={s.slug}
              aria-hidden
              onMouseEnter={() => setActive(s.slug)}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-2"
              style={{ left: `${pct(s.minutes)}%` }}
            >
              <span className={cn("block rounded-full border-2 border-gold transition-all duration-500 ease-out-expo", active === s.slug ? "size-5 bg-gold" : "size-3.5 bg-white")} />
            </span>
          ))}
        </div>

        <div className="relative h-[21.5rem] xl:h-[23rem]">
          {note && <div className="absolute bottom-0 left-0 w-[30%]">{note}</div>}
          {sorted.map((s, i) =>
            i % 2 === 1 ? (
              <m.div
                key={s.slug}
                className="absolute top-0"
                style={{ left: `${cardLeft(s.minutes)}%`, width: `${CARD}%` }}
                onMouseEnter={() => setActive(s.slug)}
                onFocus={() => setActive(s.slug)}
                initial={reduce ? false : { opacity: 0, y: -30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 1, ease, delay: 0.5 + i * 0.12 }}
              >
                <div className="mb-3 h-6 w-px bg-ink/20" style={{ marginLeft: connector(s.minutes) }} />
                <StopCard stop={s} />
              </m.div>
            ) : null,
          )}
        </div>
      </div>

      {/* Phones and tablets: vertical route */}
      <ol className="relative lg:hidden">
        <li className="relative flex items-center gap-4 pb-6 pl-10">
          <span className="absolute top-1/2 left-[0.4375rem] size-3.5 -translate-y-1/2 rounded-full bg-ink" />
          <span className="font-semibold">Indore</span>
        </li>
        <span aria-hidden className="absolute top-3 bottom-[3.75rem] left-[0.84rem] w-px bg-ink/20" />
        {sorted.map((s) => (
          <li key={s.slug} className="relative pb-6 pl-10 last:pb-0">
            <span className="absolute top-1/2 left-[0.4375rem] size-3.5 -translate-y-1/2 rounded-full border-2 border-gold bg-white" />
            <StopCard stop={s} compact />
          </li>
        ))}
      </ol>
      {note && <div className="mt-10 lg:hidden">{note}</div>}
    </>
  );
}
