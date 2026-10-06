"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Resets Lenis to the top on route changes so it never animates back from the old position. */
function RouteReset() {
  const lenis = useLenis();
  const pathname = usePathname();
  useEffect(() => {
    if (!lenis || window.location.hash) return;
    lenis.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);
  return null;
}

export default function LenisRoot() {
  return (
    <ReactLenis root options={{ lerp: 0.11, smoothWheel: true, anchors: { offset: -96 }, allowNestedScroll: true }}>
      <RouteReset />
    </ReactLenis>
  );
}
