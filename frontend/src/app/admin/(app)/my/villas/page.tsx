"use client";

import { ArrowSquareOutIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Fields } from "@admin/components/fields/Fields";
import type { FieldDef, FormValue } from "@admin/components/fields/types";
import { Button } from "@admin/components/ui/button";
import { Badge, Card, Empty, Loading } from "@admin/components/ui/feedback";
import { Field, Textarea } from "@admin/components/ui/form";
import { PageHeader } from "@admin/components/ui/layout";
import { Dialog } from "@admin/components/ui/overlay";
import { ApiError, api } from "@admin/lib/api";
import { SITE_URL, ago, formatINR } from "@admin/lib/utils";
import { OwnerOnly } from "../OwnerOnly";

type Villa = FormValue & { _id: string; name: string; slug: string; status: string; destination?: { name: string }; photos?: { src: string }[]; priceFrom: number; weekendPrice?: number };
type Req = { _id: string; villa: { name: string }; changes: Record<string, unknown>; message: string; status: string; reviewNote?: string; createdAt: string };

const EDITABLE = ["tagline", "summary", "description", "highlights", "rooms", "meals", "houseRules", "checkIn", "checkOut", "priceFrom", "weekendPrice", "photos", "host"];

const FIELDS: FieldDef[] = [
  { name: "tagline", label: "Tagline", type: "text" },
  { name: "summary", label: "Short summary", type: "textarea", rows: 2 },
  { name: "description", label: "Description", type: "strings", itemLabel: "paragraph", rows: 4 },
  { name: "highlights", label: "Highlights", type: "strings", itemLabel: "highlight" },
  { name: "photos", label: "Photos", type: "images", help: "Add new photos or reorder them. The team checks them before they go live." },
  {
    name: "rooms",
    label: "Rooms",
    type: "list",
    itemLabel: "Room",
    fields: [
      { name: "name", label: "Room", type: "text", width: "half" },
      { name: "beds", label: "Beds", type: "text", width: "half" },
      { name: "note", label: "Note", type: "text" },
    ],
  },
  { name: "meals", label: "Meals", type: "textarea", rows: 3 },
  { name: "houseRules", label: "House rules", type: "strings", itemLabel: "rule", rows: 2 },
  { name: "checkIn", label: "Check-in time", type: "text", width: "third" },
  { name: "checkOut", label: "Check-out time", type: "text", width: "third" },
  { name: "priceFrom", label: "Weekday price you'd like", type: "money", width: "third" },
  { name: "weekendPrice", label: "Weekend price you'd like", type: "money", width: "third" },
  { name: "host.name", label: "Host name", type: "text", width: "half" },
  { name: "host.note", label: "About the host", type: "textarea", rows: 2 },
];

export default function MyVillasPage() {
  const qc = useQueryClient();
  const villas = useQuery({ queryKey: ["owner-villas"], queryFn: () => api<{ items: Villa[] }>("/owner/villas") });
  const requests = useQuery({ queryKey: ["owner-requests"], queryFn: () => api<{ items: Req[] }>("/owner/listing-requests") });
  const [editing, setEditing] = useState<{ villa: Villa; value: FormValue; original: string } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const start = (v: Villa) => {
    const value = Object.fromEntries(EDITABLE.map((k) => [k, v[k]]));
    setEditing({ villa: v, value, original: JSON.stringify(value) });
    setMessage("");
  };

  const send = async () => {
    if (!editing) return;
    const original = JSON.parse(editing.original) as FormValue;
    const changes = Object.fromEntries(EDITABLE.filter((k) => JSON.stringify(editing.value[k]) !== JSON.stringify(original[k])).map((k) => [k, editing.value[k]]));
    if (!Object.keys(changes).length && !message.trim()) return toast.info("Change something or write a message first");
    setBusy(true);
    try {
      await api("/owner/listing-requests", { method: "POST", json: { villa: editing.villa._id, changes, message } });
      toast.success("Sent to the Social Stays team for review");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["owner-requests"] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OwnerOnly>
      <PageHeader title="My villas" description="Suggest changes to your villa pages: photos, rooms, rules or prices. The Social Stays team reviews every change before it goes live." />
      {villas.isLoading ? (
        <Loading />
      ) : !villas.data?.items.length ? (
        <Card>
          <Empty title="No villas linked to your account yet">Ask the Social Stays team to link your villa.</Empty>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {villas.data.items.map((v) => (
            <Card key={v._id} padded={false}>
              <div className="flex gap-4 p-4">
                {v.photos?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.photos[0].src} alt="" className="size-24 shrink-0 rounded-[10px] object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="type-heading">{v.name}</p>
                  <p className="text-[0.875rem] text-ink-soft">
                    {v.destination?.name} · from {formatINR(v.priceFrom)}
                    {v.weekendPrice ? `, weekends ${formatINR(v.weekendPrice)}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" icon={<NotePencilIcon className="size-4" />} onClick={() => start(v)}>
                      Suggest changes
                    </Button>
                    {v.status === "live" && (
                      <a href={`${SITE_URL}/villas/${v.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 px-2 text-[0.8125rem] font-semibold text-ink-soft hover:text-ink">
                        View page <ArrowSquareOutIcon className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card title="Your requests" className="mt-5" padded={false}>
        {!requests.data?.items.length ? (
          <p className="px-5 py-4 text-[0.875rem] text-ink-soft">No requests yet.</p>
        ) : (
          <ul className="divide-y divide-line text-[0.875rem]">
            {requests.data.items.map((r) => (
              <li key={r._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <span className="font-semibold">{r.villa?.name}</span>
                <span className="min-w-0 flex-1 text-ink-soft">{Object.keys(r.changes).join(", ") || "Message"}</span>
                <span className="text-ink-muted">{ago(r.createdAt)}</span>
                <Badge tone={r.status === "approved" ? "success" : r.status === "rejected" ? "neutral" : "warn"}>{r.status === "pending" ? "Waiting for review" : r.status === "approved" ? "Live" : "Not applied"}</Badge>
                {r.reviewNote && <p className="w-full text-[0.8125rem] text-ink-soft">Team note: {r.reviewNote}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`Suggest changes: ${editing?.villa.name ?? ""}`}
        description="Edit anything below. Only what you change is sent."
        size="lg"
        footer={
          <Button loading={busy} onClick={send}>
            Send for review
          </Button>
        }
      >
        {editing && (
          <div className="space-y-6">
            <Fields fields={FIELDS} value={editing.value} onChange={(value) => setEditing({ ...editing, value })} />
            <Field label="Message to the team (optional)">
              <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Anything else, e.g. a new room is ready from March" />
            </Field>
          </div>
        )}
      </Dialog>
    </OwnerOnly>
  );
}
