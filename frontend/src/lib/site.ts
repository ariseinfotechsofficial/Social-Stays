/**
 * Canonical site URL. Set NEXT_PUBLIC_SITE_URL once the custom domain is live; until then
 * Vercel's production domain is used, and the placeholder domain only for local builds.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://www.socialstays.in");

/**
 * Business details used across the site.
 * PLACEHOLDERS: WhatsApp number, phone, email and Instagram handle must be replaced
 * with the client's real details before launch (or set via the NEXT_PUBLIC_* env vars).
 */
export const site = {
  name: "Social Stays",
  tagline: "Luxury stay collection",
  description:
    "Private villas and farmhouses around Indore — in Jaam Gate, Mandu, Omkareshwar and Ujjain — booked whole for your family, friends or celebration.",
  url: siteUrl,
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "910000000000",
  phone: {
    display: process.env.NEXT_PUBLIC_PHONE_DISPLAY ?? "+91 00000 00000",
    href: `tel:${process.env.NEXT_PUBLIC_PHONE_E164 ?? "+910000000000"}`,
  },
  email: process.env.NEXT_PUBLIC_EMAIL ?? "hello@socialstays.in",
  instagram: {
    handle: "socialstays",
    url: "https://www.instagram.com/socialstays",
  },
  address: {
    locality: "Indore",
    region: "Madhya Pradesh",
    postalCode: "452001",
    country: "IN",
  },
  replyHours: "We reply on WhatsApp from 9 am to 10 pm, every day.",
  /** Approximate office location for the contact map (central Indore). */
  office: { lat: 22.7196, lng: 75.8577 },
} as const;

export const nav = [
  { label: "Villas", href: "/villas" },
  { label: "Destinations", href: "/destinations" },
  { label: "Experiences", href: "/experiences" },
  { label: "Celebrations", href: "/celebrations" },
  { label: "For owners", href: "/owners" },
] as const;

export const secondaryNav = [
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;
