import { amenities, cancellationPolicies, categories, coupons, destinations, experiences, occasions } from "./catalog";
import { faqGroups, faqs, landingPages, policies, redirects, reviews, team } from "./content";
import type { ResourceConfig } from "./types";
import { villas } from "./villas";

/** Every screen served by the generic list + editor, by URL segment */
export const RESOURCES: Record<string, ResourceConfig> = Object.fromEntries(
  [villas, destinations, experiences, categories, amenities, occasions, cancellationPolicies, coupons, reviews, faqs, faqGroups, team, policies, landingPages, redirects].map((r) => [r.key, r]),
);
