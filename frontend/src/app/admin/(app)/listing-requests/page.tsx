"use client";

import { NotePencilIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { NoAccess } from "@admin/components/NoAccess";
import { Button } from "@admin/components/ui/button";
import { Badge, Card, Empty, Loading } from "@admin/components/ui/feedback";
import { Checkbox, Field, Textarea } from "@admin/components/ui/form";
import { PageHeader, Table, Tabs, tdClass } from "@admin/components/ui/layout";
import { Drawer } from "@admin/components/ui/overlay";
import { ApiError, api, mediaUrl } from "@admin/lib/api";
import { useCan } from "@admin/lib/session";
import { ago, formatINR } from "@admin/lib/utils";

type Req = { _id: string; villa: { _id: string; name: string } | string; ownerName: string; changes: Record<string, unknown>; message: string; status: "pending" | "approved" | "rejected"; reviewNote?: string; reviewedByName?: string; createdAt: string };

const LABELS: Record<string, string> = {
  tagline: "Tagline",
  summary: "Summary",
  description: "Description",
  highlights: "Highlights",
  rooms: "Rooms",
  meals: "Meals",
  houseRules: "House rules",
  checkIn: "Check-in",
  checkOut: "Check-out",
  priceFrom: "Weekday price",
  weekendPrice: "Weekend price",
  photos: "Photos",
  host: "Host",
};

function Value({ field, v }: { field: string; v: unknown }): ReactNode {
  if (v === undefined || v === null || v === "") return <span className="text-ink-muted">Empty</span>;
  if (field === "priceFrom" || field === "weekendPrice") return formatINR(v as number);
  if (field === "photos")
    return (
      <div className="flex flex-wrap gap-1.5">
        {(v as { src: string }[]).map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={mediaUrl(p.src)} alt="" className="size-14 rounded-[6px] object-cover" />
        ))}
      </div>
    );
  if (field === "rooms") return <ul className="list-disc pl-4">{(v as { name: string; beds: string }[]).map((r, i) => <li key={i}>{`${r.name}: ${r.beds}`}</li>)}</ul>;
  if (field === "host") return `${(v as { name?: string }).name ?? ""}. ${(v as { note?: string }).note ?? ""}`;
  if (Array.isArray(v)) return <ul className="list-disc space-y-1 pl-4">{v.map((x, i) => <li key={i}>{String(x)}</li>)}</ul>;
  return <span className="whitespace-pre-line">{String(v)}</span>;
}

export default function ListingRequestsPage() {
  const can = useCan();
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [fields, setFields] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useQuery({ queryKey: ["listing-requests", status], queryFn: () => api<{ items: Req[]; pending: number }>("/admin/listing-requests", { query: { status } }), enabled: can("owners", "catalog") });
  const detail = useQuery({
    queryKey: ["listing-request", openId],
    queryFn: () => api<Req & { current: Record<string, unknown> }>(`/admin/listing-requests/${openId}`),
    enabled: Boolean(openId),
  });

  if (!can("owners", "catalog")) return <NoAccess />;

  const open = (r: Req) => {
    setOpenId(r._id);
    setFields(new Set(Object.keys(r.changes)));
    setNote("");
  };

  const decide = async (kind: "approve" | "reject") => {
    if (!openId) return;
    setBusy(true);
    try {
      await api(`/admin/listing-requests/${openId}/${kind}`, { method: "POST", json: kind === "approve" ? { fields: [...fields], note } : { note } });
      toast.success(kind === "approve" ? "Changes applied to the villa. The website updates in a few seconds." : "Request declined");
      setOpenId(null);
      qc.invalidateQueries({ queryKey: ["listing-requests"] });
      qc.invalidateQueries({ queryKey: ["nav-counts"] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "That didn't work");
    } finally {
      setBusy(false);
    }
  };

  const d = detail.data;

  return (
    <>
      <PageHeader title="Listing requests" description="Changes owners have asked for on their villa pages. Nothing goes live until you approve it." />
      <Tabs
        value={status}
        onChange={setStatus}
        className="mb-4"
        tabs={[
          { value: "pending", label: "To review", count: list.data?.pending },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Declined" },
        ]}
      />
      <Card padded={false}>
        {list.isLoading ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty icon={NotePencilIcon} title="Nothing to review" />
        ) : (
          <Table head={["Villa", "Owner", "Changes", "Sent"]}>
            {list.data.items.map((r) => (
              <tr key={r._id} onClick={() => open(r)} className="cursor-pointer hover:bg-canvas">
                <td className={`${tdClass} font-semibold`}>{typeof r.villa === "object" ? r.villa.name : ""}</td>
                <td className={tdClass}>{r.ownerName}</td>
                <td className={`${tdClass} text-ink-soft`}>{Object.keys(r.changes).map((k) => LABELS[k] ?? k).join(", ") || "Message only"}</td>
                <td className={`${tdClass} text-ink-soft`}>{ago(r.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Drawer
        open={Boolean(openId)}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={d ? `${typeof d.villa === "object" ? d.villa.name : ""}: ${d.ownerName}` : "Request"}
        footer={
          d?.status === "pending" && (
            <>
              <Button loading={busy} onClick={() => decide("approve")} disabled={!fields.size && Object.keys(d.changes).length > 0}>
                Apply {fields.size ? `${fields.size} change${fields.size === 1 ? "" : "s"}` : ""}
              </Button>
              <Button variant="secondary" onClick={() => decide("reject")} disabled={busy}>
                Decline
              </Button>
            </>
          )
        }
      >
        {!d ? (
          <Loading />
        ) : (
          <div className="space-y-5 text-[0.875rem]">
            {d.status !== "pending" && (
              <Badge tone={d.status === "approved" ? "success" : "neutral"}>
                {d.status === "approved" ? "Approved" : "Declined"} by {d.reviewedByName}
                {d.reviewNote ? `: ${d.reviewNote}` : ""}
              </Badge>
            )}
            {d.message && <p className="rounded-[8px] bg-sand px-3 py-2">“{d.message}”</p>}
            {Object.entries(d.changes).map(([k, v]) => (
              <div key={k} className="rounded-[10px] border border-line">
                <div className="flex items-center justify-between border-b border-line px-4 py-2">
                  <span className="font-semibold">{LABELS[k] ?? k}</span>
                  {d.status === "pending" && (
                    <Checkbox
                      checked={fields.has(k)}
                      onChange={(on) => setFields((cur) => new Set(on ? [...cur, k] : [...cur].filter((x) => x !== k)))}
                      label="Apply"
                    />
                  )}
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[0.75rem] font-semibold text-ink-soft uppercase">Now</p>
                    <Value field={k} v={d.current?.[k]} />
                  </div>
                  <div>
                    <p className="mb-1 text-[0.75rem] font-semibold text-gold-deep uppercase">Proposed</p>
                    <Value field={k} v={v} />
                  </div>
                </div>
              </div>
            ))}
            {d.status === "pending" && (
              <Field label="Note to the owner (optional)">
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
