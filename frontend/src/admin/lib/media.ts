import { ApiError } from "@admin/lib/api";

/** An image as stored on a document (snapshot of a media item plus alt text for this use) */
export type ImageValue = { src: string; width?: number; height?: number; alt?: string; blur?: string; media?: string };

export type MediaItem = {
  _id: string;
  filename: string;
  src: string;
  folder: string;
  width?: number;
  height?: number;
  size?: number;
  alt: string;
  blur?: string;
  source: "upload" | "seed";
  createdAt: string;
};

export const toImage = (m: MediaItem, alt?: string): ImageValue => ({ src: m.src, width: m.width, height: m.height, alt: alt ?? m.alt, blur: m.blur, media: m._id });

const MAX_EDGE = 2560;

/**
 * Shrinks big camera photos in the browser before upload: faster on phones and keeps every request
 * well under hosting limits. The server converts to WebP anyway.
 */
async function prepare(file: File): Promise<Blob | File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 4 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, file.type === "image/png" ? "image/png" : "image/jpeg", 0.9));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Uploads photos to the media library, a few at a time, reporting progress */
export async function uploadFiles(files: File[], opts: { folder: string; onProgress?: (done: number, total: number) => void }): Promise<MediaItem[]> {
  const out: MediaItem[] = [];
  let done = 0;
  for (let i = 0; i < files.length; i += 3) {
    const batch = files.slice(i, i + 3);
    const form = new FormData();
    form.set("folder", opts.folder);
    for (const f of batch) {
      const blob = await prepare(f);
      form.append("files", blob, f.name);
    }
    const res = await fetch("/api/admin/media", { method: "POST", body: form, credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, data.error ?? "Upload failed");
    out.push(...(data.items as MediaItem[]));
    done += batch.length;
    opts.onProgress?.(done, files.length);
  }
  return out;
}

export const fileSize = (bytes?: number) => (!bytes ? "" : bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);
