import type { Types } from "mongoose";
import { HttpError } from "../lib/http.js";
import { VillaNight } from "../models/calendar.js";
import { dayKey } from "./dates.js";

type Id = Types.ObjectId | string;

/** Nights in [from, to) that are already blocked. */
export function blockedNights(villa: Id, from: Date, to: Date) {
  return VillaNight.find({ villa, date: { $gte: from, $lt: to } }).select("date block").lean();
}

const isDuplicate = (err: unknown) => typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000;

/**
 * Claims nights for a block. The unique {villa, date} index stops two blocks overlapping;
 * if any night is taken the whole claim is rolled back and a 409 is thrown.
 */
export async function lockNights(villa: Id, nights: Date[], block: Id) {
  try {
    await VillaNight.insertMany(
      nights.map((date) => ({ villa, date, kind: "block", block })),
      { ordered: true },
    );
  } catch (err) {
    // Undo whatever was inserted before the clash
    await VillaNight.deleteMany({ villa, date: { $in: nights }, block });
    if (!isDuplicate(err)) throw err;
    const taken = await blockedNights(villa, nights[0], new Date(nights.at(-1)!.getTime() + 1));
    throw new HttpError(409, "Some of those nights are already blocked.", { nights: taken.map((n) => dayKey(n.date)) });
  }
}

export const releaseNights = (block: Id) => VillaNight.deleteMany({ block });
