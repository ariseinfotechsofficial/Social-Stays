"use client";

import { ArrowSquareOutIcon, CaretDownIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Fields } from "@admin/components/fields/Fields";
import type { FieldDef, FormValue } from "@admin/components/fields/types";
import { NoAccess } from "@admin/components/NoAccess";
import { useUnsavedWarning } from "@admin/components/resource/ResourceEditor";
import { DragHandle, Sortable } from "@admin/components/sortable";
import { Button } from "@admin/components/ui/button";
import { Alert, Badge, Card, Loading } from "@admin/components/ui/feedback";
import { Switch } from "@admin/components/ui/form";
import { PageHeader } from "@admin/components/ui/layout";
import { ApiError, api } from "@admin/lib/api";
import { useCan } from "@admin/lib/session";
import { SITE_URL, cn } from "@admin/lib/utils";

/* The backend registry's field shapes (backend/src/content/registry.ts) */
type RegField =
  | { name: string; label: string; type: "text" | "textarea" | "number" | "boolean" | "image" | "images" | "strings" | "url"; help?: string; placeholder?: string }
  | { name: string; label: string; type: "list"; fields: RegField[]; itemLabel?: string; help?: string }
  | { name: string; label: string; type: "ref"; collection: "experiences" | "reviews" | "villas" | "destinations"; multiple?: boolean; help?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string };

type SectionType = { type: string; label: string; description?: string; shared?: boolean; fields: RegField[] };
type PageDef = { key: string; label: string; path: string; reorderable: boolean; seo: boolean; sections: { key: string; type: string }[] };
type Section = { key: string; type: string; enabled: boolean; data: FormValue };
type PageResponse = { def: PageDef; seo: FormValue; sections: Section[]; updatedAt: string | null };

const REF: Record<string, { endpoint: string; labelKey: string }> = {
  experiences: { endpoint: "/admin/experiences", labelKey: "title" },
  reviews: { endpoint: "/admin/reviews", labelKey: "name" },
  villas: { endpoint: "/admin/villas", labelKey: "name" },
  destinations: { endpoint: "/admin/destinations", labelKey: "name" },
};

/** Registry fields → form field definitions. Section refs store slugs so they survive renames of other fields. */
function toFieldDefs(fields: RegField[]): FieldDef[] {
  return fields.map((f): FieldDef => {
    const half = ["number"].includes(f.type) ? "third" : f.type === "text" || f.type === "url" ? "half" : "full";
    switch (f.type) {
      case "list":
        return { name: f.name, label: f.label, type: "list", itemLabel: f.itemLabel, help: f.help, fields: toFieldDefs(f.fields) };
      case "ref":
        return { name: f.name, label: f.label, type: "ref", endpoint: REF[f.collection].endpoint, labelKey: REF[f.collection].labelKey, valueKey: "slug", multiple: f.multiple, help: f.help };
      case "select":
        return { name: f.name, label: f.label, type: "select", options: f.options, help: f.help, width: "half" };
      case "textarea":
        return { name: f.name, label: f.label, type: "textarea", rows: 3, help: f.help };
      case "strings":
        return { name: f.name, label: f.label, type: "strings", help: f.help, rows: 2, itemLabel: "line" };
      case "image":
      case "images":
        return { name: f.name, label: f.label, type: f.type, help: f.help, folder: "site" };
      default:
        return { name: f.name, label: f.label, type: f.type, help: f.help, width: half as "half" | "third" | "full" } as FieldDef;
    }
  });
}

function SectionCard({
  section,
  type,
  onChange,
  handle,
  open,
  onToggle,
}: {
  section: Section;
  type?: SectionType;
  onChange: (s: Section) => void;
  handle?: Parameters<typeof DragHandle>[0]["handle"];
  open: boolean;
  onToggle: () => void;
}) {
  const shared = type?.shared;
  return (
    <div className={cn("rounded-[12px] border bg-white transition-colors", section.enabled ? "border-line" : "border-dashed border-field bg-canvas")}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {handle && <DragHandle handle={handle} />}
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={open}>
          <span className={cn("font-semibold", !section.enabled && "text-ink-soft")}>{type?.label ?? section.key}</span>
          {shared && <Badge tone="info">Shared</Badge>}
          {!section.enabled && <Badge>Hidden</Badge>}
          <CaretDownIcon className={cn("ml-auto size-4 shrink-0 text-ink-soft transition-transform", open && "rotate-180")} />
        </button>
        <Switch checked={section.enabled} onChange={(enabled) => onChange({ ...section, enabled })} id={`sec-${section.key}`} />
      </div>
      {open && (
        <div className="border-t border-line px-5 py-5">
          {type?.description && <p className="mb-4 text-[0.8125rem] text-ink-soft">{type.description}</p>}
          {shared ? (
            <p className="text-[0.875rem] text-ink-soft">
              This block&apos;s content is shared across pages. Edit it in{" "}
              <Link href="/admin/pages/shared" className="font-semibold text-gold-deep underline">
                Shared blocks
              </Link>
              ; here you can only show or hide it.
            </p>
          ) : type ? (
            <Fields fields={toFieldDefs(type.fields)} value={section.data} onChange={(data) => onChange({ ...section, data })} />
          ) : (
            <p className="text-[0.875rem] text-ink-soft">No editable fields.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PageEditor() {
  const { key } = useParams<{ key: string }>();
  const can = useCan();
  const qc = useQueryClient();
  const registry = useQuery({ queryKey: ["pages"], queryFn: () => api<{ pages: PageDef[]; sectionTypes: SectionType[] }>("/admin/pages"), enabled: can("content") });
  const page = useQuery({ queryKey: ["pages", key], queryFn: () => api<PageResponse>(`/admin/pages/${key}`), enabled: can("content") });

  const [state, setState] = useState<{ seo: FormValue; sections: Section[] } | null>(null);
  const [saved, setSaved] = useState("");
  const [loadedAt, setLoadedAt] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (page.data && page.dataUpdatedAt !== loadedAt) {
    const next = { seo: page.data.seo ?? {}, sections: page.data.sections };
    setLoadedAt(page.dataUpdatedAt);
    setState(next);
    setSaved(JSON.stringify(next));
    // A page with a single section opens it straight away
    if (page.data.sections.length === 1) setOpen(page.data.sections[0].key);
  }

  const dirty = state !== null && JSON.stringify(state) !== saved;
  useUnsavedWarning(dirty);

  if (!can("content")) return <NoAccess />;
  if (page.isLoading || registry.isLoading || !state || !page.data) return page.error ? <Alert tone="error">{page.error.message}</Alert> : <Loading />;

  const def = page.data.def;
  const typeOf = (t: string) => registry.data?.sectionTypes.find((s) => s.type === t);

  const save = async () => {
    setSaving(true);
    try {
      await api(`/admin/pages/${key}`, { method: "PUT", json: { seo: def.seo ? state.seo : undefined, sections: state.sections.map(({ key: k, enabled, data }) => ({ key: k, enabled, data })) } });
      toast.success("Saved. The website updates in a few seconds.");
      await qc.invalidateQueries({ queryKey: ["pages"] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (s: Section) => setState({ ...state, sections: state.sections.map((x) => (x.key === s.key ? s : x)) });
  const card = (s: Section, handle?: Parameters<typeof DragHandle>[0]["handle"]) => (
    <SectionCard section={s} type={typeOf(s.type)} onChange={updateSection} handle={handle} open={open === s.key} onToggle={() => setOpen(open === s.key ? null : s.key)} />
  );

  return (
    <>
      <PageHeader
        back={{ href: "/admin/pages", label: "Pages & sections" }}
        title={def.label}
        description={def.reorderable ? "Drag sections to reorder them. Use the switch to hide a section without losing its content." : "Use the switch to hide a section without losing its content."}
        actions={
          <>
            {def.key !== "shared" && !["villa", "destination"].includes(def.key) && (
              <a href={`${SITE_URL}${def.path === "/404" ? "/this-page-does-not-exist" : def.path}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 px-2 text-[0.875rem] font-semibold text-ink-soft hover:text-ink">
                View on site <ArrowSquareOutIcon className="size-4" />
              </a>
            )}
            <Button onClick={save} loading={saving} disabled={!dirty}>
              {dirty ? "Save changes" : "Saved"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          {def.reorderable ? (
            <Sortable items={state.sections} getId={(s) => s.key} onReorder={(sections) => setState({ ...state, sections })} className="space-y-2.5" render={(s, _i, handle) => card(s, handle)} />
          ) : (
            <div className="space-y-2.5">
              {state.sections.map((s) => (
                <div key={s.key}>{card(s)}</div>
              ))}
            </div>
          )}
        </div>

        {def.seo && (
          <div>
            <Card title="Search & sharing">
              <Fields fields={[{ name: "seo", label: "SEO", type: "seo" }]} value={{ seo: state.seo }} onChange={(v) => setState({ ...state, seo: (v.seo as FormValue) ?? {} })} />
            </Card>
          </div>
        )}
      </div>

      {dirty && (
        <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-4 rounded-full border border-line bg-white/95 py-2 pr-2 pl-5 shadow-xl backdrop-blur">
          <span className="text-[0.875rem] font-medium">You have unsaved changes</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setState(JSON.parse(saved))}>
              Discard
            </Button>
            <Button size="sm" onClick={save} loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
