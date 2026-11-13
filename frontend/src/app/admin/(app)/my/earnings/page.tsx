"use client";

import { WalletIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { Badge, Card, Empty, Loading } from "@admin/components/ui/feedback";
import { PageHeader, Table, tdClass } from "@admin/components/ui/layout";
import { Drawer } from "@admin/components/ui/overlay";
import { api } from "@admin/lib/api";
import { formatINR, shortDate, stayDay } from "@admin/lib/utils";
import { OwnerOnly } from "../OwnerOnly";

type Payout = { _id: string; period: string; gross: number; commission: number; amount: number; status: "pending" | "paid"; paidAt?: string; method?: string; reference?: string; bookings: unknown[] };
type Line = { _id: string; ref: string; villaName: string; checkIn: string; checkOut: string; guest: { name: string }; earnings: { gross: number; commission: number; share: number } };

export default function EarningsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["owner-payouts"], queryFn: () => api<{ items: Payout[] }>("/owner/payouts") });
  const dash = useQuery({ queryKey: ["owner-dashboard"], queryFn: () => api<{ owed: number; paidToDate: number }>("/owner/dashboard") });
  const [open, setOpen] = useState<string | null>(null);
  const detail = useQuery({ queryKey: ["owner-payout", open], queryFn: () => api<Omit<Payout, "bookings"> & { bookings: Line[] }>(`/owner/payouts/${open}`), enabled: Boolean(open) });

  return (
    <OwnerOnly>
      <PageHeader
        title="Earnings & payouts"
        description={dash.data ? `${formatINR(dash.data.owed)} owed to you for confirmed stays · ${formatINR(dash.data.paidToDate)} paid so far` : "Your share of every stay, grouped into monthly payouts."}
      />
      <Card padded={false}>
        {isLoading ? (
          <Loading />
        ) : !data?.items.length ? (
          <Empty icon={WalletIcon} title="No payouts yet">
            Payouts appear here once the team groups your stays by month.
          </Empty>
        ) : (
          <Table head={["Month", "Stays", "Gross", "Commission", "You get", "Status"]}>
            {data.items.map((p) => (
              <tr key={p._id} onClick={() => setOpen(p._id)} className="cursor-pointer hover:bg-canvas">
                <td className={`${tdClass} font-semibold`}>{format(new Date(p.period), "MMMM yyyy")}</td>
                <td className={tdClass}>{p.bookings.length}</td>
                <td className={`${tdClass} tabular-nums`}>{formatINR(p.gross)}</td>
                <td className={`${tdClass} tabular-nums text-ink-soft`}>{formatINR(p.commission)}</td>
                <td className={`${tdClass} font-semibold tabular-nums`}>{formatINR(p.amount)}</td>
                <td className={tdClass}>{p.status === "paid" ? <Badge tone="success">Paid {shortDate(p.paidAt)}</Badge> : <Badge tone="warn">Being processed</Badge>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <Drawer open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)} title={detail.data ? format(new Date(detail.data.period), "MMMM yyyy") : "Payout"}>
        {!detail.data ? (
          <Loading />
        ) : (
          <div className="space-y-4 text-[0.875rem]">
            {detail.data.status === "paid" && (
              <p>
                Paid on {shortDate(detail.data.paidAt)}
                {detail.data.reference ? `, reference ${detail.data.reference}` : ""}.
              </p>
            )}
            <ul className="divide-y divide-line rounded-[10px] border border-line">
              {detail.data.bookings.map((b) => (
                <li key={b._id} className="flex justify-between gap-3 px-4 py-2.5">
                  <span>
                    {b.villaName} · {b.guest.name}
                    <span className="block text-[0.75rem] text-ink-soft">
                      {stayDay(b.checkIn, "d MMM")} – {stayDay(b.checkOut, "d MMM")} · gross {formatINR(b.earnings.gross)}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatINR(b.earnings.share)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatINR(detail.data.amount)}</span>
            </p>
          </div>
        )}
      </Drawer>
    </OwnerOnly>
  );
}
