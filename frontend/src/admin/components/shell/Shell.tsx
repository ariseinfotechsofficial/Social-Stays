"use client";

import { ArrowSquareOutIcon, ListIcon, SignOutIcon, UserIcon, XIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import logo from "@admin/assets/logo.png";
import { Menu } from "@admin/components/ui/overlay";
import { api } from "@admin/lib/api";
import { ROLE_LABELS, useMe, useSignOut } from "@admin/lib/session";
import { SITE_URL, cn } from "@admin/lib/utils";
import { OWNER_NAV, STAFF_NAV, type CountKey } from "./nav";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const me = useMe();
  const pathname = usePathname();
  const owner = me.role === "owner";
  const { data: counts } = useQuery({
    queryKey: ["nav-counts"],
    queryFn: () => api<Record<CountKey, number>>("/admin/dashboard/counts"),
    enabled: !owner,
    refetchInterval: 60_000,
  });

  const groups = (owner ? OWNER_NAV : STAFF_NAV)
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.perms || i.perms.some((p) => me.permissions.includes(p))) }))
    .filter((g) => g.items.length);

  return (
    <nav className="space-y-5 px-3 py-4" aria-label="Admin">
      {groups.map((g, gi) => (
        <div key={g.label ?? gi}>
          {g.label && <p className="mb-1 px-3 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const count = item.count ? counts?.[item.count] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-[8px] px-3 py-2 text-[0.875rem] font-medium transition-colors",
                      active ? "bg-sand-deep text-ink" : "text-ink-soft hover:bg-sand hover:text-ink",
                    )}
                  >
                    <item.icon weight={active ? "fill" : "regular"} className={cn("size-[1.15rem] shrink-0", active && "text-gold")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {count ? <span className="rounded-full bg-gold px-1.5 text-[0.6875rem] font-bold text-white tabular-nums">{count}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserMenu() {
  const me = useMe();
  const router = useRouter();
  const signOut = useSignOut();
  return (
    <Menu
      trigger={
        <button type="button" className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 hover:bg-sand">
          <span className="grid size-8 place-items-center rounded-full bg-ink text-[0.8125rem] font-semibold text-white">{me.name.slice(0, 1).toUpperCase()}</span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-[0.8125rem] font-semibold">{me.name}</span>
            <span className="block text-[0.6875rem] text-ink-soft">{ROLE_LABELS[me.role]}</span>
          </span>
        </button>
      }
      items={[
        { label: "My profile", icon: <UserIcon className="size-4" />, onSelect: () => router.push("/admin/profile") },
        { label: "Open website", icon: <ArrowSquareOutIcon className="size-4" />, onSelect: () => window.open(`${SITE_URL}/`, "_blank") },
        "separator",
        { label: "Sign out", icon: <SignOutIcon className="size-4" />, onSelect: signOut, danger: true },
      ]}
    />
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const brand = (
    <Link href="/admin" className="flex items-center gap-2 px-6" aria-label="Dashboard">
      <Image src={logo} alt="Social Stays" className="h-10 w-auto" priority />
    </Link>
  );

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-line">{brand}</div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-night/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line pr-3">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-sand" aria-label="Close menu">
                <XIcon className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full border border-line lg:hidden" aria-label="Open menu">
            <ListIcon className="size-5" />
          </button>
          <div className="flex-1" />
          <a href={`${SITE_URL}/`} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-soft hover:text-ink sm:inline-flex">
            View website <ArrowSquareOutIcon className="size-3.5" />
          </a>
          <UserMenu />
        </header>
        <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
