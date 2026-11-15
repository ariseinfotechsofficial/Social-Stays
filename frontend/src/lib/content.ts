import { cache } from "react";
import type { Content, Destination, PageContent, Photo, Section, Villa } from "@/data/types";

/** The backend. API_URL lets the server use an internal address (e.g. on a VPS); browsers use NEXT_PUBLIC_API_URL. */
export const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
/** Where photos are served from: the backend's public address */
export const MEDIA_URL = (process.env.NEXT_PUBLIC_API_URL || API_URL).replace(/\/+$/, "");

/** Every cached fetch carries this tag; the admin's saves call /api/revalidate to refresh it. */
export const CONTENT_TAG = "cms";

/** Turns the relative photo paths in the bundle ("/uploads/…") into absolute URLs. */
function absolutise<T>(value: T): T {
  if (Array.isArray(value)) return value.map(absolutise) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = k === "src" && typeof v === "string" && v.startsWith("/") ? `${MEDIA_URL}${v}` : absolutise(v);
    return out as T;
  }
  return value;
}

/**
 * All published content. Cached by Next.js until the admin changes something (and at most an hour),
 * so pages stay static and fast. Deduplicated within a render by React's cache().
 */
export const getContent = cache(async (): Promise<Content> => {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/public/content`, { cache: "force-cache", next: { tags: [CONTENT_TAG], revalidate: 3600 } });
  } catch (err) {
    throw new Error(`Could not reach the Social Stays API at ${API_URL}. Is the backend running? (${(err as Error).message})`);
  }
  if (!res.ok) throw new Error(`The Social Stays API answered ${res.status} for /api/public/content`);
  return absolutise((await res.json()) as Content);
});

/* ---------- Lookups ---------- */

export const getVilla = (c: Content, slug: string) => c.villas.find((v) => v.slug === slug);
export const liveVillas = (c: Content) => c.villas.filter((v) => v.status === "live");
export const villasIn = (c: Content, destination: string) => c.villas.filter((v) => v.destination === destination);
export const getDestination = (c: Content, slug: string) => c.destinations.find((d) => d.slug === slug);
export const destinationName = (c: Content, slug: string) => getDestination(c, slug)?.name ?? slug;
export const getReviewsFor = (c: Content, villaSlug: string) => c.reviews.filter((r) => r.villa === villaSlug);
export const getPolicy = (c: Content, slug: string) => c.policies.find((p) => p.slug === slug);
export const getLandingPage = (c: Content, slug: string) => c.landingPages.find((p) => p.slug === slug);
export const getAmenity = (c: Content, key: string) => c.amenities.find((a) => a.key === key);

/** Lowest weekday price among live villas in a destination */
export function startingPrice(c: Content, destination: string) {
  const prices = villasIn(c, destination)
    .filter((v) => v.status === "live")
    .map((v) => v.priceFrom);
  return prices.length ? Math.min(...prices) : 0;
}

export const similarVillas = (c: Content, villa: Villa, count = 3) =>
  liveVillas(c)
    .filter((v) => v.slug !== villa.slug)
    .sort((a, b) => {
      const sameA = a.destination === villa.destination ? -1 : 0;
      const sameB = b.destination === villa.destination ? -1 : 0;
      return sameA - sameB || Math.abs(a.guests.max - villa.guests.max) - Math.abs(b.guests.max - villa.guests.max);
    })
    .slice(0, count);

export const destinationsByDrive = (c: Content): Destination[] => [...c.destinations].sort((a, b) => a.driveMinutes - b.driveMinutes);

/* ---------- Page sections ---------- */

/** Loose access to a section's fields, with defaults so a half-filled section never breaks a page */
export type SectionData = {
  text: (key: string, fallback?: string) => string;
  list: <T = string>(key: string) => T[];
  photo: (key: string) => Photo | null;
  num: (key: string, fallback?: number) => number;
  raw: Record<string, unknown>;
};

export function sectionData(data: Record<string, unknown> | undefined): SectionData {
  const raw = data ?? {};
  return {
    raw,
    text: (key, fallback = "") => (typeof raw[key] === "string" && raw[key] ? (raw[key] as string) : fallback),
    list: <T,>(key: string) => (Array.isArray(raw[key]) ? (raw[key] as T[]) : []),
    photo: (key) => {
      const p = raw[key] as Photo | null | undefined;
      return p && typeof p === "object" && p.src ? p : null;
    },
    num: (key, fallback = 0) => (typeof raw[key] === "number" ? (raw[key] as number) : fallback),
  };
}

export type PageView = PageContent & {
  /** Enabled sections, in the order set in the admin */
  visible: Section[];
  /** A section's fields, or null when it is switched off */
  section: (key: string) => SectionData | null;
};

export function getPage(c: Content, key: string): PageView {
  const page = c.pages[key] ?? { seo: c.settings.seo, sections: [] };
  return {
    ...page,
    visible: page.sections.filter((s) => s.enabled),
    section: (k) => {
      const s = page.sections.find((x) => x.key === k);
      return s && s.enabled ? sectionData(s.data) : null;
    },
  };
}

/** Section fields regardless of whether it is switched on (for template labels) */
export const labels = (c: Content, pageKey: string, sectionKey = "labels") =>
  sectionData(c.pages[pageKey]?.sections.find((s) => s.key === sectionKey)?.data);

/** Content for shared blocks (owner band, Instagram strip) */
export const shared = (c: Content, key: string) => sectionData(c.pages.shared?.sections.find((s) => s.key === key)?.data);

export { fill } from "@/lib/fill";
