"use client";

import { PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { m, AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { useEnquiry } from "@/components/enquiry/EnquiryDialog";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { CallLink, WhatsAppLink } from "@/components/layout/ContactLinks";
import { Button, buttonClasses } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";

export type BookingVilla = {
  slug: string;
  name: string;
  destination: string;
  priceFrom: number;
  weekendPrice?: number;
  maxGuests: number;
  baseGuests: number;
  status: "live" | "coming-soon";
  openingNote?: string;
};

export function TrackVillaView({ slug, name }: { slug: string; name: string }) {
  useEffect(() => {
    track("villa_view", { villa: slug, villa_name: name });
  }, [slug, name]);
  return null;
}

function Price({ villa }: { villa: BookingVilla }) {
  return (
    <div>
      <p className="flex items-baseline gap-2">
        <span className="text-[0.875rem] text-ink-soft">{villa.status === "live" ? "From" : "Expected from"}</span>
        <span className="type-price text-[2rem] leading-none">{formatINR(villa.priceFrom)}</span>
        <span className="text-[0.875rem] text-ink-soft">/ night</span>
      </p>
      <p className="mt-1.5 text-[0.8125rem] text-ink-soft">
        Whole villa for up to {villa.baseGuests} guests{villa.weekendPrice ? `; weekends ${formatINR(villa.weekendPrice)}` : ""}.
      </p>
    </div>
  );
}

/** Sticky card in the villa page sidebar (desktop). */
export function VillaEnquiryCard({ villa }: { villa: BookingVilla }) {
  if (villa.status === "coming-soon") {
    return (
      <div className="rounded-[8px] border border-line bg-white p-6">
        <p className="font-display text-2xl font-medium">{villa.openingNote}</p>
        <p className="mt-3 text-ink-soft">
          Be the first to hear when {villa.name} opens. We will send photos and opening dates on WhatsApp.
        </p>
        <WhatsAppLink
          placement="villa_waitlist"
          message={`Hello Social Stays, please let me know when ${villa.name} in ${villa.destination} opens.`}
          className={buttonClasses("primary", "lg", "mt-6 w-full")}
        >
          <WhatsappLogoIcon className="size-5" /> Join the list
        </WhatsAppLink>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-line bg-white shadow-[0_30px_60px_-40px_rgb(42_36_27/0.45)]">
      <div className="px-5 pt-6 pb-4">
        <Price villa={villa} />
      </div>
      <EnquiryForm
        villa={{ name: villa.name, slug: villa.slug, destination: villa.destination, maxGuests: villa.maxGuests }}
        placement="villa_sidebar"
        submitLabel="Check availability"
      />
      <div className="space-y-2 px-5 pb-6 text-[0.8125rem] text-ink-soft">
        <p>No payment needed to enquire. {site.replyHours}</p>
        <p>
          Prefer to talk?{" "}
          <CallLink placement="villa_sidebar" className="font-semibold text-gold-deep underline-offset-4 hover:underline">
            Call {site.phone.display}
          </CallLink>
        </p>
      </div>
    </div>
  );
}

/** Bottom bar on phones: price on the left, enquiry on the right. Appears once the gallery scrolls away. */
export function MobileBookingBar({ villa }: { villa: BookingVilla }) {
  const { openEnquiry } = useEnquiry();
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > 360));

  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        >
          <div className="container-page flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[0.8125rem] text-ink-soft">{villa.name}</p>
              <p>
                <span className="type-price text-xl">{formatINR(villa.priceFrom)}</span>
                <span className="text-[0.8125rem] text-ink-soft"> / night</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CallLink placement="villa_mobile_bar" aria-label={`Call ${site.phone.display}`} className="grid size-12 place-items-center rounded-full border border-line text-ink">
                <PhoneIcon className="size-5" />
              </CallLink>
              {villa.status === "live" ? (
                <Button
                  size="md"
                  onClick={() =>
                    openEnquiry({
                      title: "Check availability",
                      villa: { name: villa.name, slug: villa.slug, destination: villa.destination, maxGuests: villa.maxGuests },
                    })
                  }
                >
                  Check dates
                </Button>
              ) : (
                <WhatsAppLink
                  placement="villa_waitlist_mobile"
                  message={`Hello Social Stays, please let me know when ${villa.name} opens.`}
                  className={buttonClasses("primary", "md")}
                >
                  Join the list
                </WhatsAppLink>
              )}
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
