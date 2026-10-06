"use client";

import { ArrowLeftIcon, ArrowRightIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/data/photos";
import { cn } from "@/lib/utils";

/** Full-screen photo viewer: swipe or arrow keys, thumbnails on larger screens. Loaded on first open. */
export function Lightbox({ photos, start, open, onOpenChange, title }: { photos: Photo[]; start: number; open: boolean; onOpenChange: (o: boolean) => void; title: string }) {
  const [ref, api] = useEmblaCarousel({ loop: true, startIndex: start, duration: 28 });
  const [index, setIndex] = useState(start);

  useEffect(() => {
    if (!api) return;
    api.scrollTo(start, true);
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, start]);

  const prev = useCallback(() => api?.scrollPrev(), [api]);
  const next = useCallback(() => api?.scrollNext(), [api]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <m.div
                className="fixed inset-0 z-[90] flex flex-col bg-night text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                data-lenis-prevent
              >
                <Dialog.Title className="sr-only">{title} photos</Dialog.Title>
                <div className="container-page flex h-16 shrink-0 items-center justify-between">
                  <p className="text-[0.9375rem] tabular-nums text-white/80" aria-live="polite">
                    {index + 1} / {photos.length}
                  </p>
                  <Dialog.Close className="grid size-11 place-items-center rounded-full border border-white/25 hover:bg-white hover:text-ink" aria-label="Close photos">
                    <XIcon className="size-5" />
                  </Dialog.Close>
                </div>
                <div ref={ref} className="min-h-0 flex-1 overflow-hidden">
                  <div className="flex h-full touch-pan-y">
                    {photos.map((p, i) => (
                      <figure key={i} className="relative flex h-full min-w-0 shrink-0 basis-full flex-col items-center justify-center px-4 md:px-20">
                        <div className="relative h-full max-h-[78svh] w-full">
                          <Image src={p.src} alt={p.alt} fill sizes="100vw" className="object-contain" preload={i === start} />
                        </div>
                        <figcaption className="mt-4 text-center text-[0.9375rem] text-white/75">{p.alt}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-center gap-3 py-5">
                  <button type="button" onClick={prev} aria-label="Previous photo" className="grid size-12 place-items-center rounded-full border border-white/25 hover:bg-white hover:text-ink">
                    <ArrowLeftIcon className="size-4" />
                  </button>
                  <div className="no-scrollbar hidden max-w-[60vw] gap-2 overflow-x-auto px-2 md:flex">
                    {photos.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => api?.scrollTo(i)}
                        aria-label={`Photo ${i + 1}`}
                        aria-current={i === index}
                        className={cn("relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-[2px] transition-opacity", i === index ? "opacity-100 ring-1 ring-white" : "opacity-45 hover:opacity-80")}
                      >
                        <Image src={p.src} alt="" fill sizes="72px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={next} aria-label="Next photo" className="grid size-12 place-items-center rounded-full border border-white/25 hover:bg-white hover:text-ink">
                    <ArrowRightIcon className="size-4" />
                  </button>
                </div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

