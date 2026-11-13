import { Router } from "express";
import multer from "multer";
import type { Model } from "mongoose";
import { logActivity } from "../../lib/activity.js";
import { requireAuth, requirePermission } from "../../lib/auth.js";
import { HttpError, escapeRegex, notFound, pagination } from "../../lib/http.js";
import { deleteUpload, saveImage } from "../../lib/storage.js";
import { Destination, Experience, Occasion, Villa } from "../../models/catalog.js";
import { LandingPage, Media, Page, TeamMember } from "../../models/content.js";
import { Settings } from "../../models/settings.js";

export const mediaRouter = Router();

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/heic", "image/heif"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 30 },
  fileFilter: (_req, file, cb) => (ACCEPTED.includes(file.mimetype) ? cb(null, true) : cb(new HttpError(415, `${file.originalname} is not a photo we can use (JPG, PNG, WebP or AVIF)`))),
});

/** Uploads work for staff with media access and for owners (photos for listing requests). */
const canUpload = (req: Parameters<typeof requireAuth>[0], _res: unknown, next: () => void) => {
  if (req.user?.role === "owner" || req.user?.permissions.includes("media") || req.user?.permissions.includes("content") || req.user?.permissions.includes("catalog")) return next();
  throw new HttpError(403, "You don't have access to the media library");
};

mediaRouter.get("/", requirePermission("media", "content", "catalog"), async (req, res) => {
  const { page, limit, skip, sort } = pagination(req.query, { limit: 60, sort: "-createdAt" });
  const filter: Record<string, unknown> = {};
  if (typeof req.query.folder === "string" && req.query.folder) filter.folder = req.query.folder;
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    const rx = new RegExp(escapeRegex(req.query.q.trim()), "i");
    filter.$or = [{ filename: rx }, { alt: rx }, { src: rx }];
  }
  const [items, total, folders] = await Promise.all([
    Media.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Media.countDocuments(filter),
    Media.distinct("folder"),
  ]);
  res.json({ items, total, page, limit, folders: folders.sort() });
});

mediaRouter.post("/", canUpload, upload.array("files", 30), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw new HttpError(400, "Choose at least one photo");
  const folder = req.user?.role === "owner" ? "owner-uploads" : String(req.body.folder || "general");
  const alt = typeof req.body.alt === "string" ? req.body.alt : "";
  const saved = [];
  for (const file of files) {
    try {
      const img = await saveImage(file.buffer, { folder, originalName: file.originalname });
      saved.push(await Media.create({ ...img, folder, alt, uploadedBy: req.user!._id }));
    } catch (err) {
      throw new HttpError(422, `Could not read ${file.originalname}. Is it a valid photo?`, String((err as Error).message));
    }
  }
  logActivity(req, "upload", "media", { label: `${saved.length} photo${saved.length === 1 ? "" : "s"}`, meta: { folder } });
  res.status(201).json({ items: saved.map((m) => m.toObject()) });
});

mediaRouter.patch("/:id", requirePermission("media", "content", "catalog"), async (req, res) => {
  const doc = await Media.findById(req.params.id);
  if (!doc) throw notFound();
  if (typeof req.body.alt === "string") doc.alt = req.body.alt;
  if (typeof req.body.folder === "string" && req.body.folder.trim()) doc.folder = req.body.folder.trim();
  await doc.save();
  res.json(doc.toObject());
});

/** Where a photo is used, so it isn't deleted out from under a page. */
async function usage(src: string) {
  const checks: [Model<any>, string, string[]][] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
    [Villa, "villa", ["photos.src", "seo.ogImage.src"]],
    [Destination, "destination", ["hero.src", "card.src", "thingsToDo.photo.src", "seo.ogImage.src"]],
    [Experience, "experience", ["photo.src"]],
    [Occasion, "occasion", ["photo.src"]],
    [TeamMember, "team member", ["photo.src"]],
    [LandingPage, "landing page", ["hero.src", "gallery.src", "seo.ogImage.src"]],
  ];
  const found: string[] = [];
  for (const [model, what, paths] of checks) {
    const docs = await model.find({ $or: paths.map((p) => ({ [p]: src })) }).select("name title headline slug").lean<Record<string, string>[]>();
    for (const d of docs) found.push(`${what} "${d.name ?? d.title ?? d.headline ?? d.slug}"`);
  }
  // Page sections and settings are free-form, so search their JSON
  const pages = await Page.find().lean();
  for (const p of pages) if (JSON.stringify(p).includes(src)) found.push(`page "${p.key}"`);
  const settings = await Settings.findOne().lean();
  if (settings && JSON.stringify(settings).includes(src)) found.push("site settings");
  return found;
}

mediaRouter.get("/:id/usage", requirePermission("media", "content", "catalog"), async (req, res) => {
  const doc = await Media.findById(req.params.id).lean();
  if (!doc) throw notFound();
  res.json({ usedIn: await usage(doc.src) });
});

mediaRouter.delete("/:id", requirePermission("media"), async (req, res) => {
  const doc = await Media.findById(req.params.id);
  if (!doc) throw notFound();
  const usedIn = await usage(doc.src);
  if (usedIn.length && req.query.force !== "1") {
    throw new HttpError(409, `This photo is still used in ${usedIn.slice(0, 3).join(", ")}${usedIn.length > 3 ? ` and ${usedIn.length - 3} more` : ""}.`, { usedIn });
  }
  if (doc.source === "upload") await deleteUpload(doc.src);
  await doc.deleteOne();
  logActivity(req, "delete", "media", { id: doc._id, label: doc.filename });
  res.json({ ok: true });
});
