import type { ReactNode } from "react";
import type { FieldDef, FormValue } from "@admin/components/fields/types";
import type { Permission } from "@admin/lib/session";

export type Doc = FormValue & { _id: string };

export type Column = { label: string; render: (doc: Doc) => ReactNode; className?: string };

export type FormSectionDef = { title: string; description?: string; fields: FieldDef[] };

export type ResourceConfig = {
  /** URL segment: /villas */
  key: string;
  endpoint: string;
  title: string;
  singular: string;
  description?: string;
  /** Needed to see the screen at all */
  perms: Permission[];
  columns: Column[];
  searchable?: boolean;
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
  /** Drag rows to set the order used on the website */
  sortable?: boolean;
  /** Default sort for the list (backend sort string) */
  sort?: string;
  defaults: FormValue;
  /** Form layout: one page of sections, or tabs of sections */
  sections?: FormSectionDef[];
  tabs?: { key: string; label: string; sections: FormSectionDef[] }[];
  /** Extra tabs with their own UI (e.g. seasonal prices), shown once the record exists */
  extraTabs?: { key: string; label: string; render: (doc: Doc) => ReactNode }[];
  titleOf: (doc: FormValue) => string;
  viewUrl?: (doc: FormValue) => string | null;
  duplicable?: boolean;
  /** Turn the loaded record into form values (e.g. populated refs → ids) */
  toForm?: (doc: Doc) => FormValue;
  /** Last tweaks before saving */
  fromForm?: (value: FormValue) => FormValue;
  /** Shown above the form */
  notice?: (doc: FormValue) => ReactNode;
};
