"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { NoAccess } from "@admin/components/NoAccess";
import { Card, Loading } from "@admin/components/ui/feedback";
import { PageHeader, Pagination, Table, tdClass } from "@admin/components/ui/layout";
import { api, type ListResponse } from "@admin/lib/api";
import { useCan } from "@admin/lib/session";
import { activityText, dateTime } from "@admin/lib/utils";

type Activity = { _id: string; userName?: string; action: string; entity: string; label?: string; createdAt: string };

export default function ActivityPage() {
  const can = useCan();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ["activity", page], queryFn: () => api<ListResponse<Activity>>("/admin/activity", { query: { page, limit: 50 } }), enabled: can("activity") });
  if (!can("activity")) return <NoAccess />;
  return (
    <>
      <PageHeader title="Activity log" description="Who changed what, and when. Kept for a year." />
      <Card padded={false}>
        {isLoading ? (
          <Loading />
        ) : (
          <Table head={["When", "Who", "What"]}>
            {data?.items.map((a) => (
              <tr key={a._id}>
                <td className={`${tdClass} whitespace-nowrap text-ink-soft`}>{dateTime(a.createdAt)}</td>
                <td className={`${tdClass} font-semibold`}>{a.userName ?? "System"}</td>
                <td className={tdClass}>
                  {activityText(a)}
                  {a.label && <span className="text-ink-soft"> · {a.label}</span>}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && <Pagination page={page} limit={50} total={data.total} onChange={setPage} />}
      </Card>
    </>
  );
}
