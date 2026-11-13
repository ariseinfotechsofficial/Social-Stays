import { Schema, model, type InferSchemaType } from "mongoose";
import { ImageSchema, PUBLISH, SeoSchema } from "./common.js";

/* ---------- Reviews ---------- */

const ReviewSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, default: "" },
    villa: { type: Schema.Types.ObjectId, ref: "Villa" },
    occasion: { type: String, default: "" },
    /** Month of the stay */
    date: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    text: { type: String, required: true },
    /** Shown in the home page spotlight */
    featured: { type: Boolean, default: false },
    source: { type: String, enum: ["manual", "google", "guest"], default: "manual" },
    status: { type: String, enum: PUBLISH, default: "published" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Review = model("Review", ReviewSchema);

/* ---------- FAQs ---------- */

const FaqGroupSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const FaqGroup = model("FaqGroup", FaqGroupSchema);

const FaqItemSchema = new Schema(
  {
    group: { type: Schema.Types.ObjectId, ref: "FaqGroup", required: true },
    q: { type: String, required: true, trim: true },
    a: { type: String, required: true, trim: true },
    /** Shown on the home page / ad pages FAQ */
    showOnHome: { type: Boolean, default: false },
    status: { type: String, enum: PUBLISH, default: "published" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const FaqItem = model("FaqItem", FaqItemSchema);

/* ---------- Team ---------- */

const TeamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    bio: { type: String, default: "" },
    photo: { type: ImageSchema, default: null },
    status: { type: String, enum: PUBLISH, default: "published" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const TeamMember = model("TeamMember", TeamMemberSchema);

/* ---------- Policies ---------- */

const PolicySectionSchema = new Schema({ heading: { type: String, required: true }, body: { type: [String], default: [] } }, { _id: false });

const PolicySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    updatedOn: { type: Date, default: Date.now },
    sections: { type: [PolicySectionSchema], default: [] },
    seo: { type: SeoSchema, default: () => ({}) },
    status: { type: String, enum: PUBLISH, default: "published" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Policy = model("Policy", PolicySchema);

/* ---------- Ad landing pages (/lp/<slug>) ---------- */

const LandingPageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    kind: { type: String, enum: ["villa", "occasion"], default: "villa" },
    headline: { type: String, required: true },
    subhead: { type: String, default: "" },
    bullets: { type: [String], default: [] },
    hero: { type: ImageSchema, default: null },
    gallery: { type: [ImageSchema], default: [] },
    villas: [{ type: Schema.Types.ObjectId, ref: "Villa" }],
    occasion: { type: String, default: "" },
    formTitle: { type: String, default: "Check your dates" },
    formIntro: { type: String, default: "No payment needed. We reply on WhatsApp, usually within 30 minutes." },
    villasTitle: { type: String, default: "Farmhouses that suit a party" },
    ctaTitle: { type: String, default: "Ask us about your dates" },
    ctaLabel: { type: String, default: "Check availability" },
    stickyLabel: { type: String, default: "Chat on WhatsApp" },
    stickyMessage: { type: String, default: "" },
    seo: { type: SeoSchema, default: () => ({ noindex: true }) },
    status: { type: String, enum: PUBLISH, default: "published" },
  },
  { timestamps: true },
);

export const LandingPage = model("LandingPage", LandingPageSchema);

/* ---------- Pages and their sections ---------- */

const SectionSchema = new Schema(
  {
    /** Stable id within the page, e.g. "hero" */
    key: { type: String, required: true },
    /** Section type from the registry (decides the fields and the component) */
    type: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false, minimize: false },
);

const PageSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    seo: { type: SeoSchema, default: () => ({}) },
    /** In display order */
    sections: { type: [SectionSchema], default: [] },
  },
  { timestamps: true, minimize: false },
);

export const Page = model("Page", PageSchema);
export type PageDoc = InferSchemaType<typeof PageSchema>;

/* ---------- Redirects ---------- */

const RedirectSchema = new Schema(
  {
    from: { type: String, required: true, unique: true, trim: true },
    to: { type: String, required: true, trim: true },
    permanent: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Redirect = model("Redirect", RedirectSchema);

/* ---------- Media library ---------- */

const MediaSchema = new Schema(
  {
    filename: { type: String, required: true },
    /** Public path, e.g. /uploads/villas/2026/10/ab12cd-pool.webp */
    src: { type: String, required: true, unique: true },
    folder: { type: String, default: "general", index: true },
    width: Number,
    height: Number,
    size: Number,
    mime: String,
    alt: { type: String, default: "" },
    blur: { type: String, default: "" },
    source: { type: String, enum: ["upload", "seed"], default: "upload" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

MediaSchema.index({ filename: "text", alt: "text" });

export const Media = model("Media", MediaSchema);
