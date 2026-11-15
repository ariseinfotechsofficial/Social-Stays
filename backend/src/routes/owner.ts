import { Router } from "express";
import type { Types } from "mongoose";
import { z } from "zod";
import { logActivity } from "../lib/activity.js";
import { requireAuth, requireOwner } from "../lib/auth.js";
import { HttpError, parse } from "../lib/http.js";
import { ListingRequest } from "../models/calendar.js";
import { Villa } from "../models/catalog.js";
import { OWNER_EDITABLE } from "./admin/listing-requests.js";

/** Owner accounts: their villas, and requests to change those listings (the team approves them). */
export const ownerRouter = Router();
ownerRouter.use(requireAuth, requireOwner);

function assertOwns(villas: Types.ObjectId[], villaId: unknown) {
  if (!villas.some((v) => String(v) === String(villaId))) throw new HttpError(403, "That villa isn't on your account");
}

ownerRouter.get("/villas", async (req, res) => {
  const villas = await Villa.find({ _id: { $in: req.user!.villas } })
    .select(["name", "slug", "status", ...OWNER_EDITABLE].join(" "))
    .populate("destination", "name")
    .lean();
  res.json({ items: villas });
});

ownerRouter.get("/listing-requests", async (req, res) => {
  const items = await ListingRequest.find({ owner: req.user!._id }).sort("-createdAt").populate("villa", "name").lean();
  res.json({ items });
});

const Image = z.object({ src: z.string(), width: z.number().optional(), height: z.number().optional(), alt: z.string().default(""), blur: z.string().optional(), media: z.string().optional() });

ownerRouter.post("/listing-requests", async (req, res) => {
  const body = parse(
    z.object({
      villa: z.string(),
      message: z.string().trim().max(2000).default(""),
      changes: z
        .object({
          tagline: z.string(),
          summary: z.string(),
          description: z.array(z.string()),
          highlights: z.array(z.string()),
          rooms: z.array(z.object({ name: z.string(), beds: z.string(), note: z.string().optional() })),
          meals: z.string(),
          houseRules: z.array(z.string()),
          checkIn: z.string(),
          checkOut: z.string(),
          priceFrom: z.coerce.number().min(0),
          weekendPrice: z.coerce.number().min(0),
          photos: z.array(Image),
          host: z.object({ name: z.string(), note: z.string() }),
        })
        .partial(),
    }),
    req.body,
  );
  assertOwns(req.user!.villas, body.villa);
  if (!Object.keys(body.changes).length && !body.message) throw new HttpError(422, "Change something or write a message");
  const r = await ListingRequest.create({ villa: body.villa, owner: req.user!._id, ownerName: req.user!.name, changes: body.changes, message: body.message });
  logActivity(req, "create", "listing request", { id: r._id, label: Object.keys(body.changes).join(", ") || "message" });
  res.status(201).json(r.toObject());
});
