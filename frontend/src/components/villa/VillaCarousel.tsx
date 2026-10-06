"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Draggable rail with arrow buttons and a progress line. Items keep their own widths. */
export function Rail({ children, label, className }: { children: ReactNode[]; label: string; className?: string }) {
  const [ref, api] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    if (!api) return;
    setProgress(Math.max(0, Math.min(1, api.scrollProgress())));
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const frame = requestAnimationFrame(update);
    api.on("scroll", update).on("reInit", update).on("select", update);
    return () => {
      cancelAnimationFrame(frame);
      api.off("scroll", update).off("reInit", update).off("select", update);
    };
  }, [api, update]);

  return (
    <div className={className} role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={ref} className="cursor-grab overflow-hidden active:cursor-grabbing">
        <div className="-ml-5 flex touch-pan-y md:-ml-8">
          {children.map((child, i) => (
            <div key={i} className="min-w-0 shrink-0 basis-[84%] pl-5 sm:basis-[46%] md:pl-8 lg:basis-[34%] xl:basis-[30%]" role="group" aria-roledescription="slide">
              {child}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-7 flex items-center gap-6">
        <div className="relative h-px flex-1 bg-line" aria-hidden>
          <div className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-150" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
        <div className="flex gap-2">
          {[
            { dir: "prev", icon: ArrowLeftIcon, can: canPrev, onClick: () => api?.scrollPrev(), label: "Previous" },
            { dir: "next", icon: ArrowRightIcon, can: canNext, onClick: () => api?.scrollNext(), label: "Next" },
          ].map(({ dir, icon: Icon, can, onClick, label: l }) => (
            <button
              key={dir}
              type="button"
              onClick={onClick}
              disabled={!can}
              aria-label={l}
              className={cn(
                "grid size-11 place-items-center rounded-full border border-ink/25 text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
