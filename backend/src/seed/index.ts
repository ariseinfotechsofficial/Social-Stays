/**
 * Loads the website's original content and photo library into MongoDB.
 *
 *   npm run seed            add anything missing (never overwrites edits made in the admin)
 *   npm run seed -- --force overwrite seeded content with the original copy (users and leads untouched)
 *   npm run seed -- --demo  also create a demo owner account for testing the owner dashboard
 */
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Model, Types } from "mongoose";
import { env } from "../config/env.js";
import { connectDb, disconnectDb } from "../db.js";
import { blurDataUrl } from "../lib/storage.js";
import { Amenity, Destination, Experience, Occasion, Villa, VillaCategory } from "../models/catalog.js";
import { FaqGroup, FaqItem, LandingPage, Media, Page, Policy, Redirect, Review, TeamMember } from "../models/content.js";
import { Settings } from "../models/settings.js";
import { User } from "../models/users.js";
import { normalisePage } from "../routes/admin/pages.js";
import { team } from "./data/company.js";
import { destinations } from "./data/destinations.js";
import { experiences } from "./data/experiences.js";
import { faqGroups, homeFaqs } from "./data/faqs.js";
import { landingPages } from "./data/landing.js";
import { enquiryOccasions, occasions } from "./data/occasions.js";
import photoMeta from "./data/photos.json" with { type: "json" };
import { policies } from "./data/policies.js";
import { reviewSummary, reviews } from "./data/reviews.js";
import { villaCategories, villas } from "./data/villas.js";
import { defaultPages } from "./pages.js";

const force = process.argv.includes("--force");
const demo = process.argv.includes("--demo");
const LIBRARY = path.join(env.seedAssetsDir, "library");

type Image = { src: string; width: number; height: number; alt: string; blur: string; media: Types.ObjectId };
const library = new Map<string, Image>();

const stats: Record<string, { created: number; updated: number; kept: number }> = {};
const count = (name: string, kind: "created" | "updated" | "kept") => {
  stats[name] ??= { created: 0, updated: 0, kept: 0 };
  stats[name][kind]++;
};

/** "Model:slug" of every document this run created or overwrote */
const written = new Set<string>();

/** Creates the document if missing; replaces seeded fields only with --force. Returns its _id. */
async function upsert(model: Model<any>, filter: Record<string, unknown>, doc: Record<string, unknown>) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const existing = await model.findOne(filter).select("_id").lean<{ _id: Types.ObjectId }>();
  if (existing && !force) {
    count(model.modelName, "kept");
    return existing._id;
  }
  written.add(`${model.modelName}:${filter.slug ?? filter.key ?? ""}`);
  if (existing) {
    await model.updateOne({ _id: existing._id }, { $set: doc }, { runValidators: true });
    count(model.modelName, "updated");
    return existing._id;
  }
  const created = await model.create({ ...filter, ...doc });
  count(model.modelName, "created");
  return created._id as Types.ObjectId;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])));
  return files.flat();
}

/** Registers every photo in seed-assets/library as a media item served at /uploads/library/… */
async function importLibrary() {
  const files = (await walk(LIBRARY)).filter((f) => /\.(webp|png|jpe?g)$/i.test(f));
  const meta = photoMeta as Record<string, { alt: string }>;
  for (const file of files) {
    const rel = path.relative(LIBRARY, file).split(path.sep).join("/");
    const key = rel.replace(/\.\w+$/, "");
    const src = `/uploads/library/${rel}`;
    let media = await Media.findOne({ src }).lean();
    if (!media) {
      const buf = await fs.readFile(file);
      const info = await sharp(buf).metadata();
      media = (
        await Media.create({
          filename: path.basename(file),
          src,
          folder: rel.split("/")[0],
          width: info.width,
          height: info.height,
          size: buf.length,
          mime: `image/${info.format}`,
          alt: meta[key]?.alt ?? "",
          blur: await blurDataUrl(buf),
          source: "seed",
        })
      ).toObject();
      count("Media", "created");
    } else count("Media", "kept");
    library.set(key, { src, width: media.width ?? 0, height: media.height ?? 0, alt: media.alt ?? "", blur: media.blur ?? "", media: media._id });
  }
}

const img = (key: string, alt?: string): Image => {
  const found = library.get(key);
  if (!found) throw new Error(`Seed photo "${key}" is missing from seed-assets/library`);
  return alt ? { ...found, alt } : found;
};

const AMENITIES: [string, string, string][] = [
  ["pool", "Private pool", "SwimmingPool"],
  ["lawn", "Private lawn", "Tree"],
  ["view", "Valley or river view", "Mountains"],
  ["terrace", "Terrace", "SunHorizon"],
  ["caretaker", "Caretaker on call", "HandHeart"],
  ["chef", "Cook on request", "ChefHat"],
  ["breakfast", "Breakfast included", "Coffee"],
  ["kitchen", "Equipped kitchen", "CookingPot"],
  ["bbq", "Barbecue grill", "FireSimple"],
  ["bonfire", "Bonfire pit", "Campfire"],
  ["events", "Space for events", "UsersThree"],
  ["music", "Music system", "MusicNotes"],
  ["tv", "Television", "Television"],
  ["games", "Games and books", "GameController"],
  ["kids", "Child-friendly", "Baby"],
  ["pets", "Pets welcome", "PawPrint"],
  ["wifi", "Wi-Fi", "WifiHigh"],
  ["ac", "Air-conditioned rooms", "Snowflake"],
  ["power", "Power backup", "Lightning"],
  ["parking", "Private parking", "Car"],
  ["hot-water", "24-hour hot water", "Drop"],
  ["workspace", "Work-friendly table", "Laptop"],
];

async function main() {
  await connectDb();
  console.info(`[seed] ${force ? "overwriting seeded content" : "adding missing content"}…`);

  await importLibrary();

  const amenityIds = new Map<string, Types.ObjectId>();
  for (const [i, [key, label, icon]] of AMENITIES.entries()) amenityIds.set(key, await upsert(Amenity, { key }, { label, icon, order: i }));

  const categoryIds = new Map<string, Types.ObjectId>();
  for (const [i, c] of villaCategories.entries()) categoryIds.set(c.slug, await upsert(VillaCategory, { slug: c.slug }, { label: c.label, short: c.short, blurb: c.blurb, order: i }));

  const destinationIds = new Map<string, Types.ObjectId>();
  for (const [i, d] of destinations.entries()) {
    destinationIds.set(
      d.slug,
      await upsert(
        Destination,
        { slug: d.slug },
        {
          name: d.name,
          district: d.district,
          driveMinutes: d.driveMinutes,
          distanceKm: d.distanceKm,
          route: d.route,
          tagline: d.tagline,
          intro: d.intro,
          bestTime: d.bestTime,
          hero: img(d.hero),
          card: img(d.card),
          thingsToDo: d.thingsToDo.map((t) => ({ title: t.title, description: t.description, time: t.time ?? "", photo: t.photo ? img(t.photo) : null })),
          faqs: d.faqs,
          coordinates: d.coordinates,
          seo: d.seo,
          status: "published",
          order: i,
        },
      ),
    );
  }

  const villaIds = new Map<string, Types.ObjectId>();
  for (const [i, v] of villas.entries()) {
    villaIds.set(
      v.slug,
      await upsert(
        Villa,
        { slug: v.slug },
        {
          name: v.name,
          destination: destinationIds.get(v.destination),
          category: categoryIds.get(v.category),
          status: v.status,
          badge: v.badge ?? "",
          tagline: v.tagline,
          summary: v.summary,
          description: v.description,
          priceFrom: v.priceFrom,
          weekendPrice: v.weekendPrice ?? 0,
          guests: v.guests,
          minNights: 1,
          bedrooms: v.bedrooms,
          bathrooms: v.bathrooms,
          privatePool: v.privatePool,
          petFriendly: v.petFriendly,
          highlights: v.highlights,
          amenities: v.amenities.map((a) => amenityIds.get(a)),
          rooms: v.rooms.map((r) => ({ name: r.name, beds: r.beds, note: r.note ?? "" })),
          meals: v.meals,
          houseRules: v.houseRules,
          checkIn: v.checkIn,
          checkOut: v.checkOut,
          securityDeposit: v.securityDeposit,
          photos: v.photos.map((p) => img(p)),
          location: v.location,
          host: v.host,
          rating: v.rating ?? { score: 0, count: 0 },
          openingNote: v.openingNote ?? "",
          seo: v.seo,
          order: i,
        },
      ),
    );
  }

  const occasionIds = new Map<string, Types.ObjectId>();
  for (const [i, o] of occasions.entries()) {
    occasionIds.set(
      o.slug,
      await upsert(
        Occasion,
        { slug: o.slug },
        {
          title: o.title,
          heading: o.heading,
          summary: o.summary,
          description: o.description,
          photo: img(o.photo),
          ideas: o.ideas,
          groupSize: o.groupSize,
          villas: o.villas.map((s) => villaIds.get(s)).filter(Boolean),
          enquiryOccasion: o.enquiryOccasion,
          order: i,
        },
      ),
    );
  }
  // Villas written in this run point back at their occasions (villas edited in the admin keep theirs)
  for (const v of villas) {
    if (!written.has(`Villa:${v.slug}`)) continue;
    await Villa.updateOne({ slug: v.slug }, { $set: { occasions: v.occasions.map((s) => occasionIds.get(s)).filter(Boolean) } });
  }

  for (const [i, e] of experiences.entries()) {
    await upsert(
      Experience,
      { slug: e.slug },
      {
        title: e.title,
        summary: e.summary,
        description: e.description,
        price: { amount: e.price.amount, unit: e.price.unit, from: Boolean(e.price.from) },
        includes: e.includes,
        photo: img(e.photo),
        availableAt: e.availableAt === "all" ? [] : e.availableAt.map((d) => destinationIds.get(d)),
        order: i,
      },
    );
  }

  for (const [i, r] of reviews.entries()) {
    await upsert(
      Review,
      { name: r.name, text: r.text },
      { city: r.city, villa: villaIds.get(r.villa), occasion: r.occasion ?? "", date: new Date(`${r.date}-01T00:00:00Z`), rating: r.rating, featured: true, order: i },
    );
  }

  const homeQuestions = new Set(homeFaqs.map((f) => f.q));
  for (const [gi, g] of faqGroups.entries()) {
    const groupId = await upsert(FaqGroup, { key: g.id }, { title: g.title, order: gi });
    for (const [i, f] of g.items.entries()) await upsert(FaqItem, { group: groupId, q: f.q }, { a: f.a, showOnHome: homeQuestions.has(f.q), order: i });
  }

  for (const [i, m] of team.entries()) await upsert(TeamMember, { name: m.name }, { role: m.role, bio: m.bio, photo: img(m.photo), order: i });

  for (const [i, p] of policies.entries()) {
    await upsert(Policy, { slug: p.slug }, { title: p.title, summary: p.summary, updatedOn: new Date("2026-10-04T00:00:00Z"), sections: p.sections, order: i });
  }

  for (const lp of landingPages) {
    await upsert(
      LandingPage,
      { slug: lp.slug },
      {
        kind: lp.kind,
        headline: lp.headline,
        subhead: lp.subhead,
        bullets: lp.bullets,
        hero: img(lp.hero),
        gallery: lp.gallery.map((k) => img(k)),
        villas: lp.villas.map((s) => villaIds.get(s)).filter(Boolean),
        occasion: lp.occasion ?? "",
        stickyMessage:
          lp.kind === "villa"
            ? `Hello Social Stays, I'd like to check dates for ${villas.find((v) => v.slug === lp.villas[0])?.name}.`
            : `Hello Social Stays, I'm planning a ${lp.occasion?.toLowerCase() ?? "stay"} and would like to check villas.`,
        seo: { title: lp.seoTitle, description: lp.subhead, noindex: true },
      },
    );
  }

  await upsert(
    Settings,
    { key: "site" },
    {
      brand: {
        name: "Social Stays",
        tagline: "Luxury stay collection",
        description:
          "Private villas and farmhouses around Indore — in Jaam Gate, Mandu, Omkareshwar and Ujjain — booked whole for your family, friends or celebration.",
        logo: img("brand/logo-nav", "Social Stays"),
        logoLight: img("brand/logo-nav-white", "Social Stays"),
        badge: img("brand/logo-badge", "Social Stays, the collection: villas, farmstays, homestays"),
        favicon: img("brand/icon", "Social Stays"),
      },
      contact: {
        whatsappNumber: "910000000000",
        phoneDisplay: "+91 00000 00000",
        phoneE164: "+910000000000",
        email: "hello@socialstays.in",
        replyHours: "We reply on WhatsApp from 9 am to 10 pm, every day.",
        callHours: "Calls are welcome from 10 am to 7 pm.",
        defaultWhatsappMessage: "Hello Social Stays, I have a question about a stay.",
        floatingWhatsapp: true,
      },
      social: { instagramHandle: "socialstays", instagramUrl: "https://www.instagram.com/socialstays", facebookUrl: "", youtubeUrl: "", googleReviewsUrl: "" },
      address: { street: "", locality: "Indore", region: "Madhya Pradesh", postalCode: "452001", country: "IN", lat: 22.7196, lng: 75.8577, mapNote: "" },
      header: {
        nav: [
          { label: "Stays", href: "/villas" },
          { label: "Destinations", href: "/destinations" },
          { label: "Experiences", href: "/experiences" },
          { label: "Partner with us", href: "/owners" },
        ],
        secondaryNav: [
          { label: "About", href: "/about" },
          { label: "FAQ", href: "/faq" },
          { label: "Contact", href: "/contact" },
        ],
        ctaLabel: "Check availability",
      },
      footer: {
        blurb: "Private villas and farmhouses around Indore, hosted by the families who own them.",
        columns: [
          { title: "Destinations", auto: "destinations", links: [] },
          {
            title: "Stay with us",
            auto: "",
            links: [
              { label: "All stays", href: "/villas" },
              { label: "Experiences", href: "/experiences" },
              { label: "FAQ", href: "/faq" },
            ],
          },
          {
            title: "Company",
            auto: "",
            links: [
              { label: "About us", href: "/about" },
              { label: "Partner with us", href: "/owners" },
              { label: "Contact", href: "/contact" },
            ],
          },
        ],
        copyright: "© {year} Social Stays, Indore. All villas are privately owned.",
      },
      seo: {
        title: "Social Stays — Private villas & farmhouses near Indore",
        description:
          "Private villas and farmhouses around Indore — in Jaam Gate, Mandu, Omkareshwar and Ujjain — booked whole for your family, friends or celebration.",
        keywords: ["villa near Indore", "farmhouse in Indore for party", "Jaam Gate stay", "private pool villa Indore", "Mandu villa", "Omkareshwar stay", "Ujjain farmhouse"],
        ogImage: img("villas/shipra-farm/01", "Shipra Farm at dusk"),
        noindex: false,
      },
      titleTemplate: "%s | Social Stays",
      tracking: { gtmId: "", ga4Id: "", metaPixelId: "", googleSiteVerification: "" },
      reviewSummary,
      enquiry: {
        occasions: [...enquiryOccasions],
        dialogTitle: "Plan your stay",
        dialogIntro: "Tell us a little; we'll suggest the right villa.",
        note: "No payment needed to enquire.",
        submitLabel: "Enquire on WhatsApp",
        flexibleNote: "Flexible? Leave the dates empty and tell us on WhatsApp.",
      },
    },
  );

  const pages = defaultPages(img);
  for (const [key, page] of Object.entries(pages)) {
    const sections = normalisePage(key, {
      sections: Object.entries(page.sections).map(([k, s]) => ({ key: k, type: "", enabled: s.enabled ?? true, data: s.data })),
    });
    await upsert(Page, { key }, { sections, seo: page.seo ?? {} });
  }

  await upsert(Redirect, { from: "/celebrations" }, { to: "/experiences", permanent: true, active: true });

  if (env.SEED_ADMIN_PASSWORD && !(await User.exists({ email: env.SEED_ADMIN_EMAIL.toLowerCase() }))) {
    await User.create({ name: "Super Admin", email: env.SEED_ADMIN_EMAIL, role: "superadmin", passwordHash: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 11) });
    count("User", "created");
  }

  const demoVilla = villaIds.get("amaltas-house")!;
  if (demo && !(await User.exists({ email: "owner@socialstays.in" }))) {
    const owner = await User.create({
      name: "The Choudhary family",
      email: "owner@socialstays.in",
      role: "owner",
      villas: [demoVilla],
      passwordHash: await bcrypt.hash("owner-demo-2026", 11),
    });
    await Villa.updateOne({ _id: demoVilla }, { $set: { owner: owner._id } });
    count("User", "created");
  }

  console.table(stats);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
