"use client";

import { CaretLeftIcon, CaretRightIcon, LockIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, isToday, isWeekend, parseISO, startOfMonth } from "date-fns";
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
  kind: "block";
  block: { id: string; reason: string; note: string; by?: string } | null;
};
type CalendarData = { from: string; to: string; villas: { _id: string; name: string; status: string }[]; entries: Entry[] };

const REASONS = [
  { value: "owner", label: "Owner's use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "offline-booking", label: "Booked (confirmed on WhatsApp)" },
  { value: "other", label: "Other" },
];

/** The team's internal calendar: which nights each villa is blocked. The website doesn't show it. */
export function AvailabilityCalendar({ endpoint, blocksEndpoint }: { endpoint: string; blocksEndpoint: string }) {
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
    const ok = await confirm({ title: "Lift this block?", body: `${REASONS.find((r) => r.value === e.block!.reason)?.label}${e.block.note ? `: ${e.block.note}` : ""}. The nights show as free again.`, confirmLabel: "Lift block" });
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
            <span className="size-3 rounded-[3px] bg-ink-muted/60" /> Blocked
          </span>
          <Button
            size="sm"
            icon={<PlusIcon className="size-4" />}
            onClick={() => villas[0] && setBlock({ villa: villas[0]._id, from: isoDay(new Date()), to: isoDay(new Date()), reason: "offline-booking", note: "" })}
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
                    const sameAsPrev = e?.block && prev?.block && e.block.id === prev.block.id;
                    const title = e?.block
                      ? `Blocked: ${REASONS.find((r) => r.value === e.block!.reason)?.label}${e.block.note ? ` – ${e.block.note}` : ""}`
                      : `${v.name}, ${format(d, "d MMM")}: free`;
                    return (
                      <td key={key} className={cn("h-10 border-b border-line p-0.5", isWeekend(d) && "bg-canvas")}>
                        <button
                          type="button"
                          title={title}
                          aria-label={title}
                          onClick={() => {
                            if (e?.block) return void liftBlock(e);
                            setBlock({ villa: v._id, from: key, to: key, reason: "offline-booking", note: "" });
                          }}
                          className={cn(
                            "flex h-full w-full items-center justify-center overflow-hidden rounded-[4px] text-[0.625rem] font-semibold transition-colors",
                            !e && "hover:bg-sand",
                            e?.block && "bg-ink-muted/60 text-white",
                            sameAsPrev && "rounded-l-none",
                          )}
                        >
                          {e?.block && !sameAsPrev && <LockIcon className="size-3" />}
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
        description="For your team's reference, e.g. a stay confirmed on WhatsApp or maintenance. The website doesn't show blocked dates."
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
            <Field label="Last night" help={block.to ? `Free again from ${format(addDays(parseISO(block.to), 1), "d MMM")}` : undefined}>
              <Input type="date" min={block.from} value={block.to} onChange={(e) => setBlock({ ...block, to: e.target.value })} />
            </Field>
            <Field label="Reason" className="sm:col-span-2">
              <Select value={block.reason} onChange={(e) => setBlock({ ...block, reason: e.target.value })}>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Note (optional)" className="sm:col-span-2">
              <Textarea rows={2} value={block.note} onChange={(e) => setBlock({ ...block, note: e.target.value })} />
            </Field>
          </div>
        )}
      </Dialog>
    </Card>
  );
}
