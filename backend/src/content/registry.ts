/**
 * Every editable page and section on the website.
 *
 * The admin builds its page editor from these definitions, the seed fills them with the site's
 * current copy, and the website maps each section `type` to a component. Adding a field here makes
 * it editable; the website decides where it appears.
 *
 * Text fields may use placeholders such as {name} or {villa}; the website fills them in.
 */

export type RefCollection = "experiences" | "reviews" | "villas" | "destinations";

export type Field =
  | {
      name: string;
      label: string;
      type: "text" | "textarea" | "number" | "boolean" | "image" | "images" | "strings" | "url";
      help?: string;
      placeholder?: string;
    }
  | { name: string; label: string; type: "list"; fields: Field[]; itemLabel?: string; help?: string }
  | { name: string; label: string; type: "ref"; collection: RefCollection; multiple?: boolean; help?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string };

export type SectionType = {
  type: string;
  label: string;
  description?: string;
  /** Content lives on the "shared" page; pages only switch it on or off */
  shared?: boolean;
  fields: Field[];
};

export type PageDef = {
  key: string;
  label: string;
  /** Website path, for the "View on site" link */
  path: string;
  /** Sections can be dragged into a different order */
  reorderable: boolean;
  /** Template pages (villa, destination) take their SEO from each item instead */
  seo: boolean;
  sections: { key: string; type: string }[];
};

const t = (name: string, label: string, help?: string): Field => ({ name, label, type: "text", help });
const ta = (name: string, label: string, help?: string): Field => ({ name, label, type: "textarea", help });
const img = (name: string, label: string, help?: string): Field => ({ name, label, type: "image", help });
const strs = (name: string, label: string, help?: string): Field => ({ name, label, type: "strings", help });
const steps = (name: string, label: string): Field => ({ name, label, type: "list", itemLabel: "Step", fields: [t("title", "Title"), ta("body", "Text")] });

export const SECTION_TYPES: SectionType[] = [
  /* ---------- Shared blocks ---------- */
  {
    type: "owner-band",
    label: "Villa owner invitation",
    description: "Dark band inviting villa owners to partner. Shown on Home and About.",
    shared: true,
    fields: [
      img("image", "Photo"),
      t("title", "Heading"),
      ta("body", "Text"),
      t("primaryLabel", "Button label"),
      t("primaryHref", "Button link"),
      t("secondaryLabel", "Second link label"),
      t("secondaryHref", "Second link"),
    ],
  },
  {
    type: "instagram",
    label: "Instagram strip",
    description: "Photo grid linking to the Instagram profile set in Settings.",
    shared: true,
    fields: [t("title", "Heading"), t("linkLabel", "Link label", "{handle} is replaced with the Instagram handle"), { name: "images", label: "Photos (6 work best)", type: "images" }],
  },

  /* ---------- Home ---------- */
  {
    type: "home-hero",
    label: "Hero",
    fields: [
      t("line1", "Heading, first line"),
      t("line2", "Heading, second line"),
      ta("intro", "Intro"),
      img("image", "Background photo"),
      t("caption", "Photo caption", "Small credit in the corner, e.g. 'Pictured: Shipra Farm, Ujjain'"),
      t("captionHref", "Caption link"),
      t("submitLabel", "Form button label"),
      t("mobileNote", "Note under the form on phones"),
    ],
  },
  {
    type: "home-destinations",
    label: "Destinations",
    fields: [t("title", "Heading"), ta("intro", "Intro"), t("linkLabel", "Link label"), t("helpText", "Help line"), t("helpLinkLabel", "Help link label"), ta("helpMessage", "WhatsApp message for the help link")],
  },
  {
    type: "home-collection",
    label: "Villa collection",
    description: "One row per villa category, filled from the villas. Category names and blurbs are edited under Villa categories.",
    fields: [
      t("title", "Heading"),
      ta("intro", "Intro"),
      t("linkLabel", "Link label"),
      strs("panelPoints", "Panel points", "Shown beside a category with fewer than three villas; a 'From ₹… a night' line is added automatically"),
      t("panelButtonLabel", "Panel button", "{category} is replaced with the category's short name"),
      t("panelLinkLabel", "Panel link", "{category} is replaced with the category's short name"),
    ],
  },
  {
    type: "home-experiences",
    label: "Experiences",
    fields: [t("eyebrow", "Small label above the heading"), t("title", "Heading"), ta("intro", "Intro"), t("linkLabel", "Link label"), { name: "items", label: "Experiences shown", type: "ref", collection: "experiences", multiple: true }],
  },
  {
    type: "how-it-works",
    label: "How booking works",
    fields: [
      t("title", "Heading"),
      ta("intro", "Intro"),
      steps("steps", "Steps"),
      t("chatStatus", "Chat preview: status line"),
      ta("chatRequest", "Chat preview: guest's message"),
      t("chatSource", "Chat preview: source line"),
      t("chatSentAt", "Chat preview: sent time"),
      ta("chatReply", "Chat preview: team's reply"),
      t("chatReplyAt", "Chat preview: reply time"),
    ],
  },
  {
    type: "home-reviews",
    label: "Guest reviews",
    description: "Shows the reviews marked 'Featured'. The score and count come from Settings → Reviews.",
    fields: [t("title", "Heading"), img("image", "Photo beside the reviews")],
  },
  {
    type: "home-faq",
    label: "FAQ",
    description: "Shows the FAQs marked 'Show on home'.",
    fields: [t("title", "Heading"), ta("intro", "Intro"), t("linkLabel", "Link label")],
  },

  /* ---------- Villas listing ---------- */
  {
    type: "villas-header",
    label: "Heading and filters",
    fields: [
      t("title", "Heading"),
      ta("intro", "Intro"),
      t("allLabel", "Filter: all"),
      t("poolLabel", "Filter: private pool"),
      t("groupLabel", "Filter: big groups", "{n} is replaced with the group size"),
      { name: "groupSize", label: "Big group size", type: "number" },
      t("petsLabel", "Filter: pets"),
      t("emptyTitle", "No results: heading"),
      ta("emptyBody", "No results: text"),
      t("emptyReset", "No results: reset link"),
    ],
  },

  /* ---------- Villa detail template ---------- */
  {
    type: "villa-labels",
    label: "Villa page text",
    description: "Headings and notes used on every villa page. {villa} is replaced with the villa name.",
    fields: [
      t("enquireLabel", "Enquire button"),
      t("notifyLabel", "Coming soon: notify button"),
      t("sleepTitle", "Rooms heading"),
      t("amenitiesTitle", "Amenities heading"),
      t("mealsTitle", "Meals heading"),
      t("addOnsLinkLabel", "Experiences link"),
      t("goodToKnowTitle", "Good to know heading"),
      t("depositNote", "Deposit note", "Shown after the deposit amount"),
      t("rulesTitle", "House rules heading"),
      t("locationTitle", "Location heading"),
      ta("locationNote", "Location note", "After the area and drive time"),
      t("reviewsTitle", "Reviews heading"),
      t("similarTitle", "Similar villas heading"),
      t("cardNote", "Note under the enquiry card"),
      t("callPrompt", "Call prompt"),
      t("waitlistBody", "Coming soon: card text"),
      t("waitlistLabel", "Coming soon: card button"),
    ],
  },

  /* ---------- Destinations ---------- */
  {
    type: "page-header",
    label: "Page heading",
    fields: [t("title", "Heading"), ta("intro", "Intro")],
  },
  {
    type: "destinations-list",
    label: "Destination list",
    fields: [t("linkLabel", "Link under each destination", "{name} is replaced with the destination")],
  },
  {
    type: "destination-labels",
    label: "Destination page text",
    description: "{name} is replaced with the destination name.",
    fields: [
      t("heroTitle", "Hero heading"),
      t("ctaLabel", "Check availability button"),
      t("whyTitle", "Intro heading"),
      t("planTitle", "Trip facts heading"),
      t("staysTitle", "Villas heading"),
      t("suggestTitle", "Suggestion card heading"),
      ta("suggestBody", "Suggestion card text"),
      t("suggestButton", "Suggestion card button"),
      t("thingsTitle", "Things to do heading"),
      t("faqTitle", "FAQ heading"),
      ta("faqIntro", "FAQ intro"),
    ],
  },

  /* ---------- Generic photo hero + CTA ---------- */
  {
    type: "photo-hero",
    label: "Photo hero",
    fields: [img("image", "Photo"), t("title", "Heading"), ta("intro", "Intro"), t("buttonLabel", "Button label (optional)")],
  },
  {
    type: "experiences-list",
    label: "Experience list",
    description: "Every published experience, in the order set under Experiences.",
    fields: [ta("note", "Note above the list")],
  },
  {
    type: "cta-band",
    label: "Call to action band",
    fields: [t("title", "Heading"), t("buttonLabel", "Button label")],
  },

  /* ---------- About ---------- */
  {
    type: "about-story",
    label: "Our story",
    fields: [ta("lead", "Opening paragraph"), strs("paragraphs", "More paragraphs"), img("image", "Photo")],
  },
  {
    type: "about-values",
    label: "How we work",
    fields: [t("title", "Heading"), { name: "items", label: "Values", type: "list", itemLabel: "Value", fields: [t("title", "Title"), ta("body", "Text")] }],
  },
  {
    type: "about-team",
    label: "Team",
    description: "Team members are edited under Team.",
    fields: [t("title", "Heading"), ta("intro", "Intro")],
  },

  /* ---------- FAQ ---------- */
  {
    type: "faq-sidebar",
    label: "Sidebar",
    fields: [t("title", "Heading"), t("body", "Text"), t("buttonLabel", "Button label")],
  },

  /* ---------- Contact ---------- */
  {
    type: "contact-channels",
    label: "Contact options",
    description: "Numbers and addresses come from Settings → Contact.",
    fields: [t("whatsappLabel", "WhatsApp title"), t("whatsappValue", "WhatsApp line"), t("callLabel", "Call title"), t("emailLabel", "Email title"), t("instagramLabel", "Instagram title")],
  },
  {
    type: "contact-form",
    label: "Enquiry form",
    fields: [t("title", "Heading"), t("intro", "Intro")],
  },
  {
    type: "contact-office",
    label: "Office map",
    description: "The map pin is set in Settings → Address.",
    fields: [t("title", "Heading"), t("note", "Line beside the heading"), { name: "zoom", label: "Map zoom (10–16)", type: "number" }],
  },

  /* ---------- Owners ---------- */
  {
    type: "owners-benefits",
    label: "Benefits",
    fields: [t("title", "Heading"), { name: "items", label: "Benefits", type: "list", itemLabel: "Benefit", fields: [t("title", "Title"), ta("body", "Text")] }],
  },
  {
    type: "owners-process",
    label: "How partnership works",
    fields: [t("title", "Heading"), steps("steps", "Steps"), img("image", "Photo"), t("criteriaTitle", "Criteria heading"), strs("criteria", "Criteria")],
  },
  {
    type: "owners-form",
    label: "Partner form",
    fields: [
      t("title", "Heading"),
      ta("intro", "Intro"),
      t("prompt", "WhatsApp prompt"),
      t("linkLabel", "WhatsApp link label"),
      ta("message", "WhatsApp message"),
      t("submitLabel", "Submit button"),
      t("successTitle", "Thank-you heading"),
      ta("successBody", "Thank-you text"),
      t("privacyNote", "Privacy note"),
    ],
  },

  /* ---------- 404 ---------- */
  {
    type: "not-found",
    label: "Page not found",
    description: "Destination links are added under the button automatically.",
    fields: [t("eyebrow", "Small label"), t("title", "Heading"), ta("body", "Text"), t("primaryLabel", "Button label"), t("primaryHref", "Button link")],
  },
];

export const PAGES: PageDef[] = [
  {
    key: "shared",
    label: "Shared blocks",
    path: "/",
    reorderable: false,
    seo: false,
    sections: [
      { key: "ownerBand", type: "owner-band" },
      { key: "instagram", type: "instagram" },
    ],
  },
  {
    key: "home",
    label: "Home",
    path: "/",
    reorderable: true,
    seo: true,
    sections: [
      { key: "hero", type: "home-hero" },
      { key: "destinations", type: "home-destinations" },
      { key: "collection", type: "home-collection" },
      { key: "experiences", type: "home-experiences" },
      { key: "howItWorks", type: "how-it-works" },
      { key: "reviews", type: "home-reviews" },
      { key: "faq", type: "home-faq" },
      { key: "ownerBand", type: "owner-band" },
      { key: "instagram", type: "instagram" },
    ],
  },
  { key: "villas", label: "Villas listing", path: "/villas", reorderable: false, seo: true, sections: [{ key: "header", type: "villas-header" }] },
  { key: "villa", label: "Villa page (template)", path: "/villas", reorderable: false, seo: false, sections: [{ key: "labels", type: "villa-labels" }] },
  {
    key: "destinations",
    label: "Destinations",
    path: "/destinations",
    reorderable: false,
    seo: true,
    sections: [
      { key: "header", type: "page-header" },
      { key: "list", type: "destinations-list" },
    ],
  },
  { key: "destination", label: "Destination page (template)", path: "/destinations", reorderable: false, seo: false, sections: [{ key: "labels", type: "destination-labels" }] },
  {
    key: "experiences",
    label: "Experiences",
    path: "/experiences",
    reorderable: true,
    seo: true,
    sections: [
      { key: "hero", type: "photo-hero" },
      { key: "list", type: "experiences-list" },
      { key: "cta", type: "cta-band" },
    ],
  },
  {
    key: "about",
    label: "About",
    path: "/about",
    reorderable: true,
    seo: true,
    sections: [
      { key: "hero", type: "photo-hero" },
      { key: "story", type: "about-story" },
      { key: "values", type: "about-values" },
      { key: "team", type: "about-team" },
      { key: "ownerBand", type: "owner-band" },
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    path: "/faq",
    reorderable: false,
    seo: true,
    sections: [
      { key: "header", type: "page-header" },
      { key: "sidebar", type: "faq-sidebar" },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    path: "/contact",
    reorderable: false,
    seo: true,
    sections: [
      { key: "header", type: "page-header" },
      { key: "channels", type: "contact-channels" },
      { key: "form", type: "contact-form" },
      { key: "office", type: "contact-office" },
    ],
  },
  {
    key: "owners",
    label: "Partner with us",
    path: "/owners",
    reorderable: true,
    seo: true,
    sections: [
      { key: "hero", type: "photo-hero" },
      { key: "benefits", type: "owners-benefits" },
      { key: "process", type: "owners-process" },
      { key: "form", type: "owners-form" },
    ],
  },
  { key: "not-found", label: "Page not found", path: "/404", reorderable: false, seo: false, sections: [{ key: "content", type: "not-found" }] },
];

export const sectionType = (type: string) => SECTION_TYPES.find((s) => s.type === type);
export const pageDef = (key: string) => PAGES.find((p) => p.key === key);
