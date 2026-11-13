import type { Types } from "mongoose";
import { normalisePage } from "../admin/pages.js";
import { PAGES } from "../../content/registry.js";
import { env } from "../../config/env.js";
import { Amenity, CancellationPolicy, Destination, Experience, Occasion, Villa, VillaCategory } from "../../models/catalog.js";
import { FaqGroup, FaqItem, LandingPage, Page, Policy, Redirect, Review, TeamMember } from "../../models/content.js";
import { getSettings } from "../../models/settings.js";

type Id = Types.ObjectId | string | null | undefined;
type Img = { src: string; width?: number | null; height?: number | null; alt?: string | null; blur?: string | null } | null | undefined;

const image = (i: Img) => (i?.src ? { src: i.src, width: i.width ?? 0, height: i.height ?? 0, alt: i.alt ?? "", blur: i.blur ?? "" } : null);
const seo = (s?: { title?: string | null; description?: string | null; keywords?: string[] | null; ogImage?: Img; noindex?: boolean | null } | null) => ({
  title: s?.title ?? "",
  description: s?.description ?? "",
  keywords: s?.keywords ?? [],
  ogImage: image(s?.ogImage),
  noindex: Boolean(s?.noindex),
});
const month = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 7) : "");

/** Whether guests can pay online right now */
export const bookingAvailable = (settings: { booking?: { enabled?: boolean | null } | null }) => Boolean(settings.booking?.enabled && env.razorpayEnabled);

/**
 * Everything the website renders, published items only, with references turned into slugs.
 * The website caches this under one tag and refreshes it when the admin saves anything.
 */
export async function buildContentBundle() {
  const [settings, pages, destinations, categories, amenities, policiesCx, villas, experiences, occasions, reviews, faqGroups, faqs, team, policies, landing, redirects] = await Promise.all([
    getSettings(),
    Page.find().lean(),
    Destination.find({ status: "published" }).sort("order").lean(),
    VillaCategory.find().sort("order").lean(),
    Amenity.find().sort("order").lean(),
    CancellationPolicy.find().lean(),
    Villa.find({ status: { $in: ["live", "coming-soon"] } }).sort("order").lean(),
    Experience.find({ status: "published" }).sort("order").lean(),
    Occasion.find({ status: "published" }).sort("order").lean(),
    Review.find({ status: "published" }).sort("order -date").lean(),
    FaqGroup.find().sort("order").lean(),
    FaqItem.find({ status: "published" }).sort("order").lean(),
    TeamMember.find({ status: "published" }).sort("order").lean(),
    Policy.find({ status: "published" }).sort("order").lean(),
    LandingPage.find({ status: "published" }).lean(),
    Redirect.find({ active: true }).lean(),
  ]);

  const slugOf = <T extends { _id: Types.ObjectId }>(list: T[], field: keyof T) => {
    const map = new Map(list.map((d) => [String(d._id), d[field] as unknown as string]));
    return (id: Id) => (id ? map.get(String(id)) : undefined);
  };
  const destSlug = slugOf(destinations, "slug");
  const catSlug = slugOf(categories, "slug");
  const amenityKey = slugOf(amenities, "key");
  const policyKey = slugOf(policiesCx, "key");
  const villaSlug = slugOf(villas, "slug");
  const occasionSlug = slugOf(occasions, "slug");
  const groupKey = slugOf(faqGroups, "key");
  const many = (ids: Id[] | undefined, fn: (id: Id) => string | undefined) => (ids ?? []).map(fn).filter((s): s is string => Boolean(s));

  const pageMap: Record<string, { seo: ReturnType<typeof seo>; sections: ReturnType<typeof normalisePage> }> = {};
  for (const def of PAGES) {
    const doc = pages.find((p) => p.key === def.key);
    pageMap[def.key] = { seo: seo(doc?.seo), sections: normalisePage(def.key, doc) };
  }

  const { booking, ...publicSettings } = settings;

  return {
    generatedAt: new Date().toISOString(),
    settings: {
      brand: { ...publicSettings.brand, logo: image(settings.brand?.logo), logoLight: image(settings.brand?.logoLight), badge: image(settings.brand?.badge), favicon: image(settings.brand?.favicon) },
      contact: publicSettings.contact,
      social: publicSettings.social,
      address: publicSettings.address,
      header: publicSettings.header,
      footer: publicSettings.footer,
      seo: seo(publicSettings.seo),
      titleTemplate: publicSettings.titleTemplate,
      tracking: publicSettings.tracking,
      reviewSummary: publicSettings.reviewSummary,
      enquiry: publicSettings.enquiry,
      booking: {
        available: bookingAvailable(settings),
        razorpayKeyId: env.razorpayEnabled ? env.RAZORPAY_KEY_ID : "",
        weekendNights: booking?.weekendNights ?? [5, 6],
        gstPercent: booking?.gstPercent ?? 0,
        gstInclusive: Boolean(booking?.gstInclusive),
        maxAdvanceDays: booking?.maxAdvanceDays ?? 365,
        termsNote: booking?.termsNote ?? "",
      },
    },
    pages: pageMap,
    destinations: destinations.map((d) => ({
      slug: d.slug,
      name: d.name,
      district: d.district,
      driveMinutes: d.driveMinutes,
      distanceKm: d.distanceKm,
      route: d.route,
      tagline: d.tagline,
      intro: d.intro,
      bestTime: d.bestTime,
      hero: image(d.hero),
      card: image(d.card),
      thingsToDo: d.thingsToDo.map((t) => ({ title: t.title, description: t.description, time: t.time, photo: image(t.photo) })),
      faqs: d.faqs.map((f) => ({ q: f.q, a: f.a })),
      coordinates: { lat: d.coordinates?.lat ?? 0, lng: d.coordinates?.lng ?? 0 },
      seo: seo(d.seo),
      updatedAt: d.updatedAt,
    })),
    categories: categories.map((c) => ({ slug: c.slug, label: c.label, short: c.short, blurb: c.blurb })),
    amenities: amenities.map((a) => ({ key: a.key, label: a.label, icon: a.icon })),
    cancellationPolicies: policiesCx.map((p) => ({ key: p.key, name: p.name, summary: p.summary, tiers: p.tiers })),
    villas: villas
      .filter((v) => destSlug(v.destination))
      .map((v) => ({
        slug: v.slug,
        name: v.name,
        destination: destSlug(v.destination)!,
        category: catSlug(v.category) ?? "",
        status: v.status as "live" | "coming-soon",
        badge: v.badge,
        tagline: v.tagline,
        summary: v.summary,
        description: v.description,
        priceFrom: v.priceFrom,
        weekendPrice: v.weekendPrice || undefined,
        extraGuestCharge: v.extraGuestCharge,
        minNights: v.minNights,
        guests: { base: v.guests?.base ?? 1, max: v.guests?.max ?? 1 },
        bedrooms: v.bedrooms,
        bathrooms: v.bathrooms,
        privatePool: v.privatePool,
        petFriendly: v.petFriendly,
        highlights: v.highlights,
        amenities: many(v.amenities, amenityKey),
        rooms: v.rooms.map((r) => ({ name: r.name, beds: r.beds, note: r.note || undefined })),
        meals: v.meals,
        houseRules: v.houseRules,
        checkIn: v.checkIn,
        checkOut: v.checkOut,
        cancellation: policyKey(v.cancellationPolicy) ?? "",
        securityDeposit: v.securityDeposit,
        photos: v.photos.map(image).filter(Boolean),
        location: v.location,
        host: v.host,
        rating: v.rating?.count ? { score: v.rating.score, count: v.rating.count } : undefined,
        occasions: many(v.occasions, occasionSlug),
        openingNote: v.openingNote || undefined,
        seo: seo(v.seo),
        bookingMode: v.booking?.mode ?? "enquiry",
        whatsappNumber: v.whatsappNumber || undefined,
        updatedAt: v.updatedAt,
      })),
    experiences: experiences.map((e) => ({
      slug: e.slug,
      title: e.title,
      summary: e.summary,
      description: e.description,
      price: { amount: e.price?.amount ?? 0, unit: e.price?.unit ?? "", from: Boolean(e.price?.from) },
      chargeType: e.chargeType,
      minGuests: e.minGuests,
      bookable: e.bookable,
      includes: e.includes,
      photo: image(e.photo),
      availableAt: e.availableAt?.length ? many(e.availableAt, destSlug) : ("all" as const),
    })),
    occasions: occasions.map((o) => ({
      slug: o.slug,
      title: o.title,
      heading: o.heading,
      summary: o.summary,
      description: o.description,
      photo: image(o.photo),
      ideas: o.ideas,
      groupSize: o.groupSize,
      villas: many(o.villas, villaSlug),
      enquiryOccasion: o.enquiryOccasion,
    })),
    reviews: reviews.map((r) => ({
      id: String(r._id),
      name: r.name,
      city: r.city,
      villa: villaSlug(r.villa) ?? "",
      occasion: r.occasion || undefined,
      date: month(r.date),
      rating: r.rating,
      text: r.text,
      featured: r.featured,
    })),
    faqGroups: faqGroups
      .map((g) => ({
        id: g.key,
        title: g.title,
        items: faqs.filter((f) => groupKey(f.group) === g.key).map((f) => ({ q: f.q, a: f.a, showOnHome: f.showOnHome })),
      }))
      .filter((g) => g.items.length),
    team: team.map((m) => ({ name: m.name, role: m.role, bio: m.bio, photo: image(m.photo) })),
    policies: policies.map((p) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      updated: p.updatedOn ? new Date(p.updatedOn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "",
      sections: p.sections.map((s) => ({ heading: s.heading, body: s.body })),
      seo: seo(p.seo),
    })),
    landingPages: landing.map((l) => ({
      slug: l.slug,
      kind: l.kind,
      headline: l.headline,
      subhead: l.subhead,
      bullets: l.bullets,
      hero: image(l.hero),
      gallery: l.gallery.map(image).filter(Boolean),
      villas: many(l.villas, villaSlug),
      occasion: l.occasion || undefined,
      formTitle: l.formTitle,
      formIntro: l.formIntro,
      villasTitle: l.villasTitle,
      ctaTitle: l.ctaTitle,
      ctaLabel: l.ctaLabel,
      stickyLabel: l.stickyLabel,
      stickyMessage: l.stickyMessage,
      seo: seo(l.seo),
    })),
    redirects: redirects.map((r) => ({ from: r.from, to: r.to, permanent: r.permanent })),
  };
}
