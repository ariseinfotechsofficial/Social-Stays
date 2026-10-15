"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDragScroll } from "@/components/motion/useDragScroll";
import { cn } from "@/lib/utils";

/**
 * Horizontal rail on native scrolling, so every input works: touch swipe, trackpad swipe,
 * Shift + mouse wheel, click-and-drag with a mouse, the keyboard and the arrow buttons.
 * Items keep their own widths and snap to the start.
 */
export function Rail({ children, label, className }: { children: ReactNode[]; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => resize.disconnect();
  }, [update]);

  const { dragging, handlers } = useDragScroll(ref);

  /** One card's width per press */
  const step = (dir: 1 | -1) => {
    const el = ref.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: dir * card.offsetWidth, behavior: "smooth" });
  };

  return (
    <div className={className} role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={ref}
        tabIndex={0}
        onScroll={update}
        {...handlers}
        className={cn(
          "no-scrollbar -ml-5 flex overflow-x-auto overscroll-x-contain outline-none focus-visible:ring-2 focus-visible:ring-gold md:-ml-8",
          dragging ? "cursor-grabbing snap-none select-none" : "cursor-grab snap-x snap-mandatory",
        )}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="min-w-0 shrink-0 basis-[84%] snap-start pl-5 sm:basis-[46%] md:pl-8 lg:basis-[34%] xl:basis-[30%]"
            role="group"
            aria-roledescription="slide"
          >
            {child}
          </div>
        ))}
      </div>
      {/* Nothing to scroll (e.g. a short row): no dead arrows */}
      <div className={cn("mt-7 flex items-center gap-6", !canPrev && !canNext && "hidden")}>
        <div className="relative h-px flex-1 bg-line" aria-hidden>
          <div className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-150" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
        <div className="flex gap-2">
          {[
            { dir: -1 as const, icon: ArrowLeftIcon, can: canPrev, label: "Previous" },
            { dir: 1 as const, icon: ArrowRightIcon, can: canNext, label: "Next" },
          ].map(({ dir, icon: Icon, can, label: l }) => (
            <button
              key={dir}
              type="button"
              onClick={() => step(dir)}
              disabled={!can}
              aria-label={l}
              className="grid size-11 place-items-center rounded-full border border-ink/25 text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
