"use client";

import { CheckIcon, TrashIcon, WalletIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { NoAccess } from "@admin/components/NoAccess";
import { Button } from "@admin/components/ui/button";
import { Alert, Badge, Card, Empty, Loading } from "@admin/components/ui/feedback";
import { Field, Input, Select } from "@admin/components/ui/form";
import { PageHeader, Table, tdClass } from "@admin/components/ui/layout";
import { Dialog, Drawer, useConfirm } from "@admin/components/ui/overlay";
import { ApiError, api } from "@admin/lib/api";
import { useCan } from "@admin/lib/session";
import { formatINR, shortDate, stayDay } from "@admin/lib/utils";

type Payout = { _id: string; owner: string; ownerName: string; period: string; gross: number; commission: number; amount: number; status: "pending" | "paid"; paidAt?: string; method?: string; reference?: string; note?: string; bookings: string[] };
type Owed = { owner: string; ownerName: string; amount: number; bookings: number };
type PreviewBooking = { _id: string; ref: string; villaName: string; checkIn: string; checkOut: string; nights: number; guest: { name: string }; commission: { base: number; amount: number; ownerShare: number } };

const monthLabel = (iso: string) => format(new Date(iso), "MMMM yyyy");

export default function PayoutsPage() {
  const can = useCan();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data, isLoading } = useQuery({ queryKey: ["payouts"], queryFn: () => api<{ items: Payout[]; owed: Owed[] }>("/admin/payouts"), enabled: can("payouts") });
  const [create, setCreate] = useState<{ owner: string; ownerName: string; month: string } | null>(null);
  const [paying, setPaying] = useState<{ payout: Payout; method: string; reference: string } | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = useQuery({
    queryKey: ["payout-preview", create?.owner, create?.month],
    queryFn: () => api<{ bookings: PreviewBooking[]; gross: number; commission: number; amount: number }>("/admin/payouts/preview", { query: { owner: create!.owner, month: create!.month } }),
    enabled: Boolean(create?.owner && create.month),
  });
  const detail = useQuery({ queryKey: ["payout", viewing], queryFn: () => api<Omit<Payout, "bookings"> & { bookings: PreviewBooking[] }>(`/admin/payouts/${viewing}`), enabled: Boolean(viewing) });

  if (!can("payouts")) return <NoAccess />;
  const refresh = () => qc.invalidateQueries({ queryKey: ["payouts"] });

  const doCreate = async () => {
    if (!create) return;
    setBusy(true);
    try {
      await api("/admin/payouts", { method: "POST", json: { owner: create.owner, month: create.month } });
      toast.success("Payout created");
      setCreate(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't create the payout");
    } finally {
      setBusy(false);
    }
  };

  const markPaid = async () => {
    if (!paying) return;
    setBusy(true);
    try {
      await api(`/admin/payouts/${paying.payout._id}`, { method: "PATCH", json: { status: "paid", method: paying.method, reference: paying.reference } });
      toast.success("Marked as paid. The owner sees it in their dashboard.");
      setPaying(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't update");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Payout) => {
    if (!(await confirm({ title: "Delete this pending payout?", body: "Its stays go back to 'owed'.", confirmLabel: "Delete", danger: true }))) return;
    await api(`/admin/payouts/${p._id}`, { method: "DELETE" });
    refresh();
  };

  const months = Array.from({ length: 12 }, (_, i) => format(subMonths(new Date(), i), "yyyy-MM"));

  return (
    <>
      <PageHeader title="Owner payouts" description="Owners earn their share of every confirmed stay (total before GST, less your commission). Group stays by month into a payout, pay it by bank or UPI, then mark it paid." />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <Card title="Owed to owners" padded={false}>
            {!data?.owed.length ? (
              <Empty icon={WalletIcon} title="Nothing owed right now">
                Confirmed stays at villas with an owner account show up here.
              </Empty>
            ) : (
              <Table head={["Owner", "Stays", "Owed", ""]}>
                {data.owed.map((o) => (
                  <tr key={o.owner}>
                    <td className={`${tdClass} font-semibold`}>{o.ownerName}</td>
                    <td className={tdClass}>{o.bookings}</td>
                    <td className={`${tdClass} tabular-nums`}>{formatINR(o.amount)}</td>
                    <td className={`${tdClass} text-right`}>
                      <Button size="sm" variant="secondary" onClick={() => setCreate({ owner: o.owner, ownerName: o.ownerName, month: months[1] })}>
                        Create payout
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title="Payouts" padded={false}>
            {!data?.items.length ? (
              <Empty title="No payouts yet" />
            ) : (
              <Table head={["Owner", "Month", "Stays", "Gross", "Commission", "Owner gets", "Status", ""]}>
                {data.items.map((p) => (
                  <tr key={p._id} className="cursor-pointer hover:bg-canvas" onClick={() => setViewing(p._id)}>
                    <td className={`${tdClass} font-semibold`}>{p.ownerName}</td>
                    <td className={tdClass}>{monthLabel(p.period)}</td>
                    <td className={tdClass}>{p.bookings.length}</td>
                    <td className={`${tdClass} tabular-nums`}>{formatINR(p.gross)}</td>
                    <td className={`${tdClass} tabular-nums text-ink-soft`}>{formatINR(p.commission)}</td>
                    <td className={`${tdClass} font-semibold tabular-nums`}>{formatINR(p.amount)}</td>
                    <td className={tdClass}>{p.status === "paid" ? <Badge tone="success">Paid {shortDate(p.paidAt)}</Badge> : <Badge tone="warn">To pay</Badge>}</td>
                    <td className={`${tdClass} text-right`} onClick={(e) => e.stopPropagation()}>
                      {p.status === "pending" && (
                        <span className="inline-flex gap-1">
                          <Button size="sm" icon={<CheckIcon className="size-4" />} onClick={() => setPaying({ payout: p, method: "bank", reference: "" })}>
                            Mark paid
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(p)}>
                            <TrashIcon className="size-4 text-error" />
                          </Button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      )}

      <Dialog
        open={Boolean(create)}
        onOpenChange={(o) => !o && setCreate(null)}
        title={`Payout for ${create?.ownerName ?? ""}`}
        size="lg"
        footer={
          <Button loading={busy} onClick={doCreate} disabled={!preview.data?.bookings.length}>
            Create payout of {formatINR(preview.data?.amount ?? 0)}
          </Button>
        }
      >
        {create && (
          <div className="space-y-4">
            <Field label="Stays that checked in during">
              <Select value={create.month} onChange={(e) => setCreate({ ...create, month: e.target.value })}>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {format(new Date(`${m}-01T00:00:00`), "MMMM yyyy")}
                  </option>
                ))}
              </Select>
            </Field>
            {preview.isLoading ? (
              <Loading />
            ) : preview.data?.bookings.length ? (
              <Table head={["Booking", "Stay", "Gross", "Commission", "Owner"]}>
                {preview.data.bookings.map((b) => (
                  <tr key={b._id}>
                    <td className={tdClass}>
                      <span className="font-semibold">{b.ref}</span>
                      <span className="block text-[0.75rem] text-ink-soft">{b.villaName}</span>
                    </td>
                    <td className={tdClass}>
                      {stayDay(b.checkIn, "d MMM")} – {stayDay(b.checkOut, "d MMM")}
                    </td>
                    <td className={`${tdClass} tabular-nums`}>{formatINR(b.commission.base)}</td>
                    <td className={`${tdClass} tabular-nums text-ink-soft`}>{formatINR(b.commission.amount)}</td>
                    <td className={`${tdClass} font-semibold tabular-nums`}>{formatINR(b.commission.ownerShare)}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Alert tone="info">No unpaid stays checked in that month.</Alert>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={Boolean(paying)}
        onOpenChange={(o) => !o && setPaying(null)}
        title={`Mark ${formatINR(paying?.payout.amount ?? 0)} as paid`}
        size="sm"
        footer={
          <Button loading={busy} onClick={markPaid}>
            Mark paid
          </Button>
        }
      >
        {paying && (
          <div className="space-y-4">
            <Field label="Paid by">
              <Select value={paying.method} onChange={(e) => setPaying({ ...paying, method: e.target.value })}>
                <option value="bank">Bank transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Reference (UTR)">
              <Input value={paying.reference} onChange={(e) => setPaying({ ...paying, reference: e.target.value })} />
            </Field>
          </div>
        )}
      </Dialog>

      <Drawer open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)} title={detail.data ? `${detail.data.ownerName} · ${monthLabel(detail.data.period)}` : "Payout"}>
        {detail.data ? (
          <div className="space-y-4 text-[0.875rem]">
            <p>
              {detail.data.status === "paid"
                ? `Paid ${shortDate(detail.data.paidAt)} by ${detail.data.method ?? "—"}${detail.data.reference ? ` (${detail.data.reference})` : ""}.`
                : "Not paid yet."}
            </p>
            <ul className="divide-y divide-line rounded-[10px] border border-line">
              {detail.data.bookings.map((b) => (
                <li key={b._id} className="flex justify-between gap-3 px-4 py-2.5">
                  <span>
                    <span className="font-semibold">{b.ref}</span> · {b.villaName}
                    <span className="block text-[0.75rem] text-ink-soft">
                      {stayDay(b.checkIn, "d MMM")} – {stayDay(b.checkOut, "d MMM")} · {b.guest?.name}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatINR(b.commission?.ownerShare)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <span>Owner gets</span>
              <span>{formatINR(detail.data.amount)}</span>
            </p>
          </div>
        ) : (
          <Loading />
        )}
      </Drawer>
    </>
  );
}
