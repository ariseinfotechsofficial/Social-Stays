"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarList, ColumnChart } from "@admin/components/charts";
import { Card, Loading, Stat } from "@admin/components/ui/feedback";
import { PageHeader } from "@admin/components/ui/layout";
import { api } from "@admin/lib/api";
import { useCan, useMe } from "@admin/lib/session";
import { activityText, ago } from "@admin/lib/utils";

type Dashboard = {
  leads?: { newEnquiries: number; enquiries30: number; newOwnerLeads: number; bySource: { source: string; count: number }[]; byDay: { date: string; count: number }[] };
  listingRequests?: number;
  activity?: { _id: string; userName?: string; action: string; entity: string; label?: string; createdAt: string }[];
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

function StaffDashboard() {
  const me = useMe();
  const can = useCan();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/admin/dashboard"), refetchInterval: 120_000 });
  if (isLoading || !data) return <Loading />;
  const { leads } = data;

  return (
    <>
      <PageHeader title={`${greeting()}, ${me.name.split(" ")[0]}`} description="Here's what's happening across Social Stays." />

      {leads && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/admin/enquiries">
            <Stat label="New enquiries" value={leads.newEnquiries} tone={leads.newEnquiries ? "attention" : undefined} hint="Not contacted yet" />
          </Link>
          <Link href="/admin/enquiries">
            <Stat label="Enquiries, last 30 days" value={leads.enquiries30} hint="All website forms" />
          </Link>
          <Link href="/admin/owner-leads">
            <Stat label="New owner leads" value={leads.newOwnerLeads} tone={leads.newOwnerLeads ? "attention" : undefined} hint="From Partner with us" />
          </Link>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {leads && (
          <Card title="Enquiries per day, last 30 days">
            <ColumnChart
              title="Enquiries per day, last 30 days"
              data={leads.byDay.map((d) => ({ label: format(parseISO(d.date), "d MMM"), value: d.count, tooltip: `${d.count} enquir${d.count === 1 ? "y" : "ies"}` }))}
              labelEvery={5}
            />
          </Card>
        )}
        {leads && (
          <Card title="Where enquiries came from, last 30 days">
            {leads.bySource.length ? <BarList title="Enquiries by source" data={leads.bySource.map((s) => ({ label: s.source, value: s.count }))} /> : <p className="text-[0.875rem] text-ink-soft">No enquiries yet.</p>}
          </Card>
        )}
      </div>

      {(data.listingRequests || data.activity?.length) && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {data.activity && (
            <Card title="Recent activity" action={can("activity") && <Link href="/admin/activity" className="text-[0.8125rem] font-semibold text-gold-deep">All activity</Link>} padded={false}>
              <ul className="divide-y divide-line text-[0.875rem]">
                {data.activity.map((a) => (
                  <li key={a._id} className="flex justify-between gap-4 px-5 py-2.5">
                    <span className="min-w-0 truncate">
                      <span className="font-semibold">{a.userName ?? "System"}</span> {activityText(a)}
                      {a.label && <span className="text-ink-soft"> · {a.label}</span>}
                    </span>
                    <span className="shrink-0 text-ink-muted">{ago(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {Boolean(data.listingRequests) && (
            <Card title="Waiting for you">
              <Link href="/admin/listing-requests" className="flex items-center justify-between gap-3 rounded-[10px] bg-sand px-4 py-3 font-semibold">
                {data.listingRequests} listing change request{data.listingRequests === 1 ? "" : "s"} from owners
                <ArrowRightIcon className="size-4" />
              </Link>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

/** Owners only manage their listings, so their home is the My villas page */
function OwnerHome() {
  const router = useRouter();
  useEffect(() => router.replace("/admin/my/villas"), [router]);
  return <Loading />;
}

export default function DashboardPage() {
  const me = useMe();
  return me.role === "owner" ? <OwnerHome /> : <StaffDashboard />;
}
