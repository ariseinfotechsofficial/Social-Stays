import Image from "next/image";
import type { ReactNode } from "react";
import type { Photo } from "@/data/photos";
import { cn } from "@/lib/utils";

/** Full-bleed photo opening for inner pages. Text sits bottom-left on a flat dark wash. */
export function PageHero({
  photo,
  title,
  intro,
  children,
  meta,
  className,
}: {
  photo: Photo;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative isolate flex min-h-[62svh] items-end overflow-hidden bg-night text-white lg:min-h-[70svh]", className)}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        preload
        sizes="100vw"
        className="hero-settle -z-10 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-night/45" />
      {/* Title on the left; actions or key facts on the right on large screens */}
      <div className="container-page grid w-full gap-7 pt-32 pb-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-16 lg:pb-14">
        <div>
          {meta && <div className="hero-rise mb-5 text-[0.9375rem] text-white/85">{meta}</div>}
          <h1 className="type-display-xl hero-rise max-w-[18ch] [animation-delay:120ms]">{title}</h1>
          {intro && <p className="type-lead hero-rise mt-4 max-w-xl text-white/90 [animation-delay:260ms]">{intro}</p>}
        </div>
        {children && <div className="hero-rise lg:justify-self-end lg:pb-1.5 [animation-delay:380ms]">{children}</div>}
      </div>
    </section>
  );
}
