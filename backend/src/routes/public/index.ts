import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { parse } from "../../lib/http.js";
import { Villa } from "../../models/catalog.js";
import { Enquiry, OwnerLead } from "../../models/leads.js";
import { buildContentBundle } from "./content.js";

export const publicRouter = Router();

const formLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many requests. Please try again shortly." } });

const str = (max: number) => z.string().trim().max(max).optional();

const Attribution = z
  .object({
    source: str(80),
    medium: str(80),
    campaign: str(160),
    content: str(160),
    term: str(160),
    referrer: str(300),
    landing: str(300),
    label: str(200),
  })
  .partial()
  .default({});

/** All published content, cached by the website. */
publicRouter.get("/content", async (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
  res.json(await buildContentBundle());
});

/** The enquiry form saves here in the background before WhatsApp opens. */
publicRouter.post("/enquiries", formLimiter, async (req, res) => {
  const body = parse(
    z.object({
      villa: str(120),
      destination: str(120),
      checkIn: z.iso.date().optional(),
      checkOut: z.iso.date().optional(),
      guests: z.coerce.number().int().min(0).max(500).optional(),
      occasion: str(120),
      name: str(120),
      phone: str(30),
      note: str(2000),
      placement: str(120),
      page: str(500),
      attribution: Attribution,
    }),
    req.body,
  );
  const villa = body.villa ? await Villa.findOne({ slug: body.villa }).select("name").lean() : null;
  const doc = await Enquiry.create({
    ...body,
    villa: villa?._id,
    villaName: villa?.name,
    checkIn: body.checkIn ? new Date(body.checkIn) : undefined,
    checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
  });
  res.status(201).json({ ok: true, id: doc._id });
});

/** Owner partnership form (brief §4). */
publicRouter.post("/owner-leads", formLimiter, async (req, res) => {
  const body = parse(
    z.object({
      name: z.string().trim().min(1, "Enter your name").max(120),
      phone: z.string().trim().regex(/^[+\d][\d\s-]{9,}$/, "Enter a 10-digit mobile number").max(20),
      location: z.string().trim().min(1, "Enter the village or town the property is in").max(200),
      rooms: z.coerce.number().int().min(1, "Enter the number of bedrooms").max(100),
      photos: z.union([z.url("Paste a full link starting with https://"), z.literal("")]).optional(),
      note: str(2000),
      source: str(80),
      page: str(300),
      attribution: Attribution,
    }),
    req.body,
  );
  const doc = await OwnerLead.create(body);
  res.status(201).json({ ok: true, id: doc._id });
});
