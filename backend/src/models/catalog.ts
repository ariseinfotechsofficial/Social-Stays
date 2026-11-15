import { Schema, model, type InferSchemaType } from "mongoose";
import { FaqSchema, GeoSchema, ImageSchema, PUBLISH, SeoSchema } from "./common.js";

/* ---------- Destinations ---------- */

const ThingToDoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    photo: { type: ImageSchema, default: null },
    time: { type: String, default: "" },
  },
  { _id: false },
);

const DestinationSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    district: { type: String, default: "" },
    driveMinutes: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 0 },
    route: { type: String, default: "" },
    tagline: { type: String, default: "" },
    intro: { type: [String], default: [] },
    bestTime: { type: String, default: "" },
    hero: { type: ImageSchema, default: null },
    card: { type: ImageSchema, default: null },
    thingsToDo: { type: [ThingToDoSchema], default: [] },
    faqs: { type: [FaqSchema], default: [] },
    coordinates: { type: GeoSchema, default: () => ({}) },
    seo: { type: SeoSchema, default: () => ({}) },
    status: { type: String, enum: PUBLISH, default: "published" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Destination = model("Destination", DestinationSchema);
export type DestinationDoc = InferSchemaType<typeof DestinationSchema>;

/* ---------- Villa categories (Luxury / Budget) ---------- */

const VillaCategorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    short: { type: String, default: "" },
    blurb: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const VillaCategory = model("VillaCategory", VillaCategorySchema);

/* ---------- Amenities ---------- */

const AmenitySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    /** Phosphor icon name from the curated set in the admin (e.g. "SwimmingPool") */
    icon: { type: String, default: "Check" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Amenity = model("Amenity", AmenitySchema);

/* ---------- Occasions ---------- */

const OccasionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    heading: { type: String, default: "" },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    photo: { type: ImageSchema, default: null },
    ideas: { type: [String], default: [] },
    groupSize: { type: String, default: "" },
    villas: [{ type: Schema.Types.ObjectId, ref: "Villa" }],
    /** The value pre-selected in the enquiry form's occasion field */
    enquiryOccasion: { type: String, default: "" },
    status: { type: String, enum: PUBLISH, default: "published" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Occasion = model("Occasion", OccasionSchema);

/* ---------- Experiences / add-ons ---------- */

const ExperienceSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    /** Display price, e.g. ₹650 per person, "From ₹4,500 per set-up" */
    price: {
      amount: { type: Number, default: 0 },
      unit: { type: String, default: "" },
      from: { type: Boolean, default: false },
    },
    includes: { type: [String], default: [] },
    photo: { type: ImageSchema, default: null },
    /** Empty = available at every destination */
    availableAt: [{ type: Schema.Types.ObjectId, ref: "Destination" }],
    status: { type: String, enum: PUBLISH, default: "published" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Experience = model("Experience", ExperienceSchema);

/* ---------- Villas ---------- */

const RoomSchema = new Schema({ name: { type: String, required: true }, beds: { type: String, default: "" }, note: { type: String, default: "" } }, { _id: false });

export const VILLA_STATUS = ["live", "coming-soon", "draft", "archived"] as const;

const VillaSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    destination: { type: Schema.Types.ObjectId, ref: "Destination", required: true },
    category: { type: Schema.Types.ObjectId, ref: "VillaCategory" },
    status: { type: String, enum: VILLA_STATUS, default: "draft" },
    badge: { type: String, default: "" },
    tagline: { type: String, default: "" },
    summary: { type: String, default: "" },
    description: { type: [String], default: [] },

    /** Weekday price per night for the whole villa (base guests) */
    priceFrom: { type: Number, required: true, min: 0 },
    weekendPrice: { type: Number, default: 0 },
    guests: { base: { type: Number, default: 2 }, max: { type: Number, default: 2 } },
    minNights: { type: Number, default: 1 },

    bedrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    privatePool: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false },
    highlights: { type: [String], default: [] },
    amenities: [{ type: Schema.Types.ObjectId, ref: "Amenity" }],
    rooms: { type: [RoomSchema], default: [] },
    meals: { type: String, default: "" },
    houseRules: { type: [String], default: [] },
    checkIn: { type: String, default: "1:00 pm" },
    checkOut: { type: String, default: "11:00 am" },
    securityDeposit: { type: Number, default: 0 },
    photos: { type: [ImageSchema], default: [] },
    /** Approximate — never the exact gate */
    location: {
      area: { type: String, default: "" },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      fromIndore: { type: String, default: "" },
    },
    host: { name: { type: String, default: "" }, note: { type: String, default: "" } },
    rating: { score: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    occasions: [{ type: Schema.Types.ObjectId, ref: "Occasion" }],
    openingNote: { type: String, default: "" },
    seo: { type: SeoSchema, default: () => ({}) },

    owner: { type: Schema.Types.ObjectId, ref: "User" },
    /** Overrides the global WhatsApp number for this villa's enquiries */
    whatsappNumber: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

VillaSchema.index({ destination: 1, status: 1 });

export const Villa = model("Villa", VillaSchema);
export type VillaDoc = InferSchemaType<typeof VillaSchema>;
