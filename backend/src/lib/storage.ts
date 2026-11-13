import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "../config/env.js";
import { slugify } from "./http.js";

/** Longest edge kept for uploads; enough for a full-bleed hero on a 4K screen once Next.js resizes it. */
const MAX_EDGE = 2560;

export type StoredImage = { src: string; filename: string; width: number; height: number; size: number; mime: string; blur: string };

/** A tiny blurred preview, inlined as a data URL and shown while the real photo loads. */
export async function blurDataUrl(input: Buffer | string) {
  const buf = await sharp(input).resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

/**
 * Saves an uploaded image as WebP under UPLOADS_DIR/<folder>/<yyyy>/<mm>/ and returns its public path.
 * Rotates by EXIF, strips metadata and caps the size.
 */
export async function saveImage(input: Buffer, opts: { folder: string; originalName: string }): Promise<StoredImage> {
  const folder = slugify(opts.folder) || "general";
  const now = new Date();
  const dir = path.join(folder, String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, "0"));
  const base = slugify(path.parse(opts.originalName).name).slice(0, 50) || "image";
  const filename = `${base}-${randomBytes(4).toString("hex")}.webp`;

  const pipeline = sharp(input, { failOn: "error" }).rotate().resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true });
  const { data, info } = await pipeline.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });

  await fs.mkdir(path.join(env.uploadsDir, dir), { recursive: true });
  await fs.writeFile(path.join(env.uploadsDir, dir, filename), data);

  return {
    src: `/uploads/${[...dir.split(path.sep), filename].join("/")}`,
    filename: opts.originalName,
    width: info.width,
    height: info.height,
    size: data.length,
    mime: "image/webp",
    blur: await blurDataUrl(data),
  };
}

/** Deletes an uploaded file. Seed photos (served from seed-assets) are never touched. */
export async function deleteUpload(src: string) {
  if (!src.startsWith("/uploads/")) return;
  const file = path.resolve(env.uploadsDir, src.slice("/uploads/".length));
  if (!file.startsWith(env.uploadsDir + path.sep)) return;
  await fs.rm(file, { force: true });
}
