"use client";

import { ListIcon, PhoneIcon } from "@phosphor-icons/react/dist/ssr";
import { m, useMotionValueEvent, useScroll } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useEnquiry } from "@/components/enquiry/EnquiryDialog";
import { CallLink } from "@/components/layout/ContactLinks";
import { buttonClasses } from "@/components/ui/Button";
import { nav, site } from "@/lib/site";
import { cn } from "@/lib/utils";

const MobileMenu = dynamic(() => import("@/components/layout/MobileMenu").then((mod) => mod.MobileMenu), { ssr: false });

/** Pages that open on a full-bleed photo: the header starts transparent with white text. */
const OVERLAY_ROUTES = [/^\/$/, /^\/destinations\/[^/]+$/, /^\/celebrations$/, /^\/owners$/, /^\/about$/, /^\/experiences$/];

function FlipLabel({ children }: { children: string }) {
  return (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-500 ease-out-expo group-hover:-translate-y-full">{children}</span>
      <span aria-hidden className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-out-expo group-hover:translate-y-0">
        {children}
      </span>
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const overlayRoute = OVERLAY_ROUTES.some((r) => r.test(pathname));
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const { openEnquiry } = useEnquiry();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > prev && y > 220 && !menuOpen);
  });

  // Close the menu and show the header again on every route change
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
    setHidden(false);
  }

  const solid = !overlayRoute || scrolled;
  const tone = solid ? "dark" : "light";

  return (
    <>
      <m.header
        style={{ viewTransitionName: "site-header" }}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-500",
          solid ? "border-b border-line bg-white/95 backdrop-blur-md" : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-page flex h-[4.5rem] items-center justify-between gap-6 lg:h-20">
          <Link href="/" aria-label="Social Stays, home" className="shrink-0">
            <Logo tone={tone} />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative block py-2 text-[0.9375rem] font-medium transition-colors duration-500",
                        tone === "light" ? "text-white" : "text-ink",
                      )}
                    >
                      <FlipLabel>{item.label}</FlipLabel>
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-0 -bottom-0.5 h-px origin-left bg-current transition-transform duration-500 ease-out-expo",
                          active ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <CallLink
              placement="header"
              aria-label={`Call ${site.phone.display}`}
              className={cn(
                "flex items-center gap-2 rounded-full text-[0.9375rem] font-medium transition-colors duration-500",
                tone === "light" ? "text-white" : "text-ink",
                "size-11 justify-center border xl:size-auto xl:border-0",
                tone === "light" ? "border-white/40" : "border-line",
              )}
            >
              <PhoneIcon className="size-[1.15rem]" />
              <span className="hidden xl:inline">{site.phone.display}</span>
            </CallLink>
            <button
              type="button"
              onClick={() => openEnquiry()}
              className={cn(
                buttonClasses(tone === "light" ? "light" : "primary", "sm"),
                "hidden h-11 px-5 sm:inline-flex",
              )}
            >
              Check availability
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuLoaded(true);
                setMenuOpen(true);
              }}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={cn(
                "grid size-11 place-items-center rounded-full border transition-colors duration-500 lg:hidden",
                tone === "light" ? "border-white/40 text-white" : "border-line text-ink",
              )}
            >
              <ListIcon className="size-5" />
            </button>
          </div>
        </div>
      </m.header>
      {menuLoaded && <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />}
    </>
  );
}
