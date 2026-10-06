"use client";

import { ArrowLeftIcon, ArrowRightIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import { m, AnimatePresence } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type ReviewItem = { id: string; text: string; name: string; meta: string; rating: number };

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5 text-brass", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} weight={i < Math.round(rating) ? "fill" : "regular"} className="size-4" />
      ))}
    </span>
  );
}

/** One large quote at a time; arrows step through, the quote cross-fades and rises. */
export function ReviewCarousel({ reviews, summary }: { reviews: ReviewItem[]; summary?: { score: number; count: number; source: string } }) {
  const [i, setI] = useState(0);
  const review = reviews[i];
  const go = (d: number) => setI((n) => (n + d + reviews.length) % reviews.length);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-16">
      <div className="flex flex-col justify-between gap-6 lg:gap-10">
        <div>
          <h2 className="type-display-l">From recent guests</h2>
          {summary && (
            <p className="mt-4 flex items-center gap-3 text-ink-soft">
              <Stars rating={summary.score} />
              <span>
                <strong className="font-semibold text-ink">{summary.score}</strong> from {summary.count}+ {summary.source} reviews
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => go(-1)} aria-label="Previous review" className="grid size-12 place-items-center rounded-full border border-ink/25 transition-colors hover:bg-ink hover:text-white">
            <ArrowLeftIcon className="size-4" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next review" className="grid size-12 place-items-center rounded-full border border-ink/25 transition-colors hover:bg-ink hover:text-white">
            <ArrowRightIcon className="size-4" />
          </button>
          <span className="ml-2 text-[0.9375rem] text-ink-soft tabular-nums" aria-live="polite">
            {i + 1} of {reviews.length}
          </span>
        </div>
      </div>

      <div className="relative min-h-[17rem] sm:min-h-[13rem] lg:min-h-[14rem]">
        <AnimatePresence mode="wait" initial={false}>
          <m.figure
            key={review.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <blockquote className="font-display-italic text-[1.5rem] leading-[1.32] sm:text-[1.875rem] lg:text-[2.125rem]">
              “{review.text}”
            </blockquote>
            <figcaption className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold">{review.name}</span>
              <span className="text-ink-soft">{review.meta}</span>
            </figcaption>
          </m.figure>
        </AnimatePresence>
      </div>
    </div>
  );
}
