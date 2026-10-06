"use client";

import Image from "next/image";
import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import type { Photo } from "@/data/photos";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

type Props = {
  photo: Photo;
  sizes: string;
  className?: string;
  imageClassName?: string;
  /** Direction the shutter opens from */
  from?: "bottom" | "left" | "right";
  delay?: number;
  children?: ReactNode;
};

const hidden = {
  bottom: "inset(100% 0% 0% 0%)",
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
};

/**
 * Photo opens like a shutter as it scrolls into view while the image settles from a slight zoom.
 * The in-view trigger sits on an unclipped wrapper: a fully clipped element never counts as visible.
 * Reserved for large editorial images, never thumbnails or the LCP hero.
 */
export function RevealImage({ photo, sizes, className, imageClassName, from = "bottom", delay = 0, children }: Props) {
  const reduce = useReducedMotion();

  return (
    <m.div
      className={cn("relative", className)}
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
    >
      <m.div
        className="absolute inset-0 overflow-hidden rounded-photo bg-sand-deep"
        variants={{ hidden: { clipPath: hidden[from] }, shown: { clipPath: "inset(0% 0% 0% 0%)" } }}
        transition={{ duration: 1.25, ease, delay }}
      >
        <m.div
          className="absolute inset-0"
          variants={{ hidden: { scale: 1.16 }, shown: { scale: 1 } }}
          transition={{ duration: 1.8, ease, delay }}
        >
          <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className={cn("object-cover", imageClassName)} />
        </m.div>
        {children}
      </m.div>
    </m.div>
  );
}
