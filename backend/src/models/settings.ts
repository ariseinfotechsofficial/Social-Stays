import { Schema, model, type InferSchemaType } from "mongoose";
import { ImageSchema, SeoSchema } from "./common.js";

const LinkSchema = new Schema({ label: { type: String, required: true }, href: { type: String, required: true } }, { _id: false });

const FooterColumnSchema = new Schema(
  {
    title: { type: String, required: true },
    /** "destinations" fills the column with every published destination */
    auto: { type: String, enum: ["", "destinations", "policies"], default: "" },
    links: { type: [LinkSchema], default: [] },
  },
  { _id: false },
);

/** One document holds every site-wide setting. Read through getSettings(). */
const SettingsSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    brand: {
      name: { type: String, default: "Social Stays" },
      tagline: { type: String, default: "Luxury stay collection" },
      description: { type: String, default: "" },
      /** Header logo on white */
      logo: { type: ImageSchema, default: null },
      /** Header logo over photos */
      logoLight: { type: ImageSchema, default: null },
      /** Round badge in the footer */
      badge: { type: ImageSchema, default: null },
      favicon: { type: ImageSchema, default: null },
    },
    contact: {
      whatsappNumber: { type: String, default: "" },
      phoneDisplay: { type: String, default: "" },
      phoneE164: { type: String, default: "" },
      email: { type: String, default: "" },
      replyHours: { type: String, default: "" },
      callHours: { type: String, default: "" },
      /** Pre-filled text for plain "Chat on WhatsApp" buttons */
      defaultWhatsappMessage: { type: String, default: "Hello Social Stays, I have a question about a stay." },
      floatingWhatsapp: { type: Boolean, default: true },
    },
    social: {
      instagramHandle: { type: String, default: "" },
      instagramUrl: { type: String, default: "" },
      facebookUrl: { type: String, default: "" },
      youtubeUrl: { type: String, default: "" },
      googleReviewsUrl: { type: String, default: "" },
    },
    address: {
      street: { type: String, default: "" },
      locality: { type: String, default: "Indore" },
      region: { type: String, default: "Madhya Pradesh" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "IN" },
      lat: { type: Number, default: 22.7196 },
      lng: { type: Number, default: 75.8577 },
      mapNote: { type: String, default: "" },
    },
    header: {
      nav: { type: [LinkSchema], default: [] },
      secondaryNav: { type: [LinkSchema], default: [] },
      ctaLabel: { type: String, default: "Check availability" },
    },
    footer: {
      blurb: { type: String, default: "" },
      columns: { type: [FooterColumnSchema], default: [] },
      copyright: { type: String, default: "" },
    },
    seo: { type: SeoSchema, default: () => ({}) },
    /** "%s | Social Stays" */
    titleTemplate: { type: String, default: "%s | Social Stays" },
    tracking: {
      gtmId: { type: String, default: "" },
      ga4Id: { type: String, default: "" },
      metaPixelId: { type: String, default: "" },
      googleSiteVerification: { type: String, default: "" },
    },
    reviewSummary: {
      score: { type: Number, default: 4.9 },
      count: { type: Number, default: 0 },
      source: { type: String, default: "Google" },
    },
    enquiry: {
      occasions: { type: [String], default: [] },
      dialogTitle: { type: String, default: "Plan your stay" },
      dialogIntro: { type: String, default: "Tell us a little; we'll suggest the right villa." },
      note: { type: String, default: "No payment needed to enquire." },
      submitLabel: { type: String, default: "Enquire on WhatsApp" },
      flexibleNote: { type: String, default: "Flexible? Leave the dates empty and tell us on WhatsApp." },
    },
    /** Name + phone pop-up shown once per visit; submissions land in Enquiries as "welcome_popup" */
    welcomePopup: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "Plan your getaway" },
      intro: { type: String, default: "Share your name and number, and we'll help you find the right villa on WhatsApp." },
      buttonLabel: { type: String, default: "Let's connect on WhatsApp" },
      note: { type: String, default: "No spam. We only message you about your stay." },
    },
  },
  { timestamps: true, minimize: false },
);

export const Settings = model("Settings", SettingsSchema);
export type SettingsDoc = InferSchemaType<typeof SettingsSchema>;

export async function getSettings() {
  // Not lean: hydrating applies schema defaults, so settings added later (e.g. welcomePopup) have values
  const doc = await Settings.findOne({ key: "site" });
  if (doc) return doc.toObject();
  return (await Settings.create({ key: "site" })).toObject();
}
