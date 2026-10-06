import type { PhotoKey } from "@/data/photos";

/**
 * Ad landing pages (brief §5): one villa or one occasion, no site menu.
 * Point Meta / Google ads at /lp/<slug>?utm_source=…; the UTM tags flow into the WhatsApp message.
 */
export type LandingPage = {
  slug: string;
  kind: "villa" | "occasion";
  headline: string;
  subhead: string;
  bullets: string[];
  hero: PhotoKey;
  gallery: PhotoKey[];
  villas: string[];
  occasion?: string;
  seoTitle: string;
};

export const landingPages: LandingPage[] = [
  {
    slug: "amaltas-house",
    kind: "villa",
    headline: "Your own pool villa at Jaam Gate, 70 minutes from Indore",
    subhead: "Amaltas House: four bedrooms, a private pool on two acres of lawn, and home-cooked Malwa food. Booked whole, for your group only.",
    bullets: ["Sleeps up to 12, pets welcome", "Breakfast included; dinners cooked to order", "From ₹18,500 a night for the whole villa"],
    hero: "villas/amaltas-house/01",
    gallery: ["villas/amaltas-house/02", "villas/amaltas-house/03", "villas/amaltas-house/04", "villas/amaltas-house/07"],
    villas: ["amaltas-house"],
    seoTitle: "Amaltas House — private pool villa near Indore",
  },
  {
    slug: "birthday-farmhouse",
    kind: "occasion",
    headline: "A farmhouse near Indore for the whole birthday party",
    subhead: "Book a private farmhouse with a pool and a lawn for up to 80. We arrange the décor, the cake and the dinner; everyone stays the night.",
    bullets: ["Décor in place before you arrive", "Lawns for 20 to 80 guests", "One WhatsApp chat to plan everything"],
    hero: "occasions/birthday",
    gallery: ["villas/palash-farm/02", "experiences/decor", "villas/shipra-farm/07", "villas/palash-farm/07"],
    villas: ["palash-farm", "shipra-farm", "amaltas-house"],
    occasion: "Birthday",
    seoTitle: "Birthday party farmhouse near Indore",
  },
];

export const getLandingPage = (slug: string) => landingPages.find((p) => p.slug === slug);
