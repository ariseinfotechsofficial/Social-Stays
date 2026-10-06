"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore, type ReactNode } from "react";

// Lenis only smooths mouse-wheel scrolling, so it is only downloaded on mouse/trackpad devices
const LenisRoot = dynamic(() => import("@/components/motion/LenisRoot"), { ssr: false });

const QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const q = window.matchMedia(QUERY);
  q.addEventListener("change", onChange);
  return () => q.removeEventListener("change", onChange);
}

/**
 * Lenis wheel smoothing (the portfolio feel). Touch keeps native scrolling,
 * and visitors who prefer reduced motion get no smoothing at all.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const enabled = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  return (
    <>
      {enabled && <LenisRoot />}
      {children}
    </>
  );
}
