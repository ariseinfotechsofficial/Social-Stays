"use client";

import { CaretLeftIcon, CaretRightIcon, LockIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, isToday, isWeekend, parseISO, startOfMonth } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@admin/components/ui/button";
import { Card, Loading } from "@admin/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@admin/components/ui/form";
import { Dialog, useConfirm } from "@admin/components/ui/overlay";
import { ApiError, api } from "@admin/lib/api";
import { cn, isoDay } from "@admin/lib/utils";

type Entry = {
  villa: string;
  date: string;
  kind: "booking" | "block";
  held: boolean;
  booking: { id: string; ref: string; status: string; guest?: string; guests: number } | null;
  block: { id: string; reason: string; note: string; by?: string } | null;
};
type CalendarData = { from: string; to: string; villas: { _id: string; name: string; status: string }[]; entries: Entry[] };

const REASONS = [
  { value: "owner", label: "Owner's use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "offline-booking", label: "Booked elsewhere" },
  { value: "other", label: "Other" },
];

export function AvailabilityCalendar({
  endpoint,
  blocksEndpoint,
  bookingHref,
  ownerMode,
}: {
  endpoint: string;
  blocksEndpoint: string;
  /** Where clicking a booking goes; owners have no booking pages */
  bookingHref?: (id: string) => string;
  /** Owners can only add and lift their own "owner's use" blocks */
  ownerMode?: boolean;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const from = isoDay(month);
  const to = isoDay(addDays(endOfMonth(month), 1));
  const { data, isLoading } = useQuery({ queryKey: ["calendar", endpoint, from], queryFn: () => api<CalendarData>(endpoint, { query: { from, to } }) });
  const [block, setBlock] = useState<{ villa: string; from: string; to: string; reason: string; note: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => eachDayOfInterval({ start: month, end: endOfMonth(month) }), [month]);
  const byKey = useMemo(() => new Map((data?.entries ?? []).map((e) => [`${e.villa}|${e.date}`, e])), [data]);

  const saveBlock = async () => {
    if (!block) return;
    setBusy(true);
    try {
      await api(blocksEndpoint, { method: "POST", json: block });
      toast.success("Dates blocked");
      setBlock(null);
      qc.invalidateQueries({ queryKey: ["calendar"] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't block those dates");
    } finally {
      setBusy(false);
    }
  };

  const liftBlock = async (e: Entry) => {
    if (!e.block) return;
    if (ownerMode && e.block.reason !== "owner") return toast.info("This block was added by the Social Stays team. Message them to lift it.");
    const ok = await confirm({ title: "Lift this block?", body: `${REASONS.find((r) => r.value === e.block!.reason)?.label}${e.block.note ? `: ${e.block.note}` : ""}. The dates become bookable again.`, confirmLabel: "Lift block" });
    if (!ok) return;
    try {
      await api(`${blocksEndpoint}/${e.block.id}`, { method: "DELETE" });
      toast.success("Block lifted");
      qc.invalidateQueries({ queryKey: ["calendar"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't lift the block");
    }
  };

  const villas = data?.villas ?? [];

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth((m) => addMonths(m, -1))}>
            <CaretLeftIcon className="size-4" />
          </Button>
          <p className="w-40 text-center font-display text-[1.375rem] font-medium">{format(month, "MMMM yyyy")}</p>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <CaretRightIcon className="size-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
          Today
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-4 text-[0.75rem] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-gold" /> Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-warn-soft ring-1 ring-warn/40" /> Held / awaiting payment
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-ink-muted/60" /> Blocked
          </span>
          <Button
            size="sm"
            icon={<PlusIcon className="size-4" />}
            onClick={() => villas[0] && setBlock({ villa: villas[0]._id, from: isoDay(new Date()), to: isoDay(new Date()), reason: ownerMode ? "owner" : "maintenance", note: "" })}
            disabled={!villas.length}
          >
            Block dates
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0 text-[0.75rem]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-44 border-b border-line bg-white px-4 py-2 text-left font-semibold">Villa</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className={cn("min-w-8 border-b border-line px-0.5 py-1.5 text-center font-medium", isWeekend(d) && "bg-canvas", isToday(d) && "text-gold")}>
                    <span className="block text-[0.625rem] text-ink-muted">{format(d, "EEEEE")}</span>
                    {format(d, "d")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {villas.map((v) => (
                <tr key={v._id}>
                  <th className="sticky left-0 z-10 border-b border-line bg-white px-4 py-1.5 text-left text-[0.8125rem] font-semibold whitespace-nowrap">{v.name}</th>
                  {days.map((d) => {
                    const key = isoDay(d);
                    const e = byKey.get(`${v._id}|${key}`);
                    const prev = byKey.get(`${v._id}|${isoDay(addDays(d, -1))}`);
                    const sameAsPrev = e && prev && (e.booking?.id ?? e.block?.id) === (prev.booking?.id ?? prev.block?.id);
                    const title = e?.booking
                      ? `${e.booking.ref} · ${e.booking.guest ?? ""} · ${e.booking.guests} guests${e.held ? " (held)" : ""}`
                      : e?.block
                        ? `Blocked: ${REASONS.find((r) => r.value === e.block!.reason)?.label}${e.block.note ? ` – ${e.block.note}` : ""}`
                        : `${v.name}, ${format(d, "d MMM")}: free`;
                    return (
                      <td key={key} className={cn("h-10 border-b border-line p-0.5", isWeekend(d) && "bg-canvas")}>
                        <button
                          type="button"
                          title={title}
                          aria-label={title}
                          onClick={() => {
                            if (e?.booking) return bookingHref && router.push(bookingHref(e.booking.id));
                            if (e?.block) return void liftBlock(e);
                            setBlock({ villa: v._id, from: key, to: key, reason: ownerMode ? "owner" : "maintenance", note: "" });
                          }}
                          className={cn(
                            "flex h-full w-full items-center justify-center overflow-hidden rounded-[4px] text-[0.625rem] font-semibold transition-colors",
                            !e && "hover:bg-sand",
                            e?.booking && !e.held && "bg-gold text-white",
                            e?.booking && e.held && "bg-warn-soft text-warn ring-1 ring-warn/40 ring-inset",
                            e?.block && "bg-ink-muted/60 text-white",
                            sameAsPrev && "rounded-l-none",
                          )}
                        >
                          {e && !sameAsPrev && (e.block ? <LockIcon className="size-3" /> : e.booking?.guest?.split(" ")[0]?.slice(0, 4))}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={Boolean(block)}
        onOpenChange={(o) => !o && setBlock(null)}
        title="Block dates"
        description="Blocked nights can't be booked online. Bookings already on those dates stop the block."
        footer={
          <Button loading={busy} onClick={saveBlock}>
            Block dates
          </Button>
        }
      >
        {block && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Villa" className="sm:col-span-2">
              <Select value={block.villa} onChange={(e) => setBlock({ ...block, villa: e.target.value })}>
                {villas.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="First night">
              <Input type="date" value={block.from} onChange={(e) => setBlock({ ...block, from: e.target.value, to: block.to < e.target.value ? e.target.value : block.to })} />
            </Field>
            <Field label="Last night" help={block.to ? `Guests could check in again on ${format(addDays(parseISO(block.to), 1), "d MMM")}` : undefined}>
              <Input type="date" min={block.from} value={block.to} onChange={(e) => setBlock({ ...block, to: e.target.value })} />
            </Field>
            {!ownerMode && (
              <Field label="Reason" className="sm:col-span-2">
                <Select value={block.reason} onChange={(e) => setBlock({ ...block, reason: e.target.value })}>
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Note (optional)" className="sm:col-span-2">
              <Textarea rows={2} value={block.note} onChange={(e) => setBlock({ ...block, note: e.target.value })} />
            </Field>
          </div>
        )}
      </Dialog>
    </Card>
  );
}
