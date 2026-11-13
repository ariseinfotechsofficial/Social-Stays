"use client";

import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentProps, ReactNode } from "react";
import { useSite } from "@/components/layout/SiteProvider";
import { track } from "@/lib/analytics";
import { quickWhatsAppText, whatsappUrl } from "@/lib/whatsapp";

/** tel: link that records a call_click conversion. */
export function CallLink({ placement, children, ...props }: { placement: string; children: ReactNode } & ComponentProps<"a">) {
  const site = useSite();
  return (
    <a href={site.phone.href} onClick={() => track("call_click", { placement })} {...props}>
      {children}
    </a>
  );
}

/** Plain "chat on WhatsApp" link; adds source + page to the message at click time. */
export function WhatsAppLink({
  placement,
  message,
  number,
  children,
  ...props
}: { placement: string; message?: string; /** Overrides the site number (per-villa WhatsApp) */ number?: string; children: ReactNode } & ComponentProps<"a">) {
  const site = useSite();
  const to = number || site.whatsappNumber;
  return (
    <a
      href={whatsappUrl(to)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.currentTarget.href = whatsappUrl(to, quickWhatsAppText(message || site.defaultWhatsappMessage));
        track("whatsapp_click", { placement });
      }}
      {...props}
    >
      {children}
    </a>
  );
}

/** Plain email link from settings */
export function EmailLink({ children, ...props }: { children?: ReactNode } & ComponentProps<"a">) {
  const site = useSite();
  return (
    <a href={`mailto:${site.email}`} {...props}>
      {children ?? site.email}
    </a>
  );
}

export { WhatsappLogoIcon };
