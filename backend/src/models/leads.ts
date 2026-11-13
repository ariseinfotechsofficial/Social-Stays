import { Schema, model } from "mongoose";
import { NoteSchema } from "./common.js";

const AttributionSchema = new Schema(
  {
    source: String,
    medium: String,
    campaign: String,
    content: String,
    term: String,
    referrer: String,
    landing: String,
    label: String,
  },
  { _id: false },
);

export const ENQUIRY_STATUS = ["new", "contacted", "quoted", "booked", "lost"] as const;

const EnquirySchema = new Schema(
  {
    villa: { type: Schema.Types.ObjectId, ref: "Villa" },
    villaName: String,
    destination: String,
    checkIn: Date,
    checkOut: Date,
    guests: Number,
    occasion: String,
    name: String,
    phone: String,
    note: String,
    placement: String,
    page: String,
    attribution: { type: AttributionSchema, default: () => ({}) },
    status: { type: String, enum: ENQUIRY_STATUS, default: "new", index: true },
    notes: { type: [NoteSchema], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

EnquirySchema.index({ createdAt: -1 });

export const Enquiry = model("Enquiry", EnquirySchema);

export const OWNER_LEAD_STATUS = ["new", "contacted", "visit-planned", "onboarded", "not-a-fit"] as const;

const OwnerLeadSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    rooms: { type: Number, required: true },
    photos: String,
    note: String,
    source: String,
    page: String,
    attribution: { type: AttributionSchema, default: () => ({}) },
    status: { type: String, enum: OWNER_LEAD_STATUS, default: "new", index: true },
    notes: { type: [NoteSchema], default: [] },
  },
  { timestamps: true },
);

OwnerLeadSchema.index({ createdAt: -1 });

export const OwnerLead = model("OwnerLead", OwnerLeadSchema);
