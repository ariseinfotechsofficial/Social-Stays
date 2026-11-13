import type { Types } from "mongoose";
import { HttpError } from "../lib/http.js";
import { VillaNight } from "../models/booking.js";
import { dayKey } from "./dates.js";

type Id = Types.ObjectId | string;

/** Nights in [from, to) that are booked, held or blocked. Lapsed holds don't count even before the TTL sweep removes them. */
export async function unavailableNights(villa: Id, from: Date, to: Date) {
  const now = new Date();
  const nights = await VillaNight.find({
    villa,
    date: { $gte: from, $lt: to },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .select("date kind booking block expiresAt")
    .lean();
  return nights;
}

export async function isAvailable(villa: Id, nights: Date[]) {
  if (!nights.length) return true;
  const taken = await unavailableNights(villa, nights[0], new Date(nights.at(-1)!.getTime() + 1));
  return taken.length === 0;
}

const isDuplicate = (err: unknown) => typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000;

/**
 * Claims nights for a booking or block. The unique {villa, date} index guarantees two guests can never
 * hold the same night; if any night is taken the whole claim is rolled back and a 409 is thrown.
 */
export async function lockNights(villa: Id, nights: Date[], owner: { booking?: Id; block?: Id; expiresAt?: Date }) {
  const kind = owner.booking ? "booking" : "block";
  const docs = nights.map((date) => ({ villa, date, kind, booking: owner.booking, block: owner.block, expiresAt: owner.expiresAt }));
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await VillaNight.insertMany(docs, { ordered: true });
      return;
    } catch (err) {
      // Undo whatever this attempt inserted before the clash
      await VillaNight.deleteMany({ villa, date: { $in: nights }, ...(owner.booking ? { booking: owner.booking } : { block: owner.block }) });
      if (!isDuplicate(err)) throw err;
      // A lapsed hold the TTL sweep hasn't removed yet shouldn't block anyone: clear those and retry once
      const cleared = await VillaNight.deleteMany({ villa, date: { $in: nights }, expiresAt: { $lte: new Date() } });
      if (!cleared.deletedCount) break;
    }
  }
  const taken = await unavailableNights(villa, nights[0], new Date(nights.at(-1)!.getTime() + 1));
  throw new HttpError(409, "Some of those dates have just been taken. Please choose other dates.", { nights: taken.map((n) => dayKey(n.date)) });
}

/** Turns a timed hold into a permanent booking */
export const confirmNights = (booking: Id) => VillaNight.updateMany({ booking }, { $unset: { expiresAt: 1 } });

/** Extends or sets a hold's expiry */
export const holdNightsUntil = (booking: Id, expiresAt: Date) => VillaNight.updateMany({ booking }, { $set: { expiresAt } });

export const releaseNights = (owner: { booking?: Id; block?: Id }) => VillaNight.deleteMany(owner.booking ? { booking: owner.booking } : { block: owner.block });
