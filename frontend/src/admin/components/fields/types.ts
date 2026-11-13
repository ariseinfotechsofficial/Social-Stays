import type { ReactNode } from "react";

type Base = {
  /** Dot path into the value, e.g. "guests.max" */
  name: string;
  label: string;
  help?: ReactNode;
  /** Grid width out of 6 columns */
  width?: "full" | "half" | "third" | "two-thirds";
  required?: boolean;
  /** Hide the field unless this returns true for the current value */
  showIf?: (value: Record<string, unknown>) => boolean;
};

export type FieldDef =
  | (Base & { type: "text" | "url" | "email"; placeholder?: string; maxLength?: number })
  | (Base & { type: "slug"; from: string; prefix?: string })
  | (Base & { type: "textarea"; rows?: number; placeholder?: string; maxLength?: number })
  | (Base & { type: "number"; min?: number; max?: number; step?: number; suffix?: string })
  | (Base & { type: "money" })
  | (Base & { type: "boolean"; text?: string })
  | (Base & { type: "select"; options: { value: string; label: string }[] })
  | (Base & { type: "date" })
  | (Base & { type: "image"; folder?: string })
  | (Base & { type: "images"; folder?: string })
  | (Base & { type: "strings"; itemLabel?: string; placeholder?: string; rows?: number })
  | (Base & { type: "list"; fields: FieldDef[]; itemLabel?: string; titleKey?: string })
  | (Base & {
      type: "ref";
      endpoint: string;
      labelKey: string;
      /** What gets stored: the item's _id (default) or its slug */
      valueKey?: "_id" | "slug" | "key";
      multiple?: boolean;
      query?: Record<string, string>;
    })
  | (Base & { type: "icon" })
  | (Base & { type: "seo"; titleHint?: string })
  | (Base & { type: "weekdays" })
  | (Base & { type: "group"; fields: FieldDef[] })
  | (Base & { type: "heading" })
  | (Base & { type: "custom"; render: (props: { value: Record<string, unknown>; onChange: (path: string, v: unknown) => void }) => ReactNode });

export type FormValue = Record<string, unknown>;
