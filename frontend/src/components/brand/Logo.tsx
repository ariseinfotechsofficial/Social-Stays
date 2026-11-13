"use client";

import Image from "next/image";
import badgeFallback from "@/assets/brand/logo-badge.png";
import horizontalFallback from "@/assets/brand/logo-nav.png";
import horizontalWhiteFallback from "@/assets/brand/logo-nav-white.png";
import { useSite } from "@/components/layout/SiteProvider";
import type { Photo } from "@/data/types";
import { cn } from "@/lib/utils";

/**
 * The Social Stays logo, uploaded in Settings → Brand (the bundled files are a fallback).
 * `tone="light"` shows the all-white copy for photos; switching tone cross-fades between the two.
 */
export function Logo({ tone = "dark", className, preload }: { tone?: "dark" | "light"; className?: string; preload?: boolean }) {
  const { logo, logoLight, name } = useSite();
  const dark = logo ?? horizontalFallback;
  const light = logoLight ?? horizontalWhiteFallback;
  return (
    <span className={cn("relative block h-14 lg:h-16", className)}>
      <Image
        src={dark.src}
        width={dark.width}
        height={dark.height}
        alt={name}
        preload={preload}
        sizes="220px"
        className={cn("h-full w-auto transition-opacity duration-500", tone === "light" && "opacity-0")}
      />
      <Image
        src={light.src}
        width={light.width}
        height={light.height}
        alt=""
        aria-hidden
        sizes="220px"
        className={cn("absolute inset-0 h-full w-auto transition-opacity duration-500", tone === "dark" && "opacity-0")}
      />
    </span>
  );
}

/** Round badge version of the logo, for dark grounds such as the footer. */
export function LogoBadge({ photo, className }: { photo?: Photo | null; className?: string }) {
  const img = photo ?? { ...badgeFallback, alt: "Social Stays, the collection: villas, farmstays, homestays" };
  return <Image src={img.src} width={img.width} height={img.height} alt={img.alt || "Social Stays"} sizes="160px" className={cn("h-auto w-32", className)} />;
}
