"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ClientSite } from "@/lib/site";

const SiteContext = createContext<ClientSite | null>(null);

/** Site settings from the admin (contact details, menus, enquiry options) for client components. */
export function SiteProvider({ site, children }: { site: ClientSite; children: ReactNode }) {
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const site = useContext(SiteContext);
  if (!site) throw new Error("useSite() must be used inside <SiteProvider>");
  return site;
}
