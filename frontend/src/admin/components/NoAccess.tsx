import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@admin/components/ui/button";
import { Empty } from "@admin/components/ui/feedback";

export function NoAccess() {
  return (
    <Empty icon={LockKeyIcon} title="You don't have access to this" action={<ButtonLink href="/admin">Back to dashboard</ButtonLink>}>
      Ask a Super Admin if you need it.
    </Empty>
  );
}
