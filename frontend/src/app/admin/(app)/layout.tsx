"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shell } from "@admin/components/shell/Shell";
import { Loading } from "@admin/components/ui/feedback";
import { ApiError } from "@admin/lib/api";
import { SessionProvider, useMeQuery } from "@admin/lib/session";

/** Everything behind the login. Sends signed-out visitors to /login. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  const router = useRouter();
  const { data: me, error, isLoading } = useMeQuery();

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      router.replace(`/admin/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [error, router]);

  if (isLoading || (error instanceof ApiError && error.status === 401)) {
    return (
      <div className="grid min-h-svh place-items-center">
        <Loading label="Signing you in" />
      </div>
    );
  }
  if (error || !me) {
    return (
      <div className="grid min-h-svh place-items-center px-6 text-center">
        <div>
          <p className="type-title">Can&apos;t reach the server</p>
          <p className="mt-2 text-ink-soft">{error?.message ?? "Please try again."}</p>
          <button type="button" className="mt-5 font-semibold text-gold-deep underline" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider me={me}>
      <Shell>{children}</Shell>
    </SessionProvider>
  );
}
