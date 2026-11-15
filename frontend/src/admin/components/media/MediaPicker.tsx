"use client";

import { CheckCircleIcon, CloudArrowUpIcon, ImageBrokenIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@admin/components/ui/button";
import { Empty, Spinner } from "@admin/components/ui/feedback";
import { Input, Select } from "@admin/components/ui/form";
import { Tabs } from "@admin/components/ui/layout";
import { Dialog } from "@admin/components/ui/overlay";
import { ApiError, api, mediaUrl } from "@admin/lib/api";
import { uploadFiles, type MediaItem } from "@admin/lib/media";
import { cn } from "@admin/lib/utils";

type Page = { items: MediaItem[]; total: number; page: number; limit: number; folders: string[] };

export function useMediaLibrary(q: string, folder: string) {
  return useInfiniteQuery({
    queryKey: ["media", q, folder],
    queryFn: ({ pageParam }) => api<Page>("/admin/media", { query: { q, folder, page: pageParam, limit: 48 } }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
}

/** Drop zone + file input that uploads to the library */
export function Uploader({ folder, onUploaded, compact }: { folder: string; onUploaded: (items: MediaItem[]) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [over, setOver] = useState(false);
  const qc = useQueryClient();

  const handle = async (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (!files.length) return;
    setProgress({ done: 0, total: files.length });
    try {
      const items = await uploadFiles(files, { folder, onProgress: (done, total) => setProgress({ done, total }) });
      toast.success(`${items.length} photo${items.length === 1 ? "" : "s"} uploaded`);
      await qc.invalidateQueries({ queryKey: ["media"] });
      onUploaded(items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void handle(e.dataTransfer.files);
      }}
      className={cn("flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed text-center transition-colors", over ? "border-gold bg-sand" : "border-field", compact ? "px-4 py-6" : "px-6 py-14")}
    >
      {progress ? (
        <>
          <Spinner />
          <p className="mt-3 text-[0.875rem] font-semibold">
            Uploading {progress.done} of {progress.total}
          </p>
        </>
      ) : (
        <>
          <CloudArrowUpIcon weight="light" className="size-10 text-brass" />
          <p className="mt-2 font-semibold">Drop photos here</p>
          <p className="mt-0.5 text-[0.8125rem] text-ink-soft">JPG, PNG, WebP or HEIC. Large photos are resized and converted to WebP automatically.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => input.current?.click()}>
            Choose photos
          </Button>
        </>
      )}
      <input ref={input} type="file" accept="image/*,.heic,.heif" multiple className="sr-only" onChange={(e) => void handle(e.target.files)} />
    </div>
  );
}

export function MediaGrid({ items, selected, onToggle }: { items: MediaItem[]; selected: Set<string>; onToggle: (m: MediaItem) => void }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {items.map((m) => {
        const on = selected.has(m._id);
        return (
          <li key={m._id}>
            <button
              type="button"
              onClick={() => onToggle(m)}
              className={cn("group relative block aspect-square w-full overflow-hidden rounded-[8px] bg-sand-deep ring-offset-2 transition", on ? "ring-2 ring-gold" : "hover:opacity-90")}
              title={m.alt || m.filename}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(m.src)} alt={m.alt} loading="lazy" className="size-full object-cover" />
              {on && <CheckCircleIcon weight="fill" className="absolute top-1.5 right-1.5 size-6 rounded-full bg-white text-gold" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Choose one or more photos from the library, or upload new ones */
export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  multiple,
  folder = "general",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  folder?: string;
}) {
  const [tab, setTab] = useState("library");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [picked, setPicked] = useState<MediaItem[]>([]);
  const lib = useMediaLibrary(q, filter);
  const items = lib.data?.pages.flatMap((p) => p.items) ?? [];
  const folders = lib.data?.pages[0]?.folders ?? [];

  const toggle = (m: MediaItem) =>
    setPicked((cur) => (cur.some((x) => x._id === m._id) ? cur.filter((x) => x._id !== m._id) : multiple ? [...cur, m] : [m]));

  const done = (list = picked) => {
    if (!list.length) return;
    onSelect(list);
    setPicked([]);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setPicked([]);
        onOpenChange(o);
      }}
      title={multiple ? "Choose photos" : "Choose a photo"}
      size="xl"
      footer={
        <>
          <span className="mr-auto text-[0.8125rem] text-ink-soft">{picked.length ? `${picked.length} selected` : "Click photos to select them"}</span>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => done()} disabled={!picked.length}>
            {multiple ? `Add ${picked.length || ""} photo${picked.length === 1 ? "" : "s"}` : "Use photo"}
          </Button>
        </>
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "library", label: "Library" },
          { value: "upload", label: "Upload new" },
        ]}
      />
      <div className="mt-4">
        {tab === "upload" ? (
          <Uploader
            folder={folder}
            onUploaded={(uploaded) => {
              if (!multiple && uploaded[0]) return done([uploaded[0]]);
              setPicked((cur) => [...cur, ...uploaded]);
              setTab("library");
            }}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="relative min-w-48 flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
                <Input placeholder="Search by name or description" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
              </div>
              <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
                <option value="">All folders</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </div>
            {lib.isLoading ? (
              <div className="py-10 text-center">
                <Spinner />
              </div>
            ) : items.length ? (
              <>
                <MediaGrid items={items} selected={new Set(picked.map((p) => p._id))} onToggle={toggle} />
                {lib.hasNextPage && (
                  <div className="mt-4 text-center">
                    <Button variant="secondary" size="sm" loading={lib.isFetchingNextPage} onClick={() => lib.fetchNextPage()}>
                      Load more
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Empty icon={ImageBrokenIcon} title="No photos found" action={<Button size="sm" onClick={() => setTab("upload")}>Upload photos</Button>}>
                Try another search, or upload new photos.
              </Empty>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
