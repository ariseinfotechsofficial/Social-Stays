"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useDragScroll } from "@/components/motion/useDragScroll";
import { Stars } from "@/components/shared/Reviews";
import type { Photo } from "@/data/photos";
import { cn } from "@/lib/utils";

export type ReelItem = { id: string; text: string; name: string; meta: string; rating: number; photo: Photo };

/** Auto-scroll speed, px per second */
const SPEED = 36;
/** How long the strip waits after someone scrolls it by hand before drifting again */
const RESUME_AFTER = 2500;

function Reel({ reel, hidden }: { reel: ReelItem; hidden?: boolean }) {
  return (
    <li aria-hidden={hidden || undefined} className="relative aspect-[3/5] w-[15rem] shrink-0 overflow-hidden rounded-[14px] bg-night sm:w-[17rem] lg:w-[18.5rem]">
      <Image src={reel.photo.src} alt={hidden ? "" : reel.photo.alt} fill sizes="300px" draggable={false} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/55 to-night/0" />
      <figure className="absolute inset-x-0 bottom-0 p-5 text-white lg:p-6">
        <Stars rating={reel.rating} />
        <blockquote className="mt-3 line-clamp-6 text-[0.9375rem] leading-relaxed text-white/90">“{reel.text}”</blockquote>
        <figcaption className="mt-4 border-t border-white/20 pt-3">
          <span className="block font-display text-[1.25rem] leading-tight font-medium">{reel.name}</span>
          <span className="mt-0.5 block text-[0.8125rem] text-white/70">{reel.meta}</span>
        </figcaption>
      </figure>
    </li>
  );
}

/**
 * Guest reviews on tall villa photos (StayVista-style reels). The strip drifts sideways in an
 * endless loop and can also be scrolled by hand: swipe, trackpad, Shift + wheel or drag.
 * Drifting pauses while the pointer is over it or someone is scrolling, then picks up again.
 */
export function ReviewReels({ reels }: { reels: ReelItem[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  const pausedUntil = useRef(0);
  const hovering = useRef(false);
  const { dragging, handlers } = useDragScroll(ref, () => {
    pausedUntil.current = performance.now() + RESUME_AFTER;
  });

  // Two identical halves; the loop jumps back by one half, which looks seamless.
  // Each half must be wider than the widest screen.
  const half = reels.length < 10 ? [...reels, ...reels] : reels;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let pos = el.scrollLeft;
    let lastSet = pos;
    let last = performance.now();
    let frame = 0;

    /** Width of one half: where the second copy starts */
    const loopWidth = () => {
      const second = el.children[half.length] as HTMLElement | undefined;
      const first = el.children[0] as HTMLElement | undefined;
      return second && first ? second.offsetLeft - first.offsetLeft : 0;
    };

    const wrap = () => {
      const w = loopWidth();
      if (!w) return;
      if (pos >= w) pos -= w;
      else if (pos < 1) pos += w;
      el.scrollLeft = pos;
      lastSet = el.scrollLeft;
    };

    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const busy = hovering.current || now < pausedUntil.current || el.contains(document.activeElement);
      if (!reduce && !busy) {
        pos += (SPEED * dt) / 1000;
        if (pos >= loopWidth()) wrap();
        else {
          el.scrollLeft = pos;
          lastSet = el.scrollLeft;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    // Anything that moved the strip other than the drift is a person scrolling it
    const onScroll = () => {
      if (Math.abs(el.scrollLeft - lastSet) <= 1) return;
      pos = el.scrollLeft;
      pausedUntil.current = performance.now() + RESUME_AFTER;
      wrap();
    };

    // A finger resting on the strip holds it still
    const onTouchStart = () => {
      pausedUntil.current = Infinity;
    };
    const onTouchEnd = () => {
      pausedUntil.current = performance.now() + RESUME_AFTER;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [reduce, half.length]);

  return (
    <ul
      ref={ref}
      role="region"
      aria-label="Guest reviews"
      tabIndex={0}
      {...handlers}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hovering.current = true;
      }}
      onPointerLeave={() => {
        hovering.current = false;
      }}
      className={cn(
        "no-scrollbar flex gap-4 overflow-x-auto overscroll-x-contain px-5 outline-none focus-visible:ring-2 focus-visible:ring-gold md:px-8 lg:gap-5",
        dragging ? "cursor-grabbing select-none" : "cursor-grab",
      )}
    >
      {half.map((r, i) => (
        <Reel key={`a-${i}`} reel={r} hidden={i >= reels.length} />
      ))}
      {half.map((r, i) => (
        <Reel key={`b-${i}`} reel={r} hidden />
      ))}
    </ul>
  );
}
