"use client";

import { CalendarBlankIcon, CaretDownIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { Popover } from "radix-ui";
import { useState, type ReactNode } from "react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

// The calendar (react-day-picker + its styles) only downloads when someone opens the dates field
const Calendar = dynamic(() => import("@/components/enquiry/Calendar").then((mod) => mod.Calendar), {
  ssr: false,
  loading: () => <div className="h-[19.5rem] w-[17.5rem] animate-pulse rounded-[4px] bg-sand" />,
});

/** Shared look for every enquiry field: small label over the value. */
export function FieldShell({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative flex min-w-0 flex-col justify-center gap-0.5", className)}>
      <label htmlFor={htmlFor} className="type-label text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder: string;
  className?: string;
}) {
  return (
    <FieldShell label={label} htmlFor={id} className={className}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none truncate bg-transparent py-0.5 pr-6 text-[0.98rem] font-medium outline-none",
            value ? "text-ink" : "text-ink-soft",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <CaretDownIcon aria-hidden className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-ink-soft" />
      </div>
    </FieldShell>
  );
}

export function DatesField({
  id,
  range,
  onChange,
  compact = false,
  className,
}: {
  id: string;
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  /** Shorter wording for half-width cells */
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const label = range?.from
    ? range.to
      ? `${format(range.from, "d MMM")} – ${format(range.to, "d MMM")}`
      : compact
        ? `${format(range.from, "d MMM")} – …`
        : `${format(range.from, "d MMM")} – add check-out`
    : "Add dates";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <FieldShell label="Dates" htmlFor={id} className={className}>
        <Popover.Trigger
          id={id}
          className={cn(
            "flex items-center justify-between gap-2 py-0.5 text-left text-[0.98rem] font-medium outline-none",
            range?.from ? "text-ink" : "text-ink-soft",
          )}
        >
          <span className="truncate">{label}</span>
          <CalendarBlankIcon aria-hidden className="size-4 shrink-0 text-ink-soft" />
        </Popover.Trigger>
      </FieldShell>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={14}
          collisionPadding={12}
          className="z-[80] max-w-[calc(100vw-1.5rem)] rounded-[6px] border border-line bg-white p-4 shadow-[0_24px_60px_-20px_rgb(42_36_27/0.35)] data-[state=open]:animate-[pop-in_220ms_var(--ease-out-expo)]"
          data-lenis-prevent
        >
          <Calendar
            range={range}
            onSelect={(next) => {
              onChange(next);
              if (next?.from && next?.to && next.from.getTime() !== next.to.getTime()) setOpen(false);
            }}
          />
          <div className="mt-3 flex items-center justify-between gap-4 border-t border-line pt-3 text-sm text-ink-soft">
            <span>Flexible? Leave the dates empty and tell us on WhatsApp.</span>
            {range?.from && (
              <button type="button" className="font-semibold text-gold-deep underline-offset-4 hover:underline" onClick={() => onChange(undefined)}>
                Clear
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Guest count as a native picker: on phones this opens the system wheel, which beats tiny +/− buttons. */
export function GuestsSelect({
  id,
  value,
  onChange,
  max = 30,
  className,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
}) {
  return (
    <SelectField
      id={id}
      label="Guests"
      value={value ? String(value) : ""}
      onChange={(v) => onChange(Number(v) || 0)}
      options={Array.from({ length: max }, (_, i) => ({ value: String(i + 1), label: `${i + 1} guest${i ? "s" : ""}` }))}
      placeholder="Add guests"
      className={className}
    />
  );
}

export function GuestsField({
  id,
  value,
  onChange,
  max = 30,
  className,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
}) {
  const step = (delta: number) => onChange(Math.min(max, Math.max(0, value + delta)));
  return (
    <FieldShell label="Guests" htmlFor={id} className={className}>
      <div className="flex items-center justify-between gap-3">
        <output id={id} aria-live="polite" className={cn("text-[0.98rem] font-medium", value ? "text-ink" : "text-ink-soft")}>
          {value ? `${value} guest${value === 1 ? "" : "s"}` : "Add guests"}
        </output>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={value === 0}
            aria-label="Fewer guests"
            className="grid size-8 place-items-center rounded-full border border-field text-ink transition-colors hover:border-ink disabled:opacity-35"
          >
            <MinusIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => step(value === 0 ? 2 : 1)}
            disabled={value >= max}
            aria-label="More guests"
            className="grid size-8 place-items-center rounded-full border border-field text-ink transition-colors hover:border-ink disabled:opacity-35"
          >
            <PlusIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </FieldShell>
  );
}
