import { Router } from "express";
import { z } from "zod";
import { PAGES, SECTION_TYPES, pageDef } from "../../content/registry.js";
import { logActivity } from "../../lib/activity.js";
import { requirePermission } from "../../lib/auth.js";
import { HttpError, notFound, parse } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { Page } from "../../models/content.js";

export const pagesRouter = Router();

/** Brings a stored page in line with the registry: adds new sections, drops removed ones, keeps order and content. */
export function normalisePage(key: string, stored?: { sections?: { key: string; type: string; enabled?: boolean; data?: unknown }[] } | null) {
  const def = pageDef(key);
  if (!def) throw notFound("Unknown page");
  const byKey = new Map((stored?.sections ?? []).map((s) => [s.key, s]));
  const known = new Set(def.sections.map((s) => s.key));
  const ordered = [
    ...(stored?.sections ?? []).filter((s) => known.has(s.key)).map((s) => s.key),
    ...def.sections.filter((s) => !byKey.has(s.key)).map((s) => s.key),
  ];
  const keys = def.reorderable ? ordered : def.sections.map((s) => s.key);
  return keys.map((k) => {
    const sec = def.sections.find((s) => s.key === k)!;
    const saved = byKey.get(k);
    return { key: k, type: sec.type, enabled: saved?.enabled ?? true, data: (saved?.data as Record<string, unknown>) ?? {} };
  });
}

pagesRouter.get("/", requirePermission("content"), async (_req, res) => {
  const docs = await Page.find().select("key updatedAt").lean();
  const updated = Object.fromEntries(docs.map((d) => [d.key, d.updatedAt]));
  res.json({ pages: PAGES.map((p) => ({ ...p, updatedAt: updated[p.key] ?? null })), sectionTypes: SECTION_TYPES });
});

pagesRouter.get("/:key", requirePermission("content"), async (req, res) => {
  const def = pageDef(String(req.params.key));
  if (!def) throw notFound("Unknown page");
  const doc = await Page.findOne({ key: def.key }).lean();
  res.json({ def, seo: doc?.seo ?? {}, sections: normalisePage(def.key, doc), updatedAt: doc?.updatedAt ?? null });
});

const PageBody = z.object({
  seo: z.record(z.string(), z.unknown()).optional(),
  sections: z.array(z.object({ key: z.string(), enabled: z.boolean(), data: z.record(z.string(), z.unknown()) })),
});

pagesRouter.put("/:key", requirePermission("content"), async (req, res) => {
  const def = pageDef(String(req.params.key));
  if (!def) throw notFound("Unknown page");
  const body = parse(PageBody, req.body);
  const known = new Map(def.sections.map((s) => [s.key, s.type]));
  for (const s of body.sections) if (!known.has(s.key)) throw new HttpError(422, `Unknown section "${s.key}"`);

  const sections = normalisePage(def.key, { sections: body.sections.map((s) => ({ ...s, type: known.get(s.key)! })) });
  const doc = await Page.findOneAndUpdate(
    { key: def.key },
    { $set: { sections, ...(def.seo && body.seo ? { seo: body.seo } : {}) } },
    { upsert: true, returnDocument: "after", runValidators: true },
  ).lean();
  logActivity(req, "update", "page", { id: doc?._id, label: def.label });
  revalidateSite();
  res.json({ def, seo: doc?.seo ?? {}, sections: normalisePage(def.key, doc), updatedAt: doc?.updatedAt });
});
