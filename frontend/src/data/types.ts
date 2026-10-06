import type { PhotoKey } from "@/data/photos";

/*
 * Content model. Shaped so the Phase 2 admin panel / API can return the same fields;
 * swap the static modules in src/data for fetches without touching components.
 */

export type DestinationSlug = "jaam-gate" | "mandu" | "omkareshwar" | "ujjain";

export type OccasionSlug = "birthdays" | "anniversaries" | "pre-wedding" | "offsites";

export type AmenityKey =
  | "pool"
  | "wifi"
  | "ac"
  | "parking"
  | "kitchen"
  | "caretaker"
  | "chef"
  | "breakfast"
  | "bbq"
  | "bonfire"
  | "lawn"
  | "music"
  | "tv"
  | "power"
  | "pets"
  | "kids"
  | "games"
  | "view"
  | "terrace"
  | "events"
  | "hot-water"
  | "workspace";

export type Faq = { q: string; a: string };

export type ThingToDo = {
  title: string;
  description: string;
  photo?: PhotoKey;
  /** e.g. "Half day", "1–2 hours" */
  time?: string;
};

export type Destination = {
  slug: DestinationSlug;
  name: string;
  district: string;
  driveMinutes: number;
  distanceKm: number;
  route: string;
  tagline: string;
  intro: string[];
  bestTime: string;
  hero: PhotoKey;
  card: PhotoKey;
  thingsToDo: ThingToDo[];
  faqs: Faq[];
  coordinates: { lat: number; lng: number };
  seo: { title: string; description: string };
};

export type Room = { name: string; beds: string; note?: string };

export type Villa = {
  slug: string;
  name: string;
  destination: DestinationSlug;
  status: "live" | "coming-soon";
  /** One line under the name */
  tagline: string;
  /** Card summary, ~20 words */
  summary: string;
  description: string[];
  /** Weekday price per night, whole villa */
  priceFrom: number;
  weekendPrice?: number;
  guests: { base: number; max: number };
  bedrooms: number;
  bathrooms: number;
  privatePool: boolean;
  petFriendly: boolean;
  highlights: string[];
  amenities: AmenityKey[];
  rooms: Room[];
  meals: string;
  houseRules: string[];
  checkIn: string;
  checkOut: string;
  cancellation: "standard" | "peak";
  securityDeposit: number;
  photos: PhotoKey[];
  /** Approximate — never the exact gate */
  location: { area: string; lat: number; lng: number; fromIndore: string };
  host: { name: string; note: string };
  rating?: { score: number; count: number };
  occasions: OccasionSlug[];
  openingNote?: string;
  seo: { title: string; description: string };
};

export type Experience = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  price: { amount: number; unit: string; from?: boolean };
  includes: string[];
  photo: PhotoKey;
  availableAt: "all" | DestinationSlug[];
};

export type Occasion = {
  slug: OccasionSlug;
  title: string;
  heading: string;
  summary: string;
  description: string;
  photo: PhotoKey;
  ideas: string[];
  groupSize: string;
  villas: string[];
  enquiryOccasion: string;
};

export type Review = {
  id: string;
  name: string;
  city: string;
  villa: string;
  occasion?: string;
  date: string;
  rating: number;
  text: string;
};

export type TeamMember = { name: string; role: string; bio: string; photo: PhotoKey };

export type PolicySection = { heading: string; body: string[] };

export type Policy = {
  slug: "terms" | "cancellation-refund" | "privacy";
  title: string;
  summary: string;
  updated: string;
  sections: PolicySection[];
};
