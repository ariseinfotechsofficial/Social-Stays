import { Router, type Request } from "express";
import type { Model, PopulateOptions } from "mongoose";
import { logActivity } from "../../lib/activity.js";
import { requirePermission, requireStaff, type Permission } from "../../lib/auth.js";
import { HttpError, escapeRegex, notFound, pagination, slugify } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";

type AnyModel = Model<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Doc = Record<string, unknown> & { _id: unknown };

export type CrudOptions = {
  /** Activity log entity name, e.g. "villa" */
  entity: string;
  /** Needed to create, edit and delete; reading is open to all staff */
  permission: Permission;
  /** Restrict reading too (e.g. users, coupons) */
  readPermission?: Permission;
  searchFields?: string[];
  /** Query-string keys that filter by equality, e.g. ["status", "destination"] */
  filters?: string[];
  defaultSort?: string;
  populate?: PopulateOptions | PopulateOptions[];
  /** Fields left out of list responses to keep them light */
  listExclude?: string;
  label?: (doc: Doc) => string;
  /** Throws an HttpError when the document is still referenced elsewhere */
  beforeDelete?: (doc: Doc) => Promise<void>;
  /** Tweak the incoming body (e.g. fill a slug from the name) */
  prepare?: (body: Record<string, unknown>, existing?: Doc) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** The website caches public content; content changes refresh it */
  affectsSite?: boolean;
  /** Fields reset when duplicating, e.g. { status: "draft" } */
  duplicate?: (doc: Doc) => Record<string, unknown>;
};

const READ_ONLY = ["_id", "id", "__v", "createdAt", "updatedAt"];

export function cleanBody(body: unknown) {
  const out = { ...((body ?? {}) as Record<string, unknown>) };
  for (const key of READ_ONLY) delete out[key];
  return out;
}

/** Standard admin endpoints for one collection. */
export function crudRouter(model: AnyModel, opts: CrudOptions) {
  const r = Router();
  const read = opts.readPermission ? requirePermission(opts.readPermission) : requireStaff;
  const write = requirePermission(opts.permission);
  const label = (doc: Doc) => opts.label?.(doc) ?? String(doc.name ?? doc.title ?? doc.slug ?? doc._id);
  const changed = () => opts.affectsSite !== false && revalidateSite();

  r.get("/", read, async (req, res) => {
    const { page, limit, skip, sort } = pagination(req.query, { limit: 50, sort: opts.defaultSort ?? "order" });
    const filter: Record<string, unknown> = {};
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q && opts.searchFields?.length) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = opts.searchFields.map((f) => ({ [f]: rx }));
    }
    for (const key of opts.filters ?? []) {
      const v = req.query[key];
      if (typeof v === "string" && v !== "") filter[key] = v === "true" ? true : v === "false" ? false : v;
    }
    const query = model.find(filter).sort(sort).skip(skip).limit(limit);
    if (opts.listExclude) query.select(opts.listExclude);
    if (opts.populate) query.populate(opts.populate);
    const [items, total] = await Promise.all([query.lean(), model.countDocuments(filter)]);
    res.json({ items, total, page, limit });
  });

  r.get("/:id", read, async (req, res) => {
    const query = model.findById(req.params.id);
    if (opts.populate) query.populate(opts.populate);
    const doc = await query.lean();
    if (!doc) throw notFound();
    res.json(doc);
  });

  r.post("/", write, async (req, res) => {
    let body = cleanBody(req.body);
    if (opts.prepare) body = await opts.prepare(body);
    if (model.schema.path("order") && body.order === undefined) {
      const last = await model.findOne().sort("-order").select("order").lean<{ order?: number }>();
      body.order = (last?.order ?? -1) + 1;
    }
    const doc = await model.create(body);
    logActivity(req, "create", opts.entity, { id: doc._id, label: label(doc.toObject()) });
    changed();
    res.status(201).json(doc.toObject());
  });

  r.patch("/:id", write, async (req, res) => {
    const doc = await model.findById(req.params.id);
    if (!doc) throw notFound();
    let body = cleanBody(req.body);
    if (opts.prepare) body = await opts.prepare(body, doc.toObject());
    doc.set(body);
    await doc.save();
    logActivity(req, "update", opts.entity, { id: doc._id, label: label(doc.toObject()), meta: { fields: Object.keys(body) } });
    changed();
    res.json(doc.toObject());
  });

  r.delete("/:id", write, async (req, res) => {
    const doc = await model.findById(req.params.id);
    if (!doc) throw notFound();
    await opts.beforeDelete?.(doc.toObject());
    await doc.deleteOne();
    logActivity(req, "delete", opts.entity, { id: doc._id, label: label(doc.toObject()) });
    changed();
    res.json({ ok: true });
  });

  /** Saves a drag-and-drop order: body { ids: [...] } */
  r.post("/reorder", write, async (req: Request, res) => {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as string[]) : [];
    if (!ids.length) throw new HttpError(400, "Nothing to reorder");
    await model.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })));
    logActivity(req, "reorder", opts.entity, { meta: { count: ids.length } });
    changed();
    res.json({ ok: true });
  });

  r.post("/:id/duplicate", write, async (req, res) => {
    const source = await model.findById(req.params.id).lean<Doc>();
    if (!source) throw notFound();
    const copy = cleanBody(source);
    const suffix = `copy-${Date.now().toString(36).slice(-4)}`;
    for (const key of ["slug", "key", "code"]) {
      if (typeof copy[key] === "string") copy[key] = key === "code" ? `${copy[key]}-${suffix}`.toUpperCase() : slugify(`${copy[key]}-${suffix}`);
    }
    for (const key of ["name", "title", "headline"]) {
      if (typeof copy[key] === "string") copy[key] = `${copy[key]} (copy)`;
    }
    Object.assign(copy, opts.duplicate?.(source));
    const doc = await model.create(copy);
    logActivity(req, "duplicate", opts.entity, { id: doc._id, label: label(doc.toObject()) });
    res.status(201).json(doc.toObject());
  });

  return r;
}

/** Fills a missing slug from a name/title field. */
export const slugFrom =
  (field: string, slugField = "slug") =>
  (body: Record<string, unknown>, existing?: Doc) => {
    if (!body[slugField] && !existing?.[slugField] && typeof body[field] === "string") body[slugField] = slugify(body[field] as string);
    if (typeof body[slugField] === "string") body[slugField] = slugify(body[slugField] as string);
    return body;
  };

/** Blocks deleting something other documents still point at. */
export const inUseBy =
  (checks: { model: AnyModel; field: string; what: string }[]) =>
  async (doc: Doc) => {
    for (const check of checks) {
      const count = await check.model.countDocuments({ [check.field]: doc._id });
      if (count) throw new HttpError(409, `Still used by ${count} ${check.what}${count === 1 ? "" : "s"}. Change those first.`);
    }
  };
