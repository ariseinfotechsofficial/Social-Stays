"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import badgeFallback from "@/assets/brand/logo-badge.png";
import horizontalFallback from "@/assets/brand/logo-nav.png";
import horizontalWhiteFallback from "@/assets/brand/logo-nav-white.png";
import { useSite } from "@/components/layout/SiteProvider";
import type { Photo } from "@/data/types";
import { cn } from "@/lib/utils";

type Src = { src: string; width: number; height: number } | StaticImageData;

/**
 * An uploaded logo that swaps to the bundled copy if it can't load (a deleted upload, or a page cached
 * before the logo changed), so the header never shows a broken image.
 */
function LogoImage({ img, fallback, alt, ...props }: { img: Src; fallback: StaticImageData; alt: string } & Omit<ComponentProps<typeof Image>, "src" | "width" | "height" | "alt">) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  // An error before hydration fires no onError, so check the image once on mount
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  const use = failed ? fallback : img;
  return <Image ref={ref} src={use.src} width={use.width} height={use.height} alt={alt} onError={() => setFailed(true)} {...props} />;
}

/**
 * The Social Stays logo, uploaded in Settings → Brand (the bundled files are a fallback).
 * `tone="light"` shows the all-white copy for photos; switching tone cross-fades between the two.
 */
export function Logo({ tone = "dark", className, preload }: { tone?: "dark" | "light"; className?: string; preload?: boolean }) {
  const { logo, logoLight, name } = useSite();
  return (
    <span className={cn("relative block h-14 lg:h-16", className)}>
      <LogoImage
        img={logo ?? horizontalFallback}
        fallback={horizontalFallback}
        alt={name}
        preload={preload}
        sizes="280px"
        className={cn("h-full w-auto transition-opacity duration-500", tone === "light" && "opacity-0")}
      />
      <LogoImage
        img={logoLight ?? horizontalWhiteFallback}
        fallback={horizontalWhiteFallback}
        alt=""
        aria-hidden
        sizes="280px"
        className={cn("absolute inset-0 h-full w-auto transition-opacity duration-500", tone === "dark" && "opacity-0")}
      />
    </span>
  );
}

/** Round badge version of the logo, for dark grounds such as the footer. */
export function LogoBadge({ photo, className }: { photo?: Photo | null; className?: string }) {
  const img = photo ?? { ...badgeFallback, alt: "Social Stays, the collection: villas, farmstays, homestays" };
  return (
    <LogoImage
      img={img}
      fallback={badgeFallback}
      alt={img.alt || "Social Stays"}
      sizes="160px"
      className={cn("h-auto w-32", className)}
    />
  );
}
