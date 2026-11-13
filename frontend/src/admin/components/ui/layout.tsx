"use client";

import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Tabs as RTabs } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@admin/lib/utils";

export function PageHeader({ title, description, actions, back, meta }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string }; meta?: ReactNode }) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-soft hover:text-ink">
          <ArrowLeftIcon className="size-3.5" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="type-title">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-ink-soft">{description}</p>}
          {meta && <div className="mt-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Tabs({ value, onChange, tabs, className }: { value: string; onChange: (v: string) => void; tabs: { value: string; label: ReactNode; count?: number }[]; className?: string }) {
  return (
    <RTabs.Root value={value} onValueChange={onChange} className={className}>
      <RTabs.List className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <RTabs.Trigger
            key={t.value}
            value={t.value}
            className="-mb-px flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-[0.875rem] font-semibold whitespace-nowrap text-ink-soft transition-colors hover:text-ink data-[state=active]:border-gold data-[state=active]:text-ink"
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && <span className="rounded-full bg-sand-deep px-1.5 text-[0.6875rem] text-gold-deep tabular-nums">{t.count}</span>}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
    </RTabs.Root>
  );
}

/** Two-level form layout: a title column and the fields */
export function FormSection({ title, description, children, className }: { title: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-4 border-t border-line py-6 first:border-t-0 first:pt-0 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8", className)}>
      <div>
        <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
        {description && <p className="mt-1 text-[0.8125rem] leading-snug text-ink-soft">{description}</p>}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

export function Pagination({ page, limit, total, onChange }: { page: number; limit: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 text-[0.8125rem] text-ink-soft">
      <span>
        {(page - 1) * limit + 1}–{Math.min(total, page * limit)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="grid size-8 place-items-center rounded-full hover:bg-sand disabled:opacity-40" aria-label="Previous page">
          <CaretLeftIcon className="size-4" />
        </button>
        <span className="px-2 tabular-nums">
          {page} / {pages}
        </span>
        <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="grid size-8 place-items-center rounded-full hover:bg-sand disabled:opacity-40" aria-label="Next page">
          <CaretRightIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Simple data table: header + rows; rows can link or click */
export function Table({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[40rem] border-collapse text-left text-[0.875rem]">
        <thead>
          <tr className="border-b border-line text-[0.75rem] font-semibold tracking-[0.04em] text-ink-soft uppercase">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-2.5 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export const tdClass = "px-4 py-3 align-middle";
