"use client";

import { DownloadSimpleIcon, EnvelopeSimpleIcon, MagnifyingGlassIcon, PhoneIcon, TrashIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { NoAccess } from "@admin/components/NoAccess";
import { Button, buttonClass } from "@admin/components/ui/button";
import { Badge, Card, Empty, Loading } from "@admin/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@admin/components/ui/form";
import { PageHeader, Pagination, Tabs } from "@admin/components/ui/layout";
import { Drawer, useConfirm } from "@admin/components/ui/overlay";
import { API_BASE, ApiError, api, withQuery, type ListResponse } from "@admin/lib/api";
import { useCan } from "@admin/lib/session";
import { ago, dateTime } from "@admin/lib/utils";

export type Lead = Record<string, unknown> & {
  _id: string;
  status: string;
  createdAt: string;
  name?: string;
  phone?: string;
  notes?: { _id: string; text: string; byName?: string; at: string }[];
  attribution?: { source?: string; label?: string; campaign?: string; medium?: string };
};

export type LeadsConfig = {
  endpoint: string;
  title: string;
  description: string;
  statuses: { value: string; label: string; tone: "gold" | "info" | "success" | "neutral" | "warn" }[];
  columns: { label: string; render: (l: Lead) => ReactNode; className?: string }[];
  details: (l: Lead) => [string, ReactNode][];
  whatsappText?: (l: Lead) => string;
};

const digits = (s?: string) => (s ?? "").replace(/\D/g, "");
const waNumber = (s?: string) => {
  const d = digits(s);
  return d.length === 10 ? `91${d}` : d;
};

export function LeadsInbox({ config }: { config: LeadsConfig }) {
  const can = useCan();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const filters = { status, q, from, to };

  const list = useQuery({
    queryKey: [config.endpoint, filters, page],
    queryFn: () => api<ListResponse<Lead>>(config.endpoint, { query: { ...filters, page, limit: 50 } }),
    enabled: can("leads"),
    refetchInterval: 60_000,
  });
  const current = list.data?.items.find((l) => l._id === openId) ?? null;

  if (!can("leads")) return <NoAccess />;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [config.endpoint] });
    qc.invalidateQueries({ queryKey: ["nav-counts"] });
  };

  const setLeadStatus = async (l: Lead, s: string) => {
    try {
      await api(`${config.endpoint}/${l._id}`, { method: "PATCH", json: { status: s } });
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't update");
    }
  };

  const addNote = async () => {
    if (!current || !note.trim()) return;
    await api(`${config.endpoint}/${current._id}/notes`, { method: "POST", json: { text: note } });
    setNote("");
    refresh();
  };

  const remove = async () => {
    if (!current || !(await confirm({ title: "Delete this lead?", body: "Use this for spam or test entries.", confirmLabel: "Delete", danger: true }))) return;
    await api(`${config.endpoint}/${current._id}`, { method: "DELETE" });
    setOpenId(null);
    refresh();
  };

  const counts = list.data?.counts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const statusOf = (s: string) => config.statuses.find((x) => x.value === s);

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <a href={`${API_BASE}/api${withQuery(`${config.endpoint}/export.csv`, filters)}`} className={buttonClass("secondary")}>
            <DownloadSimpleIcon className="size-4" /> Export CSV
          </a>
        }
      />
      <Tabs
        value={status || "all"}
        onChange={(v) => {
          setStatus(v === "all" ? "" : v);
          setPage(1);
        }}
        tabs={[{ value: "all", label: "All", count: total }, ...config.statuses.map((s) => ({ value: s.value, label: s.label, count: counts[s.value] }))]}
        className="mb-4"
      />
      <Card padded={false}>
        <div className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          <div className="relative min-w-52 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
            <Input placeholder="Search name, phone, villa…" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} className="pl-9" />
          </div>
          <Input type="date" value={from} onChange={(e) => (setFrom(e.target.value), setPage(1))} className="w-40" aria-label="Received from" />
          <Input type="date" value={to} onChange={(e) => (setTo(e.target.value), setPage(1))} className="w-40" aria-label="Received until" />
        </div>
        {list.isLoading ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty icon={EnvelopeSimpleIcon} title="Nothing here yet">
            New leads from the website appear here automatically.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-line text-[0.75rem] font-semibold tracking-[0.04em] text-ink-soft uppercase">
                  <th className="px-4 py-2.5">Received</th>
                  {config.columns.map((c) => (
                    <th key={c.label} className="px-4 py-2.5">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.data.items.map((l) => {
                  const s = statusOf(l.status);
                  return (
                    <tr key={l._id} onClick={() => setOpenId(l._id)} className="cursor-pointer transition-colors hover:bg-canvas">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          {l.status === "new" && <span className="size-2 rounded-full bg-gold" aria-label="New" />}
                          {ago(l.createdAt)}
                        </span>
                      </td>
                      {config.columns.map((c) => (
                        <td key={c.label} className="px-4 py-3">
                          {c.render(l)}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <Badge tone={s?.tone}>{s?.label ?? l.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={page} limit={50} total={list.data.total} onChange={setPage} />}
      </Card>

      <Drawer
        open={Boolean(current)}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={current?.name || current?.villaName ? String(current?.name || current?.villaName) : "Enquiry"}
        footer={
          current && (
            <Button variant="danger" size="sm" icon={<TrashIcon className="size-4" />} onClick={remove} className="ml-auto">
              Delete
            </Button>
          )
        }
      >
        {current && (
          <div className="space-y-6">
            <Field label="Status">
              <Select value={current.status} onChange={(e) => setLeadStatus(current, e.target.value)}>
                {config.statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>

            {current.phone && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${waNumber(current.phone)}${config.whatsappText ? `?text=${encodeURIComponent(config.whatsappText(current))}` : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("primary", "sm")}
                  onClick={() => current.status === "new" && setLeadStatus(current, "contacted")}
                >
                  <WhatsappLogoIcon className="size-4" /> WhatsApp
                </a>
                <a href={`tel:${current.phone}`} className={buttonClass("secondary", "sm")}>
                  <PhoneIcon className="size-4" /> Call
                </a>
              </div>
            )}

            <dl className="divide-y divide-line rounded-[10px] border border-line text-[0.875rem]">
              {[["Received", dateTime(current.createdAt)] as [string, ReactNode], ...config.details(current)]
                .filter(([, v]) => v !== undefined && v !== null && v !== "")
                .map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-2.5">
                    <dt className="text-ink-soft">{k}</dt>
                    <dd className="font-medium break-words">{v}</dd>
                  </div>
                ))}
            </dl>

            <div>
              <h3 className="text-[0.875rem] font-semibold">Notes</h3>
              <ul className="mt-2 space-y-2">
                {(current.notes ?? []).map((n) => (
                  <li key={n._id} className="rounded-[8px] bg-sand px-3 py-2 text-[0.875rem]">
                    <p className="whitespace-pre-line">{n.text}</p>
                    <p className="mt-1 text-[0.75rem] text-ink-soft">
                      {n.byName} · {ago(n.at)}
                    </p>
                  </li>
                ))}
              </ul>
              <Textarea className="mt-2" rows={2} placeholder="Add a note (quote sent, call back on Friday…)" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button size="sm" variant="secondary" className="mt-2" onClick={addNote} disabled={!note.trim()}>
                Add note
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
