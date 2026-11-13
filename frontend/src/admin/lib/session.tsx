"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { api } from "@admin/lib/api";

/** Mirrors backend/src/lib/auth.ts */
export type Permission =
  | "content"
  | "catalog"
  | "media"
  | "settings"
  | "booking-settings"
  | "leads"
  | "bookings"
  | "payments"
  | "coupons"
  | "payouts"
  | "users"
  | "owners"
  | "activity";

export type Role = "superadmin" | "editor" | "sales" | "owner";

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super Admin",
  editor: "Editor",
  sales: "Sales",
  owner: "Villa owner",
};

export const ROLE_HELP: Record<Role, string> = {
  superadmin: "Everything, including users, payments and settings",
  editor: "Website content, villas, photos, SEO and leads",
  sales: "Leads, bookings, calendar and coupons",
  owner: "Their own villas: bookings, calendar, earnings and edit requests",
};

export type Me = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  villas: { _id: string; name: string; slug: string }[];
  permissions: Permission[];
};

const SessionContext = createContext<Me | null>(null);

export function useMeQuery() {
  return useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/auth/me"), retry: false, staleTime: 5 * 60_000 });
}

export function SessionProvider({ me, children }: { me: Me; children: ReactNode }) {
  return <SessionContext.Provider value={me}>{children}</SessionContext.Provider>;
}

export function useMe() {
  const me = useContext(SessionContext);
  if (!me) throw new Error("useMe() outside the signed-in app");
  return me;
}

export function useCan() {
  const me = useMe();
  return (...perms: Permission[]) => perms.some((p) => me.permissions.includes(p));
}

export function useSignOut() {
  const qc = useQueryClient();
  return async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    qc.clear();
    window.location.href = "/admin/login";
  };
}
