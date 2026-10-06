"use client";

import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { m, AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { cn } from "@/lib/utils";

/**
 * Floating WhatsApp button on every page. On villa pages the mobile booking bar
 * already carries WhatsApp, so the button lifts above it instead of covering it.
 */
export function FloatingWhatsApp() {
  const pathname = usePathname();
  const onVilla = /^\/villas\/[^/]+$/.test(pathname);
  const [pastHero, setPastHero] = useState(false);
  const { scrollY } = useScroll();

  // On the home page the hero already has the enquiry bar, so wait until it scrolls away
  useMotionValueEvent(scrollY, "change", (y) => setPastHero(y > 480));
  const visible = pathname !== "/" || pastHero;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className={cn("fixed right-4 z-40 sm:right-6", onVilla ? "bottom-24 lg:bottom-6" : "bottom-4 sm:bottom-6")}
        >
          <WhatsAppLink
            placement="floating_button"
            aria-label="Chat with us on WhatsApp"
            className="group flex h-14 items-center gap-0 rounded-full bg-gold pr-4 pl-4 text-white shadow-[0_14px_34px_-12px_rgb(42_36_27/0.55)] transition-[background-color,gap,padding] duration-500 ease-out-expo hover:gap-2.5 hover:bg-gold-press hover:pr-5"
          >
            <WhatsappLogoIcon className="size-6 shrink-0" />
            <span className="max-w-0 overflow-hidden text-[0.9375rem] font-semibold whitespace-nowrap transition-[max-width] duration-500 ease-out-expo group-hover:max-w-40">
              Chat with us
            </span>
          </WhatsAppLink>
        </m.div>
      )}
    </AnimatePresence>
  );
}
