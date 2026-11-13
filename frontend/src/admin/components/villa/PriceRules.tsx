"use client";

import { CalendarPlusIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Fields } from "@admin/components/fields/Fields";
import type { FormValue } from "@admin/components/fields/types";
import { Button } from "@admin/components/ui/button";
import { Badge, Card, Empty, Loading } from "@admin/components/ui/feedback";
import { Dialog, useConfirm } from "@admin/components/ui/overlay";
import { ApiError, api, fieldErrors, type ListResponse } from "@admin/lib/api";
import { formatINR, stayDay } from "@admin/lib/utils";
import type { Doc } from "@admin/resources/types";

type Rule = { _id: string; label: string; from: string; to: string; price: number; weekendPrice?: number; minNights?: number; active: boolean };

const blank: FormValue = { label: "", from: "", to: "", price: 0, weekendPrice: 0, minNights: 0, active: true };

/** Seasonal and special-date prices for one villa (Diwali, New Year, monsoon…) */
export function PriceRules({ villa }: { villa: Doc }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const key = ["/admin/price-rules", villa._id];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api<ListResponse<Rule>>("/admin/price-rules", { query: { villa: villa._id, limit: 200, sort: "from" } }) });
  const [editing, setEditing] = useState<{ id?: string; value: FormValue } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setErrors({});
    try {
      const body = { ...editing.value, villa: villa._id };
      await api(editing.id ? `/admin/price-rules/${editing.id}` : "/admin/price-rules", { method: editing.id ? "PATCH" : "POST", json: body });
      toast.success("Price saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: key });
    } catch (e) {
      setErrors(fieldErrors(e));
      toast.error(e instanceof ApiError ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: Rule) => {
    if (!(await confirm({ title: `Delete "${r.label}"?`, confirmLabel: "Delete", danger: true }))) return;
    await api(`/admin/price-rules/${r._id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: key });
  };

  const rules = data?.items ?? [];

  return (
    <Card
      title="Seasonal & special-date prices"
      action={
        <Button size="sm" icon={<CalendarPlusIcon className="size-4" />} onClick={() => setEditing({ value: { ...blank, price: villa.priceFrom, weekendPrice: villa.weekendPrice } })}>
          Add dates
        </Button>
      }
      padded={false}
    >
      <p className="border-b border-line px-5 py-3 text-[0.8125rem] text-ink-soft">
        These replace the villa&apos;s normal prices ({formatINR(villa.priceFrom as number)} weekdays
        {villa.weekendPrice ? `, ${formatINR(villa.weekendPrice as number)} weekends` : ""}) for the nights in range. When ranges overlap, the shorter one wins.
      </p>
      {isLoading ? (
        <Loading />
      ) : !rules.length ? (
        <Empty title="No seasonal prices yet">Add Diwali week, New Year or monsoon weekends with their own rates.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {rules.map((r) => (
            <li key={r._id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-[0.875rem]">
              <div className="min-w-48 flex-1">
                <p className="font-semibold">
                  {r.label} {!r.active && <Badge>Off</Badge>}
                </p>
                <p className="text-ink-soft">
                  {stayDay(r.from, "d MMM yyyy")} – {stayDay(r.to, "d MMM yyyy")}
                  {r.minNights ? ` · min ${r.minNights} nights` : ""}
                </p>
              </div>
              <p className="tabular-nums">
                {formatINR(r.price)}
                {r.weekendPrice ? <span className="text-ink-soft"> · weekends {formatINR(r.weekendPrice)}</span> : null}
              </p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing({ id: r._id, value: { ...r, from: r.from.slice(0, 10), to: r.to.slice(0, 10) } })}>
                  <PencilSimpleIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(r)}>
                  <TrashIcon className="size-4 text-error" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing?.id ? "Edit seasonal price" : "Add seasonal price"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <Fields
            value={editing.value}
            onChange={(value) => setEditing({ ...editing, value })}
            errors={errors}
            fields={[
              { name: "label", label: "Name", type: "text", help: "e.g. Diwali week, New Year" },
              { name: "from", label: "First night", type: "date", width: "half" },
              { name: "to", label: "Last night", type: "date", width: "half" },
              { name: "price", label: "Price per night", type: "money", width: "half" },
              { name: "weekendPrice", label: "Weekend nights (optional)", type: "money", width: "half" },
              { name: "minNights", label: "Minimum nights (optional)", type: "number", min: 0, width: "half" },
              { name: "active", label: "Active", type: "boolean", width: "half" },
            ]}
          />
        )}
      </Dialog>
    </Card>
  );
}
