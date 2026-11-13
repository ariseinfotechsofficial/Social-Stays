"use client";

import { ArrowRightIcon, FileTextIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { NoAccess } from "@admin/components/NoAccess";
import { Card, Loading } from "@admin/components/ui/feedback";
import { PageHeader } from "@admin/components/ui/layout";
import { api } from "@admin/lib/api";
import { useCan } from "@admin/lib/session";
import { ago } from "@admin/lib/utils";

type PageDef = { key: string; label: string; path: string; reorderable: boolean; seo: boolean; sections: { key: string; type: string }[]; updatedAt?: string | null };

export default function PagesIndex() {
  const can = useCan();
  const { data, isLoading } = useQuery({ queryKey: ["pages"], queryFn: () => api<{ pages: PageDef[] }>("/admin/pages"), enabled: can("content") });
  if (!can("content")) return <NoAccess />;

  return (
    <>
      <PageHeader title="Pages & sections" description="Every heading, paragraph, photo and button on the website. Switch sections on or off, and drag them into a new order on pages that allow it." />
      {isLoading ? (
        <Loading />
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-line">
            {data?.pages.map((p) => (
              <li key={p.key}>
                <Link href={`/admin/pages/${p.key}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-sand text-gold">
                    {p.key === "shared" ? <ShareNetworkIcon className="size-5" /> : <FileTextIcon className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.label}</span>
                    <span className="block truncate text-[0.8125rem] text-ink-soft">
                      {p.key === "shared"
                        ? "Owner invitation band and Instagram strip, used on several pages"
                        : `${p.path} · ${p.sections.length} section${p.sections.length === 1 ? "" : "s"}${p.reorderable ? " · reorderable" : ""}`}
                    </span>
                  </span>
                  {p.updatedAt && <span className="hidden text-[0.8125rem] text-ink-muted sm:block">Edited {ago(p.updatedAt)}</span>}
                  <ArrowRightIcon className="size-4 text-ink-soft" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
