"use client";

import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { Switch as RSwitch } from "radix-ui";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@admin/lib/utils";

export const inputClass =
  "h-10 w-full rounded-[8px] border border-field bg-white px-3 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold focus:ring-2 focus:ring-gold/20 aria-[invalid=true]:border-error disabled:bg-sand disabled:text-ink-soft";

export function Field({
  label,
  htmlFor,
  help,
  error,
  children,
  className,
  aside,
}: {
  label?: ReactNode;
  htmlFor?: string;
  help?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  /** Right of the label, e.g. a character count */
  aside?: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {(label || aside) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={htmlFor} className="text-[0.8125rem] font-semibold text-ink">
              {label}
            </label>
          )}
          {aside && <span className="text-[0.75rem] text-ink-muted">{aside}</span>}
        </div>
      )}
      {children}
      {help && !error && <p className="mt-1.5 text-[0.75rem] leading-snug text-ink-soft">{help}</p>}
      {error && <p className="mt-1.5 text-[0.75rem] font-medium text-error">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(inputClass, "h-auto resize-y py-2 leading-relaxed", className)} {...props} />;
});

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(inputClass, "appearance-none pr-9")} {...props}>
        {children}
      </select>
      <CaretDownIcon aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-soft" />
    </div>
  );
}

export function Switch({ checked, onChange, label, id, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; id?: string; disabled?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <RSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="relative h-5.5 w-9.5 shrink-0 rounded-full bg-field transition-colors data-[state=checked]:bg-gold disabled:opacity-50"
      >
        <RSwitch.Thumb className="block size-4.5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[1.125rem]" />
      </RSwitch.Root>
      {label && (
        <label htmlFor={id} className="cursor-pointer text-[0.875rem]">
          {label}
        </label>
      )}
    </span>
  );
}

export function Checkbox({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; className?: string }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-[0.875rem]", className)}>
      <span className={cn("grid size-4.5 shrink-0 place-items-center rounded-[4px] border transition-colors", checked ? "border-gold bg-gold text-white" : "border-field bg-white")}>
        {checked && <CheckIcon weight="bold" className="size-3" />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** ₹ amount input that stores a number */
export function MoneyInput({ value, onChange, id, placeholder, invalid }: { value: number | undefined | null; onChange: (v: number) => void; id?: string; placeholder?: string; invalid?: boolean }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft">₹</span>
      <input
        id={id}
        inputMode="numeric"
        className={cn(inputClass, "pl-7 tabular-nums")}
        value={value === undefined || value === null || Number.isNaN(value) ? "" : String(value)}
        placeholder={placeholder}
        aria-invalid={invalid}
        onChange={(e) => onChange(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)}
      />
    </div>
  );
}
