import type { FieldDef, FormValue } from "@admin/components/fields/types";
import { Badge } from "@admin/components/ui/feedback";
import type { ImageValue } from "@admin/lib/media";
import { mediaUrl } from "@admin/lib/api";

export const PUBLISH_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft (hidden)" },
];

export const statusField: FieldDef = { name: "status", label: "Status", type: "select", options: PUBLISH_OPTIONS, width: "third" };

export function PublishBadge({ status }: { status?: unknown }) {
  return status === "draft" ? <Badge>Draft</Badge> : <Badge tone="success">Published</Badge>;
}

export function Thumb({ img, rounded = "rounded-[6px]" }: { img?: ImageValue | null; rounded?: string }) {
  return img?.src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaUrl(img.src)} alt="" loading="lazy" className={`size-10 shrink-0 object-cover ${rounded}`} />
  ) : (
    <span className={`block size-10 shrink-0 bg-sand-deep ${rounded}`} />
  );
}

export function TitleCell({ title, sub, img }: { title: string; sub?: string; img?: ImageValue | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {img !== undefined && <Thumb img={img} />}
      <div className="min-w-0">
        <p className="truncate font-semibold">{title}</p>
        {sub && <p className="truncate text-[0.8125rem] text-ink-soft">{sub}</p>}
      </div>
    </div>
  );
}

/** Populated refs ({ _id, name }) → ids, for the listed paths */
export function idsFor(doc: FormValue, paths: string[]) {
  const out = { ...doc };
  const id = (v: unknown) => (v && typeof v === "object" ? String((v as { _id?: unknown })._id ?? "") : v);
  for (const p of paths) {
    const v = out[p];
    out[p] = Array.isArray(v) ? v.map(id) : id(v);
  }
  return out;
}

export const seoSection = (titleHint?: string) => ({
  title: "Search & sharing",
  description: "How this page appears on Google and when shared on WhatsApp.",
  fields: [{ name: "seo", label: "SEO", type: "seo", titleHint } as FieldDef],
});

export const name = (doc: FormValue) => String(doc.name ?? doc.title ?? doc.label ?? "");
