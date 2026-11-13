"use client";

import { CopyIcon, ImageBrokenIcon, MagnifyingGlassIcon, TrashIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MediaGrid, Uploader, useMediaLibrary } from "@admin/components/media/MediaPicker";
import { NoAccess } from "@admin/components/NoAccess";
import { Button } from "@admin/components/ui/button";
import { Card, Empty, Loading } from "@admin/components/ui/feedback";
import { Field, Input, Select } from "@admin/components/ui/form";
import { PageHeader } from "@admin/components/ui/layout";
import { Drawer, useConfirm } from "@admin/components/ui/overlay";
import { ApiError, api } from "@admin/lib/api";
import { fileSize, type MediaItem } from "@admin/lib/media";
import { useCan } from "@admin/lib/session";
import { shortDate } from "@admin/lib/utils";

export default function MediaPage() {
  const can = useCan();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("");
  const [uploadFolder, setUploadFolder] = useState("general");
  const [current, setCurrent] = useState<MediaItem | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const lib = useMediaLibrary(q, folder);
  const items = lib.data?.pages.flatMap((p) => p.items) ?? [];
  const folders = lib.data?.pages[0]?.folders ?? [];
  const total = lib.data?.pages[0]?.total ?? 0;

  if (!can("media", "content", "catalog")) return <NoAccess />;

  const open = (m: MediaItem) => {
    setCurrent(m);
    setAlt(m.alt);
  };

  const saveAlt = async () => {
    if (!current) return;
    setBusy(true);
    try {
      const updated = await api<MediaItem>(`/admin/media/${current._id}`, { method: "PATCH", json: { alt } });
      setCurrent(updated);
      toast.success("Alt text saved. Photos already placed keep their own alt text.");
      qc.invalidateQueries({ queryKey: ["media"] });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!current) return;
    try {
      const { usedIn } = await api<{ usedIn: string[] }>(`/admin/media/${current._id}/usage`);
      const ok = await confirm({
        title: "Delete this photo?",
        body: usedIn.length ? (
          <>
            <p>It is still used in:</p>
            <ul className="mt-2 list-disc pl-5">
              {usedIn.slice(0, 8).map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
            <p className="mt-2">Those places will show a broken image until you replace it.</p>
          </>
        ) : (
          "It isn't used anywhere on the website."
        ),
        confirmLabel: usedIn.length ? "Delete anyway" : "Delete",
        danger: true,
      });
      if (!ok) return;
      await api(`/admin/media/${current._id}`, { method: "DELETE", query: { force: usedIn.length ? 1 : undefined } });
      toast.success("Photo deleted");
      setCurrent(null);
      qc.invalidateQueries({ queryKey: ["media"] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't delete");
    }
  };

  return (
    <>
      <PageHeader title="Media library" description={`${total} photo${total === 1 ? "" : "s"}. Uploads are resized and converted to WebP. Photos you add here can be used anywhere on the site.`} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card padded={false}>
          <div className="flex flex-wrap gap-2 border-b border-line p-3">
            <div className="relative min-w-52 flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
              <Input placeholder="Search by name or description" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={folder} onChange={(e) => setFolder(e.target.value)} className="w-48" aria-label="Folder">
              <option value="">All folders</option>
              {folders.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </div>
          <div className="p-3">
            {lib.isLoading ? (
              <Loading />
            ) : items.length ? (
              <>
                <MediaGrid items={items} selected={new Set(current ? [current._id] : [])} onToggle={open} />
                {lib.hasNextPage && (
                  <div className="mt-4 text-center">
                    <Button variant="secondary" size="sm" loading={lib.isFetchingNextPage} onClick={() => lib.fetchNextPage()}>
                      Load more
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Empty icon={ImageBrokenIcon} title="No photos here" />
            )}
          </div>
        </Card>
        <Card title="Upload">
          <Field label="Folder" help="Keeps the library tidy, e.g. villas, site, team">
            <Input value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} list="folders" />
            <datalist id="folders">
              {folders.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </Field>
          <div className="mt-4">
            <Uploader compact folder={uploadFolder} onUploaded={() => {}} />
          </div>
        </Card>
      </div>

      <Drawer
        open={Boolean(current)}
        onOpenChange={(o) => !o && setCurrent(null)}
        title={current?.filename ?? "Photo"}
        footer={
          current && (
            <>
              <Button onClick={saveAlt} loading={busy} disabled={alt === current.alt}>
                Save alt text
              </Button>
              {can("media") && (
                <Button variant="danger" icon={<TrashIcon className="size-4" />} onClick={remove} className="ml-auto">
                  Delete
                </Button>
              )}
            </>
          )
        }
      >
        {current && (
          <div className="space-y-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={current.alt} className="w-full rounded-[10px] bg-sand-deep object-contain" />
            <dl className="grid grid-cols-2 gap-3 text-[0.8125rem]">
              <div>
                <dt className="text-ink-soft">Size</dt>
                <dd className="font-semibold">
                  {current.width} × {current.height} · {fileSize(current.size)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft">Folder</dt>
                <dd className="font-semibold">{current.folder}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Added</dt>
                <dd className="font-semibold">{shortDate(current.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Source</dt>
                <dd className="font-semibold">{current.source === "seed" ? "Original site photo" : "Uploaded"}</dd>
              </div>
            </dl>
            <Field label="Default alt text" help="Used when this photo is placed somewhere new.">
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
            </Field>
            <Button
              variant="secondary"
              size="sm"
              icon={<CopyIcon className="size-4" />}
              onClick={() => {
                void navigator.clipboard.writeText(new URL(current.src, window.location.origin).toString());
                toast.success("Link copied");
              }}
            >
              Copy link
            </Button>
          </div>
        )}
      </Drawer>
    </>
  );
}
