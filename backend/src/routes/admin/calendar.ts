import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { logActivity } from "../../lib/activity.js";
import { requirePermission } from "../../lib/auth.js";
import { HttpError, notFound, parse } from "../../lib/http.js";
import { Block, VillaNight } from "../../models/calendar.js";
import { Villa } from "../../models/catalog.js";
import { lockNights, releaseNights } from "../../services/availability.js";
import { addDays, dayKey, nightsOf, parseDay } from "../../services/dates.js";

/** The team's internal availability calendar: nights blocked per villa. Not shown on the website. */
export const calendarRouter = Router();
calendarRouter.use(requirePermission("calendar"));

const day = (label: string) =>
  z.string().transform((v, ctx) => {
    const d = parseDay(v);
    if (!d) ctx.addIssue({ code: "custom", message: `Choose a ${label} date` });
    return d as Date;
  });

/** Every blocked night in a range */
async function calendarEntries(villaIds: Types.ObjectId[], from: Date, to: Date) {
  const nights = await VillaNight.find({ villa: { $in: villaIds }, date: { $gte: from, $lt: to } })
    .populate("block", "reason note from to createdByName")
    .lean();
  return nights.map((n) => {
    const k = n.block as unknown as { _id: string; reason: string; note: string; createdByName?: string } | null;
    return {
      villa: String(n.villa),
      date: dayKey(n.date),
      kind: "block" as const,
      block: k ? { id: String(k._id), reason: k.reason, note: k.note, by: k.createdByName } : null,
    };
  });
}

calendarRouter.get("/", async (req, res) => {
  const from = parseDay(req.query.from) ?? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const to = parseDay(req.query.to) ?? addDays(from, 42);
  const villaFilter = typeof req.query.villa === "string" && req.query.villa ? [new Types.ObjectId(req.query.villa)] : null;
  const villas = await Villa.find(villaFilter ? { _id: { $in: villaFilter } } : { status: { $in: ["live", "coming-soon"] } })
    .sort("order")
    .select("name slug status")
    .lean();
  res.json({ from: dayKey(from), to: dayKey(to), villas, entries: await calendarEntries(villas.map((v) => v._id), from, to) });
});

const BlockBody = z.object({
  villa: z.string().min(1),
  /** First and last night blocked, inclusive */
  from: day("first"),
  to: day("last"),
  reason: z.enum(["owner", "maintenance", "offline-booking", "other"]).default("other"),
  note: z.string().trim().max(500).default(""),
});

calendarRouter.get("/blocks", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.villa === "string" && req.query.villa) filter.villa = req.query.villa;
  const items = await Block.find(filter).sort("-from").limit(200).populate("villa", "name slug").lean();
  res.json({ items });
});

calendarRouter.post("/blocks", async (req, res) => {
  const input = parse(BlockBody, req.body);
  if (input.to < input.from) throw new HttpError(422, "The last night must be on or after the first");
  const nights = nightsOf(input.from, addDays(input.to, 1));
  if (nights.length > 366) throw new HttpError(422, "Block up to a year at a time");
  const block = new Block({ ...input, createdBy: req.user!._id, createdByName: req.user!.name });
  await lockNights(input.villa, nights, block._id);
  try {
    await block.save();
  } catch (err) {
    await releaseNights(block._id);
    throw err;
  }
  logActivity(req, "create", "date block", { id: block._id, label: `${dayKey(block.from)} – ${dayKey(block.to)}` });
  res.status(201).json(block.toObject());
});

calendarRouter.delete("/blocks/:id", async (req, res) => {
  const block = await Block.findById(req.params.id);
  if (!block) throw notFound();
  await releaseNights(block._id);
  await block.deleteOne();
  logActivity(req, "delete", "date block", { id: block._id, label: `${dayKey(block.from)} – ${dayKey(block.to)}` });
  res.json({ ok: true });
});
