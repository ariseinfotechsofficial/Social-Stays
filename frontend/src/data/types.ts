/*
 * Content model, as returned by the backend's /api/public/content bundle.
 * Every slug reference (villa.destination, review.villa, …) points at an item in the same bundle.
 */

/** A photo with its intrinsic size; `src` is an absolute URL once it reaches components */
export type Photo = { src: string; width: number; height: number; alt: string; blur?: string };

export type Seo = { title: string; description: string; keywords: string[]; ogImage: Photo | null; noindex: boolean };

export type Faq = { q: string; a: string };

export type Link = { label: string; href: string };

export type ThingToDo = { title: string; description: string; photo: Photo | null; time?: string };

export type Destination = {
  slug: string;
  name: string;
  district: string;
  driveMinutes: number;
  distanceKm: number;
  route: string;
  tagline: string;
  intro: string[];
  bestTime: string;
  hero: Photo | null;
  card: Photo | null;
  thingsToDo: ThingToDo[];
  faqs: Faq[];
  coordinates: { lat: number; lng: number };
  seo: Seo;
  updatedAt?: string;
};

export type VillaCategory = { slug: string; label: string; short: string; blurb: string };

export type Amenity = { key: string; label: string; icon: string };

export type Room = { name: string; beds: string; note?: string };

export type Villa = {
  slug: string;
  name: string;
  destination: string;
  status: "live" | "coming-soon";
  category: string;
  badge?: string;
  tagline: string;
  summary: string;
  description: string[];
  /** Weekday price per night, whole villa */
  priceFrom: number;
  weekendPrice?: number;
  minNights: number;
  guests: { base: number; max: number };
  bedrooms: number;
  bathrooms: number;
  privatePool: boolean;
  petFriendly: boolean;
  highlights: string[];
  amenities: string[];
  rooms: Room[];
  meals: string;
  houseRules: string[];
  checkIn: string;
  checkOut: string;
  securityDeposit: number;
  photos: Photo[];
  /** Approximate — never the exact gate */
  location: { area: string; lat: number; lng: number; fromIndore: string };
  host: { name: string; note: string };
  rating?: { score: number; count: number };
  occasions: string[];
  openingNote?: string;
  seo: Seo;
  whatsappNumber?: string;
  updatedAt?: string;
};

export type Experience = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  price: { amount: number; unit: string; from?: boolean };
  includes: string[];
  photo: Photo | null;
  availableAt: "all" | string[];
};

export type Occasion = {
  slug: string;
  title: string;
  heading: string;
  summary: string;
  description: string;
  photo: Photo | null;
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
  featured: boolean;
};

export type FaqGroup = { id: string; title: string; items: (Faq & { showOnHome: boolean })[] };

export type TeamMember = { name: string; role: string; bio: string; photo: Photo | null };

export type PolicySection = { heading: string; body: string[] };

export type Policy = { slug: string; title: string; summary: string; updated: string; sections: PolicySection[]; seo: Seo };

export type LandingPage = {
  slug: string;
  kind: "villa" | "occasion";
  headline: string;
  subhead: string;
  bullets: string[];
  hero: Photo | null;
  gallery: Photo[];
  villas: string[];
  occasion?: string;
  formTitle: string;
  formIntro: string;
  villasTitle: string;
  ctaTitle: string;
  ctaLabel: string;
  stickyLabel: string;
  stickyMessage: string;
  seo: Seo;
};

export type Section = { key: string; type: string; enabled: boolean; data: Record<string, unknown> };

export type PageContent = { seo: Seo; sections: Section[] };

export type WelcomePopup = { enabled: boolean; title: string; intro: string; buttonLabel: string; note: string };

export type SiteSettings = {
  brand: { name: string; tagline: string; description: string; logo: Photo | null; logoLight: Photo | null; badge: Photo | null; favicon: Photo | null };
  contact: {
    whatsappNumber: string;
    phoneDisplay: string;
    phoneE164: string;
    email: string;
    replyHours: string;
    callHours: string;
    defaultWhatsappMessage: string;
    floatingWhatsapp: boolean;
  };
  social: { instagramHandle: string; instagramUrl: string; facebookUrl: string; youtubeUrl: string; googleReviewsUrl: string };
  address: { street: string; locality: string; region: string; postalCode: string; country: string; lat: number; lng: number; mapNote: string };
  header: { nav: Link[]; secondaryNav: Link[]; ctaLabel: string };
  footer: { blurb: string; columns: { title: string; auto: "" | "destinations" | "policies"; links: Link[] }[]; copyright: string };
  seo: Seo;
  titleTemplate: string;
  tracking: { gtmId: string; ga4Id: string; metaPixelId: string; googleSiteVerification: string };
  reviewSummary: { score: number; count: number; source: string };
  enquiry: { occasions: string[]; dialogTitle: string; dialogIntro: string; note: string; submitLabel: string; flexibleNote: string };
  /** Missing until the backend is redeployed with this setting */
  welcomePopup?: WelcomePopup;
};

export type Content = {
  generatedAt: string;
  settings: SiteSettings;
  pages: Record<string, PageContent>;
  destinations: Destination[];
  categories: VillaCategory[];
  amenities: Amenity[];
  villas: Villa[];
  experiences: Experience[];
  occasions: Occasion[];
  reviews: Review[];
  faqGroups: FaqGroup[];
  team: TeamMember[];
  policies: Policy[];
  landingPages: LandingPage[];
  redirects: { from: string; to: string; permanent: boolean }[];
};
