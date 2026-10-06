"use client";

import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentProps, ReactNode } from "react";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";
import { quickWhatsAppText, whatsappUrl } from "@/lib/whatsapp";

/** tel: link that records a call_click conversion. */
export function CallLink({ placement, children, ...props }: { placement: string; children: ReactNode } & ComponentProps<"a">) {
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
  children,
  ...props
}: { placement: string; message?: string; children: ReactNode } & ComponentProps<"a">) {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.currentTarget.href = whatsappUrl(quickWhatsAppText(message));
        track("whatsapp_click", { placement });
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export { WhatsappLogoIcon };
