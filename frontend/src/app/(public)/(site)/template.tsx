import { ViewTransition } from "react";

/** Templates remount on every navigation, so the page content fades out and rises in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
