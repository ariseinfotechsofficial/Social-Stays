import { Schema, model, type InferSchemaType } from "mongoose";

export const ROLES = ["superadmin", "editor", "sales", "owner"] as const;
export type Role = (typeof ROLES)[number];

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    /** Owners: the villas they can see */
    villas: [{ type: Schema.Types.ObjectId, ref: "Villa" }],
    /** Owners: where payouts go */
    payout: {
      method: { type: String, enum: ["bank", "upi", ""], default: "" },
      upiId: { type: String, default: "" },
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifsc: { type: String, default: "" },
    },
    active: { type: Boolean, default: true },
    /** Bumped on password change / sign-out-everywhere to invalidate old sessions */
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const User = model("User", UserSchema);
export type UserDoc = InferSchemaType<typeof UserSchema>;

const ActivitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    userName: String,
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    label: String,
    meta: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ActivitySchema.index({ createdAt: -1 });
// Keep a year of history
ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export const Activity = model("Activity", ActivitySchema);
