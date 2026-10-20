"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Stars, type ReviewItem } from "@/components/shared/Reviews";
import type { Photo } from "@/data/photos";

/** How long each review stays up before the next one fades in */
const INTERVAL = 7000;

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * One full-width guest photo with a review card over it. Reviews advance on their own
 * and with the arrows; the timer holds while the pointer or focus is on the card.
 */
export function ReviewSpotlight({ reviews, photo }: { reviews: ReviewItem[]; photo: Photo }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const review = reviews[i];
  const go = (d: number) => setI((n) => (n + d + reviews.length) % reviews.length);

  useEffect(() => {
    if (reduce || paused || reviews.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % reviews.length), INTERVAL);
    return () => clearTimeout(t);
  }, [i, reduce, paused, reviews.length]);

  return (
    <div className="relative overflow-hidden rounded-[14px] bg-night">
      <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/8]">
        <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover object-[30%_50%] sm:object-[50%_45%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-night/10 to-night/0 sm:bg-gradient-to-l sm:from-night/45 sm:via-night/5" />
      </div>

      <div
        className="absolute inset-x-3 bottom-3 rounded-[12px] bg-white/85 p-5 shadow-lg backdrop-blur-md sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[25rem] sm:p-6 lg:right-6 lg:bottom-6 lg:w-[26rem]"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="min-h-[11.5rem] sm:min-h-[12.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <m.figure
              key={review.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease }}
            >
              <Stars rating={review.rating} className="[&_svg]:size-6" />
              <blockquote className="mt-3 line-clamp-5 font-display text-[1.125rem] leading-snug sm:text-[1.25rem]">“{review.text}”</blockquote>
              <figcaption className="mt-4">
                <span className="block font-semibold">{review.name}</span>
                <span className="block text-[0.875rem] text-ink-soft">{review.meta}</span>
              </figcaption>
            </m.figure>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-ink/10 pt-4">
          <button type="button" onClick={() => go(-1)} aria-label="Previous review" className="grid size-10 place-items-center rounded-full border border-ink/25 transition-colors hover:bg-ink hover:text-white">
            <ArrowLeftIcon className="size-4" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next review" className="grid size-10 place-items-center rounded-full border border-ink/25 transition-colors hover:bg-ink hover:text-white">
            <ArrowRightIcon className="size-4" />
          </button>
          <span className="ml-1 text-[0.875rem] text-ink-soft tabular-nums" aria-live="polite">
            {i + 1} of {reviews.length}
          </span>
        </div>
      </div>
    </div>
  );
}
