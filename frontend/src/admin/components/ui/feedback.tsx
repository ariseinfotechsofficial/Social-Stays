import { WarningCircleIcon, type Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@admin/lib/utils";

type Tone = "neutral" | "gold" | "success" | "error" | "info" | "warn";

const tones: Record<Tone, string> = {
  neutral: "bg-sand text-ink-soft",
  gold: "bg-sand-deep text-gold-deep",
  success: "bg-success-soft text-success",
  error: "bg-error-soft text-error",
  info: "bg-info-soft text-info",
  warn: "bg-warn-soft text-warn",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block size-5 animate-spin rounded-full border-2 border-gold border-t-transparent", className)} aria-label="Loading" />;
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-ink-soft" role="status">
      <Spinner /> {label}
    </div>
  );
}

export function Card({ children, className, title, action, padded = true }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; padded?: boolean }) {
  return (
    <section className={cn("rounded-[12px] border border-line bg-white", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          {title && <h2 className="text-[0.9375rem] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

export function Empty({ icon: Icon, title, children, action }: { icon?: Icon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && <Icon weight="light" className="size-10 text-brass" />}
      <p className="mt-3 font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-[0.875rem] text-ink-soft">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "warn", children, className }: { tone?: "warn" | "error" | "info" | "success"; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-[10px] px-4 py-3 text-[0.875rem]", tones[tone], className)} role={tone === "error" ? "alert" : undefined}>
      <WarningCircleIcon className="mt-0.5 size-4.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "attention" }) {
  return (
    <div className={cn("rounded-[12px] border bg-white px-5 py-4", tone === "attention" ? "border-gold/50" : "border-line")}>
      <p className="text-[0.8125rem] font-medium text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-[2rem] leading-none font-medium tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-[0.75rem] text-ink-soft">{hint}</p>}
    </div>
  );
}
