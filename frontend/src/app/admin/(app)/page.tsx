"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { BarList, ColumnChart } from "@admin/components/charts";
import { Card, Empty, Loading, Stat } from "@admin/components/ui/feedback";
import { PageHeader } from "@admin/components/ui/layout";
import { api } from "@admin/lib/api";
import { useCan, useMe } from "@admin/lib/session";
import { activityText, ago, formatINR, stayDay } from "@admin/lib/utils";

type Dashboard = {
  leads?: { newEnquiries: number; enquiries30: number; newOwnerLeads: number; bySource: { source: string; count: number }[]; byDay: { date: string; count: number }[] };
  bookings?: {
    requests: number;
    cancellations: number;
    upcoming: number;
    occupancy30: number;
    arrivals: { _id: string; ref: string; villaName: string; checkIn: string; checkOut: string; guests: number; guest: { name: string }; amountPaid: number; pricing: { total: number } }[];
    byMonth: { month: string; value: number; count: number }[];
  };
  payments?: { collectedThisMonth: number };
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
  const { leads, bookings, payments } = data;
  const needsAction = (bookings?.requests ?? 0) + (bookings?.cancellations ?? 0);

  return (
    <>
      <PageHeader title={`${greeting()}, ${me.name.split(" ")[0]}`} description="Here's what's happening across Social Stays." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {bookings && (
          <Link href="/admin/bookings">
            <Stat label="Needs your action" value={needsAction} tone={needsAction ? "attention" : undefined} hint={`${bookings.requests} request${bookings.requests === 1 ? "" : "s"} · ${bookings.cancellations} cancellation${bookings.cancellations === 1 ? "" : "s"}`} />
          </Link>
        )}
        {leads && (
          <Link href="/admin/enquiries">
            <Stat label="New enquiries" value={leads.newEnquiries} tone={leads.newEnquiries ? "attention" : undefined} hint={`${leads.enquiries30} in the last 30 days`} />
          </Link>
        )}
        {bookings && <Stat label="Upcoming stays" value={bookings.upcoming} hint="Confirmed, from today" />}
        {bookings && <Stat label="Occupancy, next 30 days" value={`${bookings.occupancy30}%`} hint="Booked nights across live villas" />}
        {payments && <Stat label="Collected this month" value={formatINR(payments.collectedThisMonth)} hint="Payments received" />}
        {leads && !bookings && (
          <Link href="/admin/owner-leads">
            <Stat label="New owner leads" value={leads.newOwnerLeads} />
          </Link>
        )}
      </div>

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
        {bookings && (
          <Card title="Confirmed booking value by month of stay">
            <ColumnChart
              title="Confirmed booking value by month of stay"
              format={(n) => (n ? `₹${n >= 1e5 ? `${+(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `${+(n / 1e3).toFixed(0)}K` : n}` : "0")}
              data={bookings.byMonth.map((m) => ({ label: format(parseISO(`${m.month}-01`), "MMM"), value: m.value, tooltip: `${formatINR(m.value)} · ${m.count} stay${m.count === 1 ? "" : "s"}` }))}
            />
          </Card>
        )}
        {bookings && (
          <Card title="Arriving in the next 7 days" action={<Link href="/admin/calendar" className="text-[0.8125rem] font-semibold text-gold-deep">Calendar</Link>} padded={false}>
            {bookings.arrivals.length ? (
              <ul className="divide-y divide-line">
                {bookings.arrivals.map((b) => (
                  <li key={b._id}>
                    <Link href={`/admin/bookings/${b._id}`} className="flex items-center gap-3 px-5 py-2.5 text-[0.875rem] hover:bg-canvas">
                      <span className="w-14 shrink-0 text-center">
                        <span className="block text-[0.6875rem] font-semibold text-gold-deep uppercase">{stayDay(b.checkIn, "EEE")}</span>
                        <span className="block font-display text-[1.375rem] leading-none">{stayDay(b.checkIn, "d")}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{b.guest.name}</span>
                        <span className="block truncate text-ink-soft">
                          {b.villaName} · {b.guests} guests
                        </span>
                      </span>
                      {b.amountPaid < b.pricing.total && <span className="text-[0.75rem] font-semibold text-warn">{formatINR(b.pricing.total - b.amountPaid)} due</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No arrivals this week" />
            )}
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

type OwnerBooking = { _id: string; ref: string; villaName: string; checkIn: string; checkOut: string; nights: number; guests: number; occasion?: string; guest: { name: string; phone?: string }; earnings: { share: number } };

function OwnerDashboard() {
  const me = useMe();
  const { data, isLoading } = useQuery({
    queryKey: ["owner-dashboard"],
    queryFn: () => api<{ upcoming: OwnerBooking[]; month: { share: number; nights: number; bookings: number }; owed: number; paidToDate: number }>("/owner/dashboard"),
  });
  if (isLoading || !data) return <Loading />;
  return (
    <>
      <PageHeader title={`${greeting()}, ${me.name.split(" ")[0]}`} description={me.villas.map((v) => v.name).join(", ") || "No villas are linked to your account yet. Ask the Social Stays team."} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Your earnings this month" value={formatINR(data.month.share)} hint={`${data.month.bookings} stay${data.month.bookings === 1 ? "" : "s"}, ${data.month.nights} nights`} />
        <Stat label="Owed to you" value={formatINR(data.owed)} hint="Confirmed stays not yet paid out" />
        <Stat label="Paid to you so far" value={formatINR(data.paidToDate)} />
        <Stat label="Upcoming stays" value={data.upcoming.length} />
      </div>
      <Card title="Next guests" className="mt-5" padded={false} action={<Link href="/admin/my/bookings" className="text-[0.8125rem] font-semibold text-gold-deep">All bookings</Link>}>
        {data.upcoming.length ? (
          <ul className="divide-y divide-line text-[0.875rem]">
            {data.upcoming.map((b) => (
              <li key={b._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <span className="w-40 font-semibold">
                  {stayDay(b.checkIn, "EEE d MMM")} – {stayDay(b.checkOut, "d MMM")}
                </span>
                <span className="min-w-0 flex-1">
                  {b.guest.name} · {b.guests} guests{b.occasion ? ` · ${b.occasion}` : ""}
                  <span className="block text-ink-soft">{b.villaName}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatINR(b.earnings.share)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No upcoming stays yet">New bookings appear here as soon as they&apos;re confirmed.</Empty>
        )}
      </Card>
    </>
  );
}

export default function DashboardPage() {
  const me = useMe();
  return me.role === "owner" ? <OwnerDashboard /> : <StaffDashboard />;
}
