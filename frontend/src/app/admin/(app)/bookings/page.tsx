"use client";

import { DownloadSimpleIcon, MagnifyingGlassIcon, PlusIcon, TicketIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { NoAccess } from "@admin/components/NoAccess";
import { ButtonLink, buttonClass } from "@admin/components/ui/button";
import { Badge, Card, Empty, Loading } from "@admin/components/ui/feedback";
import { Input, Select } from "@admin/components/ui/form";
import { PageHeader, Pagination, Tabs } from "@admin/components/ui/layout";
import { api, withQuery, type ListResponse } from "@admin/lib/api";
import { PAYMENT_STATUS, STATUS, type Booking } from "@admin/lib/bookings";
import { useCan } from "@admin/lib/session";
import { formatINR, isoDay, stayDay } from "@admin/lib/utils";

const VIEWS: { value: string; label: string; query: Record<string, string> }[] = [
  { value: "action", label: "Needs action", query: { needsAction: "1" } },
  { value: "upcoming", label: "Upcoming stays", query: { status: "confirmed", sort: "checkIn" } },
  { value: "pending", label: "Awaiting payment", query: { status: "awaiting-payment,hold" } },
  { value: "past", label: "Completed", query: { status: "completed", sort: "-checkIn" } },
  { value: "closed", label: "Cancelled & lapsed", query: { status: "cancelled,declined,expired" } },
  { value: "all", label: "All", query: {} },
];

export default function BookingsPage() {
  const can = useCan();
  const router = useRouter();
  const [view, setView] = useState("action");
  const [q, setQ] = useState("");
  const [villa, setVilla] = useState("");
  const [page, setPage] = useState(1);
  const today = useMemo(() => isoDay(new Date()), []);
  const v = VIEWS.find((x) => x.value === view)!;
  const query = { ...v.query, ...(view === "upcoming" ? { from: today } : {}), q, villa, page, limit: 50 };

  const list = useQuery({ queryKey: ["bookings", query], queryFn: () => api<ListResponse<Booking> & { needsAction: number }>("/admin/bookings", { query }), enabled: can("bookings"), refetchInterval: 60_000 });
  const villas = useQuery({ queryKey: ["ref", "/admin/villas"], queryFn: () => api<ListResponse<{ _id: string; name: string }>>("/admin/villas", { query: { limit: 200 } }), enabled: can("bookings") });

  if (!can("bookings")) return <NoAccess />;
  const counts = list.data?.counts ?? {};

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Online bookings, requests to approve, and bookings added by the team."
        actions={
          <>
            <a href={`/api${withQuery("/admin/bookings/export.csv", { ...v.query, q, villa })}`} className={buttonClass("secondary")}>
              <DownloadSimpleIcon className="size-4" /> Export
            </a>
            <ButtonLink href="/admin/bookings/new" icon={<PlusIcon className="size-4" />}>
              Add booking
            </ButtonLink>
          </>
        }
      />
      <Tabs
        value={view}
        onChange={(x) => (setView(x), setPage(1))}
        className="mb-4"
        tabs={VIEWS.map((x) => ({
          value: x.value,
          label: x.label,
          count: x.value === "action" ? list.data?.needsAction : x.value === "pending" ? (counts["awaiting-payment"] ?? 0) + (counts.hold ?? 0) : undefined,
        }))}
      />
      <Card padded={false}>
        <div className="flex flex-wrap gap-2 border-b border-line p-3">
          <div className="relative min-w-52 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
            <Input placeholder="Reference, guest name, phone or email" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} className="pl-9" />
          </div>
          <Select value={villa} onChange={(e) => (setVilla(e.target.value), setPage(1))} className="w-52" aria-label="Villa">
            <option value="">All villas</option>
            {villas.data?.items.map((x) => (
              <option key={x._id} value={x._id}>
                {x.name}
              </option>
            ))}
          </Select>
        </div>
        {list.isLoading ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty icon={TicketIcon} title={view === "action" ? "Nothing needs your attention" : "No bookings here"}>
            {view === "action" ? "New requests and cancellation requests show up here." : undefined}
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-line text-[0.75rem] font-semibold tracking-[0.04em] text-ink-soft uppercase">
                  {["Booking", "Guest", "Villa", "Stay", "Total", "Paid", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.data.items.map((b) => (
                  <tr key={b._id} onClick={() => router.push(`/admin/bookings/${b._id}`)} className="cursor-pointer transition-colors hover:bg-canvas">
                    <td className="px-4 py-3">
                      <span className="font-semibold tracking-wide">{b.ref}</span>
                      <span className="block text-[0.75rem] text-ink-soft">{b.source === "admin" ? "Added by team" : b.mode === "request" ? "Request" : "Online"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{b.guest.name}</span>
                      <span className="block text-[0.75rem] text-ink-soft">{b.guest.phone}</span>
                    </td>
                    <td className="px-4 py-3">{b.villaName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {stayDay(b.checkIn, "d MMM")} – {stayDay(b.checkOut, "d MMM yyyy")}
                      <span className="block text-[0.75rem] text-ink-soft">
                        {b.nights} night{b.nights === 1 ? "" : "s"} · {b.guests} guests
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatINR(b.pricing.total)}</td>
                    <td className="px-4 py-3">
                      <span className="tabular-nums">{formatINR(b.amountPaid)}</span>
                      <span className="block">
                        <Badge tone={PAYMENT_STATUS[b.paymentStatus]?.tone}>{PAYMENT_STATUS[b.paymentStatus]?.label}</Badge>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Badge>
                      {b.cancellation?.status === "requested" && (
                        <span className="mt-1 block">
                          <Badge tone="error">Wants to cancel</Badge>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={page} limit={50} total={list.data.total} onChange={setPage} />}
      </Card>
    </>
  );
}
