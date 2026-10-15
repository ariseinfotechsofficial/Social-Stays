"use client";

import { ImagesIcon } from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ViewTransition, useState } from "react";
import type { Photo } from "@/data/photos";

const Lightbox = dynamic(() => import("@/components/villa/Lightbox").then((mod) => mod.Lightbox), { ssr: false });

/** Villa spotlight: one large photo with two below. Every photo opens the lightbox. */
export function Gallery({ photos, title, morphName }: { photos: Photo[]; title: string; morphName?: string }) {
  const [open, setOpen] = useState(false);
  const [lightboxLoaded, setLightboxLoaded] = useState(false);
  const [start, setStart] = useState(0);

  const show = (i: number) => {
    setStart(i);
    setLightboxLoaded(true);
    setOpen(true);
  };

  const first = (
    <Image
      src={photos[0].src}
      alt={photos[0].alt}
      fill
      preload
      sizes="(min-width: 1024px) 46vw, 100vw"
      className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.03]"
    />
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <button type="button" onClick={() => show(0)} className="group relative col-span-2 aspect-[4/3] overflow-hidden rounded-[14px] bg-sand-deep" aria-label={`Open photo 1 of ${photos.length}`}>
          {morphName ? (
            <ViewTransition name={morphName} share="morph" default="none">
              {first}
            </ViewTransition>
          ) : (
            first
          )}
        </button>
        {photos.slice(1, 3).map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => show(i + 1)}
            className="group relative aspect-[7/5] overflow-hidden rounded-[14px] bg-sand-deep"
            aria-label={`Open photo ${i + 2} of ${photos.length}`}
          >
            <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 23vw, 50vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]" />
            {i === 1 && photos.length > 3 && (
              <span className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.875rem] font-semibold text-ink shadow-[0_8px_24px_-12px_rgb(42_36_27/0.5)] transition-colors group-hover:bg-ink group-hover:text-white">
                <ImagesIcon className="size-[1.05rem]" /> All {photos.length} photos
              </span>
            )}
          </button>
        ))}
      </div>

      {lightboxLoaded && <Lightbox photos={photos} start={start} open={open} onOpenChange={setOpen} title={title} />}
    </>
  );
}
