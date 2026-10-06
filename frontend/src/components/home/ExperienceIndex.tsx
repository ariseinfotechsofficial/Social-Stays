"use client";

import { m, AnimatePresence, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Photo } from "@/data/photos";

export type ExperienceRow = { slug: string; title: string; summary: string; price: string; photo: Photo };

/**
 * An index of add-ons. On a mouse, the photo for the hovered row follows the pointer
 * (the portfolio's project index, softened); on touch, each row shows its own thumbnail.
 */
export function ExperienceIndex({ rows }: { rows: ExperienceRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 160, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 160, damping: 22, mass: 0.5 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  return (
    <div ref={ref} className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <ul className="border-t border-line">
        {rows.map((row, i) => (
          <li
            key={row.slug}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
            className="group grid grid-cols-[4rem_1fr] items-center gap-x-4 gap-y-0.5 border-b border-line py-4 transition-[padding] duration-500 ease-out-expo md:grid-cols-[15rem_minmax(0,1fr)_10.5rem] lg:grid-cols-[19rem_minmax(0,1fr)_11rem] md:gap-10 md:py-5 md:hover:pl-3"
          >
            <div className="relative row-span-3 aspect-square overflow-hidden rounded-photo md:hidden">
              <Image src={row.photo.src} alt={row.photo.alt} fill sizes="72px" className="object-cover" />
            </div>
            <h3 className="font-display text-[1.375rem] leading-tight font-medium transition-colors duration-300 md:text-[1.875rem] md:group-hover:text-gold">{row.title}</h3>
            <p className="col-start-2 text-[0.875rem] text-ink-soft md:col-start-auto md:text-[0.9375rem]">{row.summary}</p>
            <p className="col-start-2 text-[0.875rem] font-semibold whitespace-nowrap md:col-start-auto md:text-right md:text-[0.9375rem]">{row.price}</p>
          </li>
        ))}
      </ul>

      {!reduce && (
        <m.div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 hidden md:block"
          style={{ x: sx, y: sy }}
        >
          <AnimatePresence>
            {hover !== null && (
              <m.div
                key="frame"
                className="relative -mt-32 -ml-24 h-64 w-48 overflow-hidden rounded-photo shadow-[0_30px_60px_-30px_rgb(29_25_19/0.6)]"
                initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <AnimatePresence initial={false}>
                  <m.div
                    key={hover}
                    className="absolute inset-0"
                    initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
                    animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image src={rows[hover].photo.src} alt="" fill sizes="224px" className="object-cover" />
                  </m.div>
                </AnimatePresence>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      )}
    </div>
  );
}
