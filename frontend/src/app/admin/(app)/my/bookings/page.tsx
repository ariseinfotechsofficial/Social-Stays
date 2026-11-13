"use client";

import { TicketIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge, Card, Empty, Loading } from "@admin/components/ui/feedback";
import { PageHeader, Table, Tabs, tdClass } from "@admin/components/ui/layout";
import { api } from "@admin/lib/api";
import { STATUS, type BookingStatus } from "@admin/lib/bookings";
import { formatINR, stayDay } from "@admin/lib/utils";
import { OwnerOnly } from "../OwnerOnly";

type OwnerBooking = {
  _id: string;
  ref: string;
  status: BookingStatus;
  villaName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  occasion?: string;
  guest: { name: string; city?: string; phone?: string; note?: string };
  addOns: { title: string; qty: number }[];
  earnings: { gross: number; commission: number; share: number; percent: number };
  paidOut: boolean;
};

export default function OwnerBookingsPage() {
  const [when, setWhen] = useState("upcoming");
  const { data, isLoading } = useQuery({ queryKey: ["owner-bookings", when], queryFn: () => api<{ items: OwnerBooking[] }>("/owner/bookings", { query: { when } }) });
  return (
    <OwnerOnly>
      <PageHeader title="Bookings" description="Every stay at your villas. Guest phone numbers show once a booking is confirmed." />
      <Tabs
        value={when}
        onChange={setWhen}
        className="mb-4"
        tabs={[
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past" },
        ]}
      />
      <Card padded={false}>
        {isLoading ? (
          <Loading />
        ) : !data?.items.length ? (
          <Empty icon={TicketIcon} title="No bookings here yet" />
        ) : (
          <Table head={["Stay", "Guests", "Add-ons", "Your share", "Status"]}>
            {data.items.map((b) => (
              <tr key={b._id}>
                <td className={tdClass}>
                  <span className="font-semibold">
                    {stayDay(b.checkIn, "EEE d MMM")} – {stayDay(b.checkOut, "d MMM yyyy")}
                  </span>
                  <span className="block text-[0.8125rem] text-ink-soft">
                    {b.villaName} · {b.nights} night{b.nights === 1 ? "" : "s"} · {b.ref}
                  </span>
                </td>
                <td className={tdClass}>
                  {b.guest.name}
                  {b.guest.phone && <span className="block text-[0.8125rem] text-ink-soft">{b.guest.phone}</span>}
                  <span className="block text-[0.8125rem] text-ink-soft">
                    {b.guests} guests{b.occasion ? ` · ${b.occasion}` : ""}
                  </span>
                </td>
                <td className={`${tdClass} text-ink-soft`}>{b.addOns.map((a) => `${a.title}${a.qty > 1 ? ` ×${a.qty}` : ""}`).join(", ") || "—"}</td>
                <td className={tdClass}>
                  <span className="font-semibold tabular-nums">{formatINR(b.earnings.share)}</span>
                  <span className="block text-[0.75rem] text-ink-soft">after {b.earnings.percent}% commission</span>
                </td>
                <td className={tdClass}>
                  <Badge tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Badge>
                  {b.paidOut && (
                    <span className="mt-1 block">
                      <Badge tone="success">Paid out</Badge>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </OwnerOnly>
  );
}
