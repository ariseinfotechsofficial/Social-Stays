import type { Content, Link, Photo } from "@/data/types";

/**
 * Canonical site URL. Set NEXT_PUBLIC_SITE_URL once the custom domain is live; until then
 * Vercel's production domain is used, and the placeholder domain only for local builds.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://www.socialstays.in")
).replace(/\/+$/, "");

/** The settings client components need (contact links, menus, enquiry form), passed down through <SiteProvider>. */
export type ClientSite = {
  name: string;
  whatsappNumber: string;
  phone: { display: string; href: string };
  email: string;
  replyHours: string;
  defaultWhatsappMessage: string;
  floatingWhatsapp: boolean;
  instagram: { handle: string; url: string };
  nav: Link[];
  secondaryNav: Link[];
  ctaLabel: string;
  logo: Photo | null;
  logoLight: Photo | null;
  enquiry: Content["settings"]["enquiry"];
  destinations: { slug: string; name: string }[];
  booking: Content["settings"]["booking"];
};

export function clientSite(c: Content): ClientSite {
  const s = c.settings;
  return {
    name: s.brand.name,
    whatsappNumber: s.contact.whatsappNumber.replace(/\D/g, ""),
    phone: { display: s.contact.phoneDisplay, href: `tel:${s.contact.phoneE164.replace(/[^\d+]/g, "")}` },
    email: s.contact.email,
    replyHours: s.contact.replyHours,
    defaultWhatsappMessage: s.contact.defaultWhatsappMessage,
    floatingWhatsapp: s.contact.floatingWhatsapp,
    instagram: { handle: s.social.instagramHandle, url: s.social.instagramUrl },
    nav: s.header.nav,
    secondaryNav: s.header.secondaryNav,
    ctaLabel: s.header.ctaLabel || "Check availability",
    logo: s.brand.logo,
    logoLight: s.brand.logoLight,
    enquiry: s.enquiry,
    destinations: c.destinations.map((d) => ({ slug: d.slug, name: d.name })),
    booking: s.booking,
  };
}
