"use client";

import { InstagramLogoIcon, PhoneIcon, WhatsappLogoIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { m, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { Logo } from "@/components/brand/Logo";
import { useEnquiry } from "@/components/enquiry/EnquiryDialog";
import { CallLink, WhatsAppLink } from "@/components/layout/ContactLinks";
import { Button } from "@/components/ui/Button";
import { nav, secondaryNav, site } from "@/lib/site";

const ease = [0.76, 0, 0.24, 1] as const;
const easeOut = [0.16, 1, 0.3, 1] as const;

/** Full-screen menu that wipes down from the top, links rising in sequence (portfolio menu, calmer). */
export function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { openEnquiry } = useEnquiry();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <m.div
                className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-sand"
                initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
                transition={{ duration: 0.7, ease }}
                data-lenis-prevent
              >
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <div className="container-page flex h-[4.5rem] shrink-0 items-center justify-between">
                  <Link href="/" onClick={() => onOpenChange(false)} aria-label="Social Stays, home">
                    <Logo />
                  </Link>
                  <Dialog.Close className="grid size-11 place-items-center rounded-full border border-ink/20 text-ink" aria-label="Close menu">
                    <XIcon className="size-5" />
                  </Dialog.Close>
                </div>

                <nav aria-label="Main" className="container-page flex-1 pt-8">
                  <ul>
                    {[...nav, ...secondaryNav].map((item, i) => (
                      <m.li
                        key={item.href}
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.05, duration: 0.7, ease: easeOut }}
                        className="border-b border-ink/10"
                      >
                        <Link
                          href={item.href}
                          onClick={() => onOpenChange(false)}
                          className={
                            i < nav.length
                              ? "block py-3 font-display text-[2.375rem] leading-tight font-medium text-ink"
                              : "block py-2.5 text-lg font-medium text-ink-soft"
                          }
                        >
                          {item.label}
                        </Link>
                      </m.li>
                    ))}
                  </ul>
                </nav>

                <m.div
                  className="container-page shrink-0 space-y-5 pt-10 pb-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      onOpenChange(false);
                      openEnquiry();
                    }}
                  >
                    Check availability
                  </Button>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 text-[0.9375rem] font-medium text-ink">
                    <WhatsAppLink placement="mobile_menu" className="inline-flex items-center gap-2">
                      <WhatsappLogoIcon className="size-5 text-gold" /> WhatsApp
                    </WhatsAppLink>
                    <CallLink placement="mobile_menu" className="inline-flex items-center gap-2">
                      <PhoneIcon className="size-5 text-gold" /> {site.phone.display}
                    </CallLink>
                    <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                      <InstagramLogoIcon className="size-5 text-gold" /> Instagram
                    </a>
                  </div>
                </m.div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
