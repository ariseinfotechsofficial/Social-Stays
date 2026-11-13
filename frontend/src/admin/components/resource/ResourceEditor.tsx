"use client";

import { ArrowSquareOutIcon, CopyIcon, DotsThreeIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Fields } from "@admin/components/fields/Fields";
import type { FormValue } from "@admin/components/fields/types";
import { Button } from "@admin/components/ui/button";
import { Alert, Card, Loading } from "@admin/components/ui/feedback";
import { FormSection, PageHeader, Tabs } from "@admin/components/ui/layout";
import { Menu, useConfirm } from "@admin/components/ui/overlay";
import { ApiError, api, fieldErrors } from "@admin/lib/api";
import { useCan } from "@admin/lib/session";
import { SITE_URL } from "@admin/lib/utils";
import type { Doc, FormSectionDef, ResourceConfig } from "@admin/resources/types";

/** Warns before leaving with unsaved changes */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);
}

function Sections({ sections, value, onChange, errors }: { sections: FormSectionDef[]; value: FormValue; onChange: (v: FormValue) => void; errors: Record<string, string> }) {
  return (
    <Card>
      {sections.map((s) => (
        <FormSection key={s.title} title={s.title} description={s.description}>
          <Fields fields={s.fields} value={value} onChange={onChange} errors={errors} />
        </FormSection>
      ))}
    </Card>
  );
}

export function ResourceEditor({ config, id }: { config: ResourceConfig; id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const can = useCan();
  const isNew = id === "new";
  const [value, setValue] = useState<FormValue | null>(isNew ? structuredClone(config.defaults) : null);
  const [saved, setSaved] = useState<string>(isNew ? JSON.stringify(config.defaults) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(config.tabs?.[0]?.key ?? "");

  const doc = useQuery({
    queryKey: [config.endpoint, id],
    queryFn: () => api<Doc>(`${config.endpoint}/${id}`),
    enabled: !isNew,
  });

  // Load the record into the form once (and again after a save refreshes it)
  const [loadedAt, setLoadedAt] = useState(0);
  if (doc.data && doc.dataUpdatedAt !== loadedAt) {
    const form = config.toForm ? config.toForm(doc.data) : doc.data;
    setLoadedAt(doc.dataUpdatedAt);
    setValue(form);
    setSaved(JSON.stringify(form));
  }

  const dirty = value !== null && JSON.stringify(value) !== saved;
  useUnsavedWarning(dirty);
  const canWrite = can(...config.perms);

  const save = async () => {
    if (!value) return;
    setSaving(true);
    setErrors({});
    try {
      const body = config.fromForm ? config.fromForm(value) : value;
      const res = await api<Doc>(isNew ? config.endpoint : `${config.endpoint}/${id}`, { method: isNew ? "POST" : "PATCH", json: body });
      toast.success(isNew ? `${config.singular} created` : "Saved. The website updates in a few seconds.");
      qc.invalidateQueries({ queryKey: [config.endpoint] });
      qc.invalidateQueries({ queryKey: ["ref", config.endpoint] });
      if (isNew) {
        setSaved(JSON.stringify(value));
        router.replace(`/admin/${config.key}/${res._id}`);
      }
    } catch (e) {
      setErrors(fieldErrors(e));
      toast.error(e instanceof ApiError ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!value || !(await confirm({ title: `Delete ${config.titleOf(value)}?`, body: "This can't be undone.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await api(`${config.endpoint}/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: [config.endpoint] });
      router.replace(`/admin/${config.key}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't delete");
    }
  };

  const duplicate = async () => {
    try {
      const copy = await api<Doc>(`${config.endpoint}/${id}/duplicate`, { method: "POST" });
      toast.success("Copy created");
      router.push(`/admin/${config.key}/${copy._id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't duplicate");
    }
  };

  const tabs = useMemo(
    () => [...(config.tabs ?? []).map((t) => ({ value: t.key, label: t.label })), ...(!isNew ? (config.extraTabs ?? []).map((t) => ({ value: t.key, label: t.label })) : [])],
    [config, isNew],
  );

  if (!isNew && doc.isLoading) return <Loading />;
  if (!isNew && doc.error) return <Alert tone="error">{doc.error.message}</Alert>;
  if (!value) return <Loading />;

  const viewUrl = !isNew && config.viewUrl ? config.viewUrl(value) : null;
  const errorCount = Object.keys(errors).length;
  const extra = config.extraTabs?.find((t) => t.key === tab);
  const formTab = config.tabs?.find((t) => t.key === tab);

  return (
    <>
      <PageHeader
        back={{ href: `/admin/${config.key}`, label: config.title }}
        title={isNew ? `New ${config.singular.toLowerCase()}` : config.titleOf(value) || config.singular}
        actions={
          <>
            {viewUrl && (
              <a href={`${SITE_URL}${viewUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 px-2 text-[0.875rem] font-semibold text-ink-soft hover:text-ink">
                View on site <ArrowSquareOutIcon className="size-4" />
              </a>
            )}
            {!isNew && canWrite && (
              <Menu
                trigger={
                  <Button variant="secondary" size="icon" aria-label="More actions">
                    <DotsThreeIcon weight="bold" className="size-5" />
                  </Button>
                }
                items={[
                  config.duplicable && { label: "Duplicate", icon: <CopyIcon className="size-4" />, onSelect: duplicate },
                  { label: "Delete", icon: <TrashIcon className="size-4" />, danger: true, onSelect: remove },
                ]}
              />
            )}
            {canWrite && (
              <Button onClick={save} loading={saving} disabled={!dirty && !isNew}>
                {isNew ? `Create ${config.singular.toLowerCase()}` : dirty ? "Save changes" : "Saved"}
              </Button>
            )}
          </>
        }
      />

      {config.notice?.(value)}
      {errorCount > 0 && (
        <Alert tone="error" className="mb-4">
          Please fix {errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`}
          {tabs.length ? " (check every tab)" : ""}.
        </Alert>
      )}

      {tabs.length > 0 && <Tabs value={tab} onChange={setTab} tabs={tabs} className="mb-5" />}

      {extra && !isNew && doc.data ? (
        extra.render(doc.data)
      ) : (
        <Sections sections={formTab ? formTab.sections : (config.sections ?? [])} value={value} onChange={setValue} errors={errors} />
      )}

      {dirty && canWrite && (
        <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-4 rounded-full border border-line bg-white/95 py-2 pr-2 pl-5 shadow-xl backdrop-blur">
          <span className="text-[0.875rem] font-medium">You have unsaved changes</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setValue(JSON.parse(saved));
                setErrors({});
              }}
            >
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
