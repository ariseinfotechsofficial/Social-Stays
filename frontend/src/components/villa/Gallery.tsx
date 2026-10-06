"use client";

import { ImagesIcon } from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ViewTransition, useEffect, useState } from "react";
import type { Photo } from "@/data/photos";
import { cn } from "@/lib/utils";

const Lightbox = dynamic(() => import("@/components/villa/Lightbox").then((mod) => mod.Lightbox), { ssr: false });

/** Desktop: one large photo and four smaller ones. Mobile: a swipeable strip. Both open the lightbox. */
export function Gallery({ photos, title, morphName }: { photos: Photo[]; title: string; morphName?: string }) {
  const [open, setOpen] = useState(false);
  const [lightboxLoaded, setLightboxLoaded] = useState(false);
  const [start, setStart] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [wide, setWide] = useState(false);

  // The morph name may only exist once in the document, so it goes on whichever layout is showing
  useEffect(() => {
    const q = window.matchMedia("(min-width: 48rem)");
    const update = () => setWide(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);

  const show = (i: number) => {
    setStart(i);
    setLightboxLoaded(true);
    setOpen(true);
  };

  const first = (
    <Image src={photos[0].src} alt={photos[0].alt} fill preload sizes="100vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.03]" />
  );

  return (
    <>
      {/* Mobile strip */}
      <div className="relative -mx-5 md:hidden">
        <div
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {photos.map((p, i) => (
            <button key={i} type="button" onClick={() => show(i)} className="group relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden bg-sand-deep" aria-label={`Open photo ${i + 1} of ${photos.length}`}>
              {i === 0 ? (
                morphName && !wide ? (
                  <ViewTransition name={morphName} share="morph" default="none">
                    {first}
                  </ViewTransition>
                ) : (
                  first
                )
              ) : (
                <Image src={p.src} alt={p.alt} fill sizes="100vw" className="object-cover" />
              )}
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute right-4 bottom-4 rounded-full bg-night/70 px-3 py-1 text-[0.8125rem] font-medium text-white tabular-nums">
          {mobileIndex + 1} / {photos.length}
        </span>
      </div>

      {/* Desktop mosaic */}
      <div className="relative hidden h-[min(60svh,34rem)] grid-cols-4 grid-rows-2 gap-2 md:grid">
        {photos.slice(0, 5).map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => show(i)}
            className={cn("group relative overflow-hidden bg-sand-deep", i === 0 ? "col-span-2 row-span-2 rounded-l-photo" : "", i === 2 && "rounded-tr-photo", i === 4 && "rounded-br-photo")}
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
          >
            {i === 0 ? (
              morphName && wide ? (
                <ViewTransition name={morphName} share="morph" default="none">
                  {first}
                </ViewTransition>
              ) : (
                first
              )
            ) : (
              <Image src={p.src} alt={p.alt} fill sizes="25vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]" />
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => show(0)}
          className="absolute right-5 bottom-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.9375rem] font-semibold text-ink shadow-[0_8px_24px_-12px_rgb(42_36_27/0.5)] transition-colors hover:bg-ink hover:text-white"
        >
          <ImagesIcon className="size-[1.1rem]" /> All {photos.length} photos
        </button>
      </div>

      {lightboxLoaded && <Lightbox photos={photos} start={start} open={open} onOpenChange={setOpen} title={title} />}
    </>
  );
}
