"use client";

import { CaretDownIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { ImageField, ImagesField } from "@admin/components/fields/ImageFields";
import type { FieldDef, FormValue } from "@admin/components/fields/types";
import { DragHandle, Sortable } from "@admin/components/sortable";
import { Button } from "@admin/components/ui/button";
import { Checkbox, Field, Input, MoneyInput, Select, Switch, Textarea } from "@admin/components/ui/form";
import { Dialog } from "@admin/components/ui/overlay";
import { api, type ListResponse } from "@admin/lib/api";
import { AMENITY_ICONS } from "@admin/lib/icons";
import type { ImageValue } from "@admin/lib/media";
import { cn, getPath, slugify } from "@admin/lib/utils";

const WIDTH = { full: "sm:col-span-6", half: "sm:col-span-3", third: "sm:col-span-2", "two-thirds": "sm:col-span-4" };

/** Ref values come back populated ({ _id, name }) or as raw ids; work with ids */
const refId = (v: unknown, key: string) => (v && typeof v === "object" ? String((v as Record<string, unknown>)[key] ?? (v as Record<string, unknown>)._id ?? "") : v ? String(v) : "");

/* ---------- Strings ---------- */

function StringsField({ value, onChange, placeholder, itemLabel = "item", rows }: { value: string[] | undefined; onChange: (v: string[]) => void; placeholder?: string; itemLabel?: string; rows?: number }) {
  const list = value ?? [];
  // Stable keys while typing: index-based ids are fine because order only changes by drag
  return (
    <div className="space-y-2">
      <Sortable
        items={list.map((text, i) => ({ text, i }))}
        getId={(x) => String(x.i)}
        onReorder={(next) => onChange(next.map((x) => x.text))}
        className="space-y-2"
        render={(x, i, handle) => (
          <div className="flex items-start gap-1.5">
            <DragHandle handle={handle} className="mt-1.5" />
            {rows && rows > 1 ? (
              <Textarea rows={rows} value={x.text} placeholder={placeholder} onChange={(e) => onChange(list.map((s, j) => (j === i ? e.target.value : s)))} />
            ) : (
              <Input value={x.text} placeholder={placeholder} onChange={(e) => onChange(list.map((s, j) => (j === i ? e.target.value : s)))} />
            )}
            <button type="button" aria-label={`Remove ${itemLabel}`} onClick={() => onChange(list.filter((_, j) => j !== i))} className="mt-1 grid size-8 shrink-0 place-items-center rounded-[6px] text-ink-muted hover:bg-error-soft hover:text-error">
              <TrashIcon className="size-4" />
            </button>
          </div>
        )}
      />
      <Button variant="ghost" size="sm" icon={<PlusIcon className="size-4" />} onClick={() => onChange([...list, ""])}>
        Add {itemLabel}
      </Button>
    </div>
  );
}

/* ---------- List of objects ---------- */

function ListField({ def, value, onChange, errors, path }: { def: Extract<FieldDef, { type: "list" }>; value: FormValue[] | undefined; onChange: (v: FormValue[]) => void; errors?: Record<string, string>; path: string }) {
  const list = value ?? [];
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const titleOf = (item: FormValue, i: number) => {
    const t = def.titleKey ? getPath(item, def.titleKey) : item.title ?? item.name ?? item.q ?? item.label;
    return typeof t === "string" && t ? t : `${def.itemLabel ?? "Item"} ${i + 1}`;
  };
  return (
    <div className="space-y-2">
      <Sortable
        items={list.map((item, i) => ({ item, i }))}
        getId={(x) => String(x.i)}
        onReorder={(next) => {
          onChange(next.map((x) => x.item));
          setOpenIdx(null);
        }}
        className="space-y-2"
        render={(x, i, handle) => {
          const open = openIdx === i;
          return (
            <div className="rounded-[10px] border border-line bg-white">
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <DragHandle handle={handle} />
                <button type="button" onClick={() => setOpenIdx(open ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-[0.875rem] font-semibold">
                  <span className="truncate">{titleOf(x.item, i)}</span>
                  <CaretDownIcon className={cn("size-3.5 shrink-0 text-ink-soft transition-transform", open && "rotate-180")} />
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => {
                    onChange(list.filter((_, j) => j !== i));
                    setOpenIdx(null);
                  }}
                  className="grid size-8 place-items-center rounded-[6px] text-ink-muted hover:bg-error-soft hover:text-error"
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
              {open && (
                <div className="border-t border-line px-4 py-4">
                  <Fields fields={def.fields} value={x.item} onChange={(next) => onChange(list.map((it, j) => (j === i ? next : it)))} errors={errors} pathPrefix={`${path}.${i}.`} />
                </div>
              )}
            </div>
          );
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        icon={<PlusIcon className="size-4" />}
        onClick={() => {
          onChange([...list, {}]);
          setOpenIdx(list.length);
        }}
      >
        Add {(def.itemLabel ?? "item").toLowerCase()}
      </Button>
    </div>
  );
}

/* ---------- References ---------- */

type RefItem = Record<string, unknown> & { _id: string };

function useRefOptions(endpoint: string, query?: Record<string, string>) {
  return useQuery({
    queryKey: ["ref", endpoint, query],
    queryFn: () => api<ListResponse<RefItem>>(endpoint, { query: { limit: 200, ...query } }),
    staleTime: 60_000,
  });
}

function RefField({ def, value, onChange, id }: { def: Extract<FieldDef, { type: "ref" }>; value: unknown; onChange: (v: unknown) => void; id: string }) {
  const { data, isLoading } = useRefOptions(def.endpoint, def.query);
  const [q, setQ] = useState("");
  const key = def.valueKey ?? "_id";
  const options = (data?.items ?? []).map((it) => ({ value: String(it[key] ?? it._id), label: String(getPath(it, def.labelKey) ?? it._id) }));

  if (!def.multiple) {
    return (
      <Select id={id} value={refId(value, key)} onChange={(e) => onChange(e.target.value || null)} disabled={isLoading}>
        <option value="">{isLoading ? "Loading…" : "Choose…"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    );
  }

  const selected = new Set(((value as unknown[]) ?? []).map((v) => refId(v, key)));
  const toggle = (v: string) => onChange(selected.has(v) ? [...selected].filter((x) => x !== v) : [...selected, v]);
  const shown = options.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  // Keep the chosen order for things like "experiences on the home page"
  const ordered = [...selected].map((v) => options.find((o) => o.value === v)).filter((o): o is { value: string; label: string } => Boolean(o));

  return (
    <div className="rounded-[10px] border border-line bg-white">
      {ordered.length > 0 && (
        <div className="border-b border-line p-2">
          <Sortable
            items={ordered}
            getId={(o) => o.value}
            onReorder={(next) => onChange(next.map((o) => o.value))}
            className="flex flex-wrap gap-1.5"
            render={(o, _i, handle) => (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand-deep py-0.5 pr-1 pl-1 text-[0.8125rem] font-semibold">
                <DragHandle handle={handle} className="size-5" />
                {o.label}
                <button type="button" aria-label={`Remove ${o.label}`} onClick={() => toggle(o.value)} className="grid size-5 place-items-center rounded-full hover:bg-white">
                  ×
                </button>
              </span>
            )}
          />
        </div>
      )}
      {options.length > 8 && (
        <div className="relative border-b border-line">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 w-full bg-transparent pr-3 pl-9 text-[0.875rem] outline-none" />
        </div>
      )}
      <div className="grid max-h-56 gap-1 overflow-y-auto p-2 sm:grid-cols-2">
        {isLoading && <p className="px-2 py-1 text-[0.8125rem] text-ink-soft">Loading…</p>}
        {shown.map((o) => (
          <Checkbox key={o.value} checked={selected.has(o.value)} onChange={() => toggle(o.value)} label={o.label} className="rounded-[6px] px-2 py-1.5 hover:bg-sand" />
        ))}
      </div>
    </div>
  );
}

/* ---------- Icon picker ---------- */

function IconField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const Current = AMENITY_ICONS[value] ?? AMENITY_ICONS.Check;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-10 items-center gap-3 rounded-[8px] border border-field bg-white px-3 text-[0.9375rem]">
        <Current weight="light" className="size-6 text-gold" />
        {value || "Choose icon"}
      </button>
      <Dialog open={open} onOpenChange={setOpen} title="Choose an icon" size="lg">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {Object.entries(AMENITY_ICONS).map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                onChange(name);
                setOpen(false);
              }}
              className={cn("flex flex-col items-center gap-1.5 rounded-[10px] border p-3 text-[0.6875rem] hover:border-gold", value === name ? "border-gold bg-sand" : "border-line")}
            >
              <Icon weight="light" className="size-7 text-gold" />
              <span className="truncate">{name}</span>
            </button>
          ))}
        </div>
      </Dialog>
    </>
  );
}

/* ---------- SEO ---------- */

function SeoField({ value, onChange, titleHint }: { value: FormValue | undefined; onChange: (v: FormValue) => void; titleHint?: string }) {
  const uid = useId();
  const v = value ?? {};
  const set = (k: string, x: unknown) => onChange({ ...v, [k]: x });
  const title = String(v.title ?? "");
  const description = String(v.description ?? "");
  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-line bg-white px-4 py-3">
        <p className="text-[0.75rem] text-ink-soft">Google preview</p>
        <p className="mt-1 truncate text-[1.0625rem] text-info">{title || titleHint || "Page title"}</p>
        <p className="mt-0.5 line-clamp-2 text-[0.8125rem] text-ink-soft">{description || "Add a description of about 150 characters. It shows under the title in search results."}</p>
      </div>
      <Field label="SEO title" aside={`${title.length}/60`} help={titleHint ? `Leave empty to use "${titleHint}"` : "About 50–60 characters"}>
        <Input value={title} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Meta description" aside={`${description.length}/160`} help="About 140–160 characters">
        <Textarea rows={3} value={description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label="Keywords" help="Comma-separated, e.g. villa near Indore, farmhouse for party">
        <Input
          value={((v.keywords as string[]) ?? []).join(", ")}
          onChange={(e) =>
            set(
              "keywords",
              e.target.value
                .split(",")
                .map((s) => s.trimStart())
                .filter((s, i, a) => s || i === a.length - 1),
            )
          }
          onBlur={(e) =>
            set(
              "keywords",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      </Field>
      <Field label="Social share image" help="Shown when the page is shared on WhatsApp, Facebook etc. 1200 × 630 works best.">
        <ImageField value={v.ogImage as ImageValue | null} onChange={(img) => set("ogImage", img)} folder="seo" />
      </Field>
      <Switch id={`noindex-${uid}`} checked={Boolean(v.noindex)} onChange={(x) => set("noindex", x)} label="Hide from search engines (noindex)" />
    </div>
  );
}

/* ---------- Weekdays ---------- */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WeekdaysField({ value, onChange }: { value: number[] | undefined; onChange: (v: number[]) => void }) {
  const set = new Set(value ?? []);
  return (
    <div className="flex flex-wrap gap-1.5">
      {DAYS.map((d, i) => (
        <button
          key={d}
          type="button"
          aria-pressed={set.has(i)}
          onClick={() => onChange(set.has(i) ? [...set].filter((x) => x !== i).sort() : [...set, i].sort())}
          className={cn("h-9 rounded-full border px-3.5 text-[0.8125rem] font-semibold", set.has(i) ? "border-gold bg-gold text-white" : "border-field bg-white")}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

/* ---------- Renderer ---------- */

export function Fields({
  fields,
  value,
  onChange,
  errors = {},
  pathPrefix = "",
  className,
}: {
  fields: FieldDef[];
  value: FormValue;
  onChange: (next: FormValue) => void;
  errors?: Record<string, string>;
  /** For nested lists: prefix of error keys */
  pathPrefix?: string;
  className?: string;
}) {
  const setAt = (path: string, v: unknown) => {
    const parts = path.split(".");
    const write = (obj: FormValue, i: number): FormValue => {
      const k = parts[i];
      if (i === parts.length - 1) return { ...obj, [k]: v };
      const child = obj?.[k] && typeof obj[k] === "object" && !Array.isArray(obj[k]) ? (obj[k] as FormValue) : {};
      return { ...obj, [k]: write(child, i + 1) };
    };
    onChange(write(value ?? {}, 0));
  };

  return (
    <div className={cn("grid gap-x-4 gap-y-5 sm:grid-cols-6", className)}>
      {fields.map((f) => {
        if (f.showIf && !f.showIf(value)) return null;
        const id = `f-${pathPrefix}${f.name}`.replace(/\./g, "-");
        const v = getPath(value, f.name);
        const err = errors[`${pathPrefix}${f.name}`];
        const wrap = (control: React.ReactNode, opts: { label?: boolean } = {}) => (
          <Field key={f.name} label={opts.label === false ? undefined : f.label} htmlFor={id} help={f.help} error={err} className={WIDTH[f.width ?? "full"]}>
            {control}
          </Field>
        );

        switch (f.type) {
          case "heading":
            return (
              <h3 key={f.name} className="border-t border-line pt-4 text-[0.75rem] font-semibold tracking-[0.1em] text-ink-soft uppercase sm:col-span-6">
                {f.label}
              </h3>
            );
          case "text":
          case "url":
          case "email":
            return wrap(<Input id={id} type={f.type === "text" ? "text" : f.type} value={String(v ?? "")} placeholder={f.placeholder} aria-invalid={!!err} onChange={(e) => setAt(f.name, e.target.value)} />);
          case "slug":
            return wrap(
              <div className="flex items-stretch">
                {f.prefix && <span className="flex items-center rounded-l-[8px] border border-r-0 border-field bg-sand px-3 text-[0.875rem] text-ink-soft">{f.prefix}</span>}
                <Input
                  id={id}
                  value={String(v ?? "")}
                  className={f.prefix ? "rounded-l-none" : undefined}
                  aria-invalid={!!err}
                  onChange={(e) => setAt(f.name, e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  onFocus={() => !v && typeof getPath(value, f.from) === "string" && setAt(f.name, slugify(String(getPath(value, f.from))))}
                />
              </div>,
            );
          case "textarea":
            return wrap(<Textarea id={id} rows={f.rows ?? 3} value={String(v ?? "")} placeholder={f.placeholder} aria-invalid={!!err} onChange={(e) => setAt(f.name, e.target.value)} />);
          case "number":
            return wrap(
              <div className="relative">
                <Input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  min={f.min}
                  max={f.max}
                  step={f.step ?? 1}
                  value={v === undefined || v === null ? "" : String(v)}
                  aria-invalid={!!err}
                  onChange={(e) => setAt(f.name, e.target.value === "" ? undefined : Number(e.target.value))}
                  className={f.suffix ? "pr-14" : undefined}
                />
                {f.suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.8125rem] text-ink-soft">{f.suffix}</span>}
              </div>,
            );
          case "money":
            return wrap(<MoneyInput id={id} value={v as number} invalid={!!err} onChange={(n) => setAt(f.name, n)} />);
          case "boolean":
            return (
              <div key={f.name} className={cn(WIDTH[f.width ?? "full"], "flex flex-col justify-end")}>
                <Switch id={id} checked={Boolean(v)} onChange={(x) => setAt(f.name, x)} label={f.text ?? f.label} />
                {f.help && <p className="mt-1.5 text-[0.75rem] text-ink-soft">{f.help}</p>}
              </div>
            );
          case "select":
            return wrap(
              <Select id={id} value={String(v ?? "")} onChange={(e) => setAt(f.name, e.target.value)}>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>,
            );
          case "date":
            return wrap(<Input id={id} type="date" value={typeof v === "string" ? v.slice(0, 10) : ""} onChange={(e) => setAt(f.name, e.target.value || null)} />);
          case "image":
            return wrap(<ImageField value={v as ImageValue | null} onChange={(img) => setAt(f.name, img)} folder={f.folder} />);
          case "images":
            return wrap(<ImagesField value={v as ImageValue[]} onChange={(imgs) => setAt(f.name, imgs)} folder={f.folder} />);
          case "strings":
            return wrap(<StringsField value={v as string[]} onChange={(x) => setAt(f.name, x)} placeholder={f.placeholder} itemLabel={f.itemLabel} rows={f.rows} />);
          case "list":
            return wrap(<ListField def={f} value={v as FormValue[]} onChange={(x) => setAt(f.name, x)} errors={errors} path={`${pathPrefix}${f.name}`} />);
          case "ref":
            return wrap(<RefField def={f} value={v} onChange={(x) => setAt(f.name, x)} id={id} />);
          case "icon":
            return wrap(<IconField value={String(v ?? "")} onChange={(x) => setAt(f.name, x)} />);
          case "seo":
            return wrap(<SeoField value={v as FormValue} onChange={(x) => setAt(f.name, x)} titleHint={f.titleHint} />, { label: false });
          case "weekdays":
            return wrap(<WeekdaysField value={v as number[]} onChange={(x) => setAt(f.name, x)} />);
          case "group":
            return (
              <div key={f.name} className={WIDTH[f.width ?? "full"]}>
                {f.label && <p className="mb-2 text-[0.8125rem] font-semibold">{f.label}</p>}
                <Fields fields={f.fields} value={(v as FormValue) ?? {}} onChange={(x) => setAt(f.name, x)} errors={errors} pathPrefix={`${pathPrefix}${f.name}.`} />
              </div>
            );
          case "custom":
            return (
              <div key={f.name} className={WIDTH[f.width ?? "full"]}>
                {f.render({ value, onChange: setAt })}
              </div>
            );
        }
      })}
    </div>
  );
}
