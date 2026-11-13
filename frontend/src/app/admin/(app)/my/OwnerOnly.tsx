"use client";

import type { ReactNode } from "react";
import { NoAccess } from "@admin/components/NoAccess";
import { useMe } from "@admin/lib/session";

export function OwnerOnly({ children }: { children: ReactNode }) {
  const me = useMe();
  return me.role === "owner" ? <>{children}</> : <NoAccess />;
}
