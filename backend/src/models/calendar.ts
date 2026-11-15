import { Schema, model } from "mongoose";

/**
 * One document per villa per blocked night, for the team's internal availability calendar.
 * The unique index stops two blocks from covering the same night.
 */
const VillaNightSchema = new Schema({
  villa: { type: Schema.Types.ObjectId, ref: "Villa", required: true },
  /** The night, as UTC midnight of its date */
  date: { type: Date, required: true },
  kind: { type: String, enum: ["block"], default: "block" },
  block: { type: Schema.Types.ObjectId, ref: "Block", required: true },
});

VillaNightSchema.index({ villa: 1, date: 1 }, { unique: true });
VillaNightSchema.index({ block: 1 });

export const VillaNight = model("VillaNight", VillaNightSchema);

/* ---------- Date blocks (owner use, maintenance, stays confirmed on WhatsApp) ---------- */

const BlockSchema = new Schema(
  {
    villa: { type: Schema.Types.ObjectId, ref: "Villa", required: true, index: true },
    /** First and last blocked night, inclusive */
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String, enum: ["owner", "maintenance", "offline-booking", "other"], default: "owner" },
    note: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByName: String,
  },
  { timestamps: true },
);

export const Block = model("Block", BlockSchema);

/* ---------- Owner listing edit requests ---------- */

const ListingRequestSchema = new Schema(
  {
    villa: { type: Schema.Types.ObjectId, ref: "Villa", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerName: String,
    /** Proposed values for villa fields, e.g. { tagline, priceFrom, photos } */
    changes: { type: Schema.Types.Mixed, default: {} },
    message: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedByName: String,
    reviewNote: String,
    reviewedAt: Date,
  },
  { timestamps: true, minimize: false },
);

export const ListingRequest = model("ListingRequest", ListingRequestSchema);
