import { Schema } from "mongoose";

/**
 * An image as stored on a document: a snapshot of the media file plus the alt text for this use.
 * `src` is relative ("/uploads/…"); clients prefix it with the backend's public URL.
 */
export const ImageSchema = new Schema(
  {
    src: { type: String, required: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    alt: { type: String, default: "" },
    blur: { type: String, default: "" },
    media: { type: Schema.Types.ObjectId, ref: "Media" },
  },
  { _id: false },
);

export const SeoSchema = new Schema(
  {
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    keywords: { type: [String], default: [] },
    ogImage: { type: ImageSchema, default: null },
    noindex: { type: Boolean, default: false },
  },
  { _id: false },
);

export const FaqSchema = new Schema({ q: { type: String, required: true, trim: true }, a: { type: String, required: true, trim: true } }, { _id: false });

export const GeoSchema = new Schema({ lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 } }, { _id: false });

export const NoteSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    byName: String,
    at: { type: Date, default: Date.now },
  },
  { _id: true },
);

/** Content items share a publish state so the client team can prepare things before they go live. */
export const PUBLISH = ["published", "draft"] as const;
