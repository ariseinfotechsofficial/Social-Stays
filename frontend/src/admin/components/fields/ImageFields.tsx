"use client";

import { ImageIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { MediaPicker } from "@admin/components/media/MediaPicker";
import { DragHandle, Sortable } from "@admin/components/sortable";
import { Button } from "@admin/components/ui/button";
import { Field, Input } from "@admin/components/ui/form";
import { Dialog } from "@admin/components/ui/overlay";
import { toImage, type ImageValue } from "@admin/lib/media";
import { mediaUrl } from "@admin/lib/api";

function Thumb({ img, className }: { img: ImageValue; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mediaUrl(img.src)} alt={img.alt ?? ""} loading="lazy" className={className} />;
}

/** One photo with its alt text for this use */
export function ImageField({ value, onChange, folder }: { value: ImageValue | null | undefined; onChange: (v: ImageValue | null) => void; folder?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-[10px] border border-dashed border-field bg-sand/60 sm:w-48"
        aria-label={value ? "Replace photo" : "Choose photo"}
      >
        {value?.src ? <Thumb img={value} className="absolute inset-0 size-full object-cover" /> : <ImageIcon weight="light" className="size-9 text-brass" />}
      </button>
      <div className="min-w-0 flex-1 space-y-3">
        <Field label="Alt text" help="Describe the photo for screen readers and Google.">
          <Input value={value?.alt ?? ""} disabled={!value} placeholder={value ? "e.g. Pool and lawn at dusk" : "Choose a photo first"} onChange={(e) => value && onChange({ ...value, alt: e.target.value })} />
        </Field>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {value ? "Replace" : "Choose photo"}
          </Button>
          {value && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPicker open={open} onOpenChange={setOpen} folder={folder} onSelect={([m]) => onChange(toImage(m, value?.alt || undefined))} />
    </div>
  );
}

/** Gallery: drag to reorder; the first photo is the cover */
export function ImagesField({ value, onChange, folder }: { value: ImageValue[] | undefined; onChange: (v: ImageValue[]) => void; folder?: string }) {
  const list = value ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [alt, setAlt] = useState("");

  return (
    <div>
      {list.length > 0 && (
        <Sortable
          grid
          items={list}
          getId={(img, i) => `${img.src}#${i}`}
          onReorder={onChange}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
          render={(img, i, handle) => (
            <div className="group overflow-hidden rounded-[10px] border border-line bg-white">
              <div className="relative aspect-[4/3] bg-sand-deep">
                <Thumb img={img} className="absolute inset-0 size-full object-cover" />
                {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[0.6875rem] font-bold text-gold-deep">COVER</span>}
              </div>
              <div className="flex items-center gap-1 px-1.5 py-1.5">
                <DragHandle handle={handle} />
                <p className="min-w-0 flex-1 truncate text-[0.75rem] text-ink-soft" title={img.alt}>
                  {img.alt || <span className="text-error">No alt text</span>}
                </p>
                <button
                  type="button"
                  aria-label="Edit alt text"
                  className="grid size-7 place-items-center rounded-[6px] hover:bg-sand"
                  onClick={() => {
                    setEditing(i);
                    setAlt(img.alt ?? "");
                  }}
                >
                  <PencilSimpleIcon className="size-3.5" />
                </button>
                <button type="button" aria-label="Remove photo" className="grid size-7 place-items-center rounded-[6px] text-error hover:bg-error-soft" onClick={() => onChange(list.filter((_, j) => j !== i))}>
                  <TrashIcon className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        />
      )}
      <Button variant="secondary" size="sm" icon={<PlusIcon className="size-4" />} className="mt-3" onClick={() => setOpen(true)}>
        Add photos
      </Button>
      <MediaPicker open={open} onOpenChange={setOpen} multiple folder={folder} onSelect={(items) => onChange([...list, ...items.map((m) => toImage(m))])} />
      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Alt text"
        size="sm"
        footer={
          <Button
            onClick={() => {
              if (editing === null) return;
              onChange(list.map((img, j) => (j === editing ? { ...img, alt } : img)));
              setEditing(null);
            }}
          >
            Save
          </Button>
        }
      >
        {editing !== null && list[editing] && <Thumb img={list[editing]} className="mb-4 aspect-[4/3] w-full rounded-[8px] object-cover" />}
        <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the photo" autoFocus />
      </Dialog>
    </div>
  );
}
