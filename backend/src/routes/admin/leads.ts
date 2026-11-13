import { Router, type Response } from "express";
import type { Model } from "mongoose";
import { z } from "zod";
import { logActivity } from "../../lib/activity.js";
import { requirePermission } from "../../lib/auth.js";
import { escapeRegex, notFound, pagination, parse } from "../../lib/http.js";
import { ENQUIRY_STATUS, Enquiry, OWNER_LEAD_STATUS, OwnerLead } from "../../models/leads.js";

/** CSV with a BOM so Excel opens Hindi names and ₹ correctly */
export function sendCsv(res: Response, filename: string, rows: Record<string, unknown>[]) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const cell = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(`﻿${csv}`);
}

function leadRouter(model: Model<any>, opts: { entity: string; statuses: readonly string[]; search: string[]; csv: (d: any) => Record<string, unknown> }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const r = Router();
  r.use(requirePermission("leads"));

  const filterFrom = (query: Record<string, unknown>) => {
    const filter: Record<string, unknown> = {};
    if (typeof query.status === "string" && query.status) filter.status = query.status;
    if (typeof query.villa === "string" && query.villa) filter.villa = query.villa;
    if (typeof query.source === "string" && query.source) filter["attribution.source"] = query.source;
    if (typeof query.from === "string" && query.from) filter.createdAt = { ...(filter.createdAt as object), $gte: new Date(query.from) };
    if (typeof query.to === "string" && query.to) filter.createdAt = { ...(filter.createdAt as object), $lte: new Date(`${query.to}T23:59:59.999Z`) };
    if (typeof query.q === "string" && query.q.trim()) {
      const rx = new RegExp(escapeRegex(query.q.trim()), "i");
      filter.$or = opts.search.map((f) => ({ [f]: rx }));
    }
    return filter;
  };

  r.get("/", async (req, res) => {
    const { page, limit, skip, sort } = pagination(req.query, { limit: 50 });
    const filter = filterFrom(req.query);
    const [items, total, counts] = await Promise.all([
      model.find(filter).sort(sort).skip(skip).limit(limit).populate("assignedTo", "name").lean(),
      model.countDocuments(filter),
      model.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);
    res.json({ items, total, page, limit, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
  });

  r.get("/export.csv", async (req, res) => {
    const items = await model.find(filterFrom(req.query)).sort("-createdAt").limit(5000).lean();
    sendCsv(res, `${opts.entity}s-${new Date().toISOString().slice(0, 10)}.csv`, items.map(opts.csv));
  });

  r.get("/:id", async (req, res) => {
    const doc = await model.findById(req.params.id).populate("assignedTo", "name").lean();
    if (!doc) throw notFound();
    res.json(doc);
  });

  r.patch("/:id", async (req, res) => {
    const body = parse(z.object({ status: z.enum(opts.statuses as [string, ...string[]]).optional(), assignedTo: z.string().nullable().optional() }), req.body);
    const doc = await model.findById(req.params.id);
    if (!doc) throw notFound();
    if (body.status) doc.set("status", body.status);
    if (body.assignedTo !== undefined) doc.set("assignedTo", body.assignedTo || undefined);
    await doc.save();
    logActivity(req, "update", opts.entity, { id: doc._id, label: String(doc.get("name") ?? doc.get("villaName") ?? doc._id), meta: body });
    res.json(doc.toObject());
  });

  r.post("/:id/notes", async (req, res) => {
    const { text } = parse(z.object({ text: z.string().trim().min(1, "Write a note") }), req.body);
    const doc = await model.findById(req.params.id);
    if (!doc) throw notFound();
    doc.get("notes").push({ text, by: req.user!._id, byName: req.user!.name });
    await doc.save();
    res.status(201).json(doc.toObject());
  });

  r.delete("/:id", requirePermission("leads"), async (req, res) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound();
    logActivity(req, "delete", opts.entity, { id: doc._id });
    res.json({ ok: true });
  });

  return r;
}

export const enquiriesRouter = leadRouter(Enquiry, {
  entity: "enquiry",
  statuses: ENQUIRY_STATUS,
  search: ["name", "phone", "villaName", "destination", "occasion", "attribution.label"],
  csv: (d) => ({
    received: d.createdAt,
    status: d.status,
    villa: d.villaName ?? "",
    destination: d.destination ?? "",
    checkIn: d.checkIn ? new Date(d.checkIn).toISOString().slice(0, 10) : "",
    checkOut: d.checkOut ? new Date(d.checkOut).toISOString().slice(0, 10) : "",
    guests: d.guests ?? "",
    occasion: d.occasion ?? "",
    name: d.name ?? "",
    phone: d.phone ?? "",
    source: d.attribution?.label ?? d.attribution?.source ?? "",
    campaign: d.attribution?.campaign ?? "",
    placement: d.placement ?? "",
    page: d.page ?? "",
  }),
});

export const ownerLeadsRouter = leadRouter(OwnerLead, {
  entity: "owner lead",
  statuses: OWNER_LEAD_STATUS,
  search: ["name", "phone", "location"],
  csv: (d) => ({
    received: d.createdAt,
    status: d.status,
    name: d.name,
    phone: d.phone,
    location: d.location,
    bedrooms: d.rooms,
    photos: d.photos ?? "",
    note: d.note ?? "",
    source: d.source ?? "",
  }),
});
