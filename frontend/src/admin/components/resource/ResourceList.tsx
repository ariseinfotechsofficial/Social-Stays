"use client";

import { CopyIcon, DotsThreeIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DragHandle, Sortable } from "@admin/components/sortable";
import { ButtonLink } from "@admin/components/ui/button";
import { Card, Empty, Loading } from "@admin/components/ui/feedback";
import { Input, Select } from "@admin/components/ui/form";
import { PageHeader, Pagination } from "@admin/components/ui/layout";
import { Menu, useConfirm } from "@admin/components/ui/overlay";
import { ApiError, api, type ListResponse } from "@admin/lib/api";
import { useCan } from "@admin/lib/session";
import { cn } from "@admin/lib/utils";
import type { Doc, ResourceConfig } from "@admin/resources/types";

export function ResourceList({ config }: { config: ResourceConfig }) {
  const router = useRouter();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const can = useCan();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const filtered = Boolean(q || Object.values(filters).some(Boolean));
  const limit = config.sortable && !filtered ? 200 : 50;

  const list = useQuery({
    queryKey: [config.endpoint, "list", q, filters, page],
    queryFn: () => api<ListResponse<Doc>>(config.endpoint, { query: { q, page, limit, sort: config.sort, ...filters } }),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api(`${config.endpoint}/reorder`, { method: "POST", json: { ids } }),
    onSuccess: () => toast.success("Order saved"),
    onError: (e) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: [config.endpoint] }),
  });

  const remove = async (doc: Doc) => {
    if (!(await confirm({ title: `Delete ${config.titleOf(doc)}?`, body: "This can't be undone.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await api(`${config.endpoint}/${doc._id}`, { method: "DELETE" });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: [config.endpoint] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't delete");
    }
  };

  const duplicate = async (doc: Doc) => {
    try {
      const copy = await api<Doc>(`${config.endpoint}/${doc._id}/duplicate`, { method: "POST" });
      toast.success("Copy created");
      router.push(`/admin/${config.key}/${copy._id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't duplicate");
    }
  };

  const items = list.data?.items ?? [];
  const canWrite = can(...config.perms);
  const dragging = Boolean(config.sortable && !filtered && canWrite);
  const cols = `${dragging ? "2.25rem " : ""}${config.columns.map((c) => c.className ?? "minmax(0,1fr)").join(" ")} 2.75rem`;

  const row = (doc: Doc, handle?: Parameters<typeof DragHandle>[0]["handle"]) => (
    <div
      role="row"
      className="grid cursor-pointer items-center gap-3 px-4 py-2.5 text-[0.875rem] transition-colors hover:bg-canvas"
      style={{ gridTemplateColumns: cols }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button,a")) return;
        router.push(`/admin/${config.key}/${doc._id}`);
      }}
    >
      {handle && <DragHandle handle={handle} />}
      {config.columns.map((c) => (
        <div key={c.label} className="min-w-0">
          {c.render(doc)}
        </div>
      ))}
      <Menu
        trigger={
          <button type="button" aria-label="More actions" className="grid size-8 place-items-center rounded-full hover:bg-sand">
            <DotsThreeIcon weight="bold" className="size-5" />
          </button>
        }
        items={[
          config.duplicable && canWrite && { label: "Duplicate", icon: <CopyIcon className="size-4" />, onSelect: () => duplicate(doc) },
          canWrite && { label: "Delete", icon: <TrashIcon className="size-4" />, danger: true, onSelect: () => remove(doc) },
        ]}
      />
    </div>
  );

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          canWrite && (
            <ButtonLink href={`/admin/${config.key}/new`} icon={<PlusIcon className="size-4" />}>
              Add {config.singular.toLowerCase()}
            </ButtonLink>
          )
        }
      />
      <Card padded={false}>
        {(config.searchable || config.filters?.length) && (
          <div className="flex flex-wrap gap-2 border-b border-line p-3">
            {config.searchable && (
              <div className="relative min-w-52 flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  placeholder={`Search ${config.title.toLowerCase()}`}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            )}
            {config.filters?.map((f) => (
              <Select
                key={f.name}
                value={filters[f.name] ?? ""}
                onChange={(e) => {
                  setFilters((cur) => ({ ...cur, [f.name]: e.target.value }));
                  setPage(1);
                }}
                className="w-44"
                aria-label={f.label}
              >
                <option value="">{f.label}: all</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            ))}
          </div>
        )}

        <div className="grid gap-3 border-b border-line px-4 py-2.5 text-[0.75rem] font-semibold tracking-[0.04em] text-ink-soft uppercase" style={{ gridTemplateColumns: cols }}>
          {dragging && <span />}
          {config.columns.map((c) => (
            <span key={c.label} className="truncate">
              {c.label}
            </span>
          ))}
          <span />
        </div>

        {list.isLoading ? (
          <Loading />
        ) : !items.length ? (
          <Empty title={filtered ? "Nothing matches" : `No ${config.title.toLowerCase()} yet`}>{filtered ? "Try a different search or filter." : undefined}</Empty>
        ) : dragging ? (
          <Sortable
            items={items}
            getId={(d) => d._id}
            onReorder={(next) => {
              qc.setQueryData([config.endpoint, "list", q, filters, page], { ...list.data, items: next });
              reorder.mutate(next.map((d) => d._id));
            }}
            className="divide-y divide-line"
            render={(doc, _i, handle) => row(doc, handle)}
          />
        ) : (
          <div className={cn("divide-y divide-line")}>
            {items.map((doc) => (
              <div key={doc._id}>{row(doc)}</div>
            ))}
          </div>
        )}
        {list.data && !dragging && <Pagination page={page} limit={limit} total={list.data.total} onChange={setPage} />}
      </Card>
      {dragging && items.length > 1 && <p className="mt-3 text-[0.8125rem] text-ink-soft">Drag rows to change the order they appear in on the website.</p>}
    </>
  );
}
