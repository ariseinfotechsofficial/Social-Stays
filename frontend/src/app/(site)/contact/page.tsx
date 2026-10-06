import { EnvelopeIcon, InstagramLogoIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { CallLink, WhatsAppLink } from "@/components/layout/ContactLinks";
import { PageHeader } from "@/components/shared/PageHeader";
import { MapEmbed } from "@/components/shared/MapEmbed";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Social Stays",
  description: `WhatsApp, call or email the Social Stays team in Indore. ${site.replyHours}`,
  alternates: { canonical: "/contact" },
};

const channels = [
  { icon: WhatsappLogoIcon, label: "WhatsApp", value: "Fastest for bookings", kind: "whatsapp" as const },
  { icon: PhoneIcon, label: "Call", value: site.phone.display, kind: "call" as const },
  { icon: EnvelopeIcon, label: "Email", value: site.email, href: `mailto:${site.email}` },
  { icon: InstagramLogoIcon, label: "Instagram", value: `@${site.instagram.handle}`, href: site.instagram.url },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Contact", href: "/contact" }]}
        title="Talk to us"
        intro={`${site.replyHours} Calls are welcome from 10 am to 7 pm.`}
      />

      <section className="container-page grid gap-10 pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16 lg:pb-20">
        <ul className="border-t border-line">
          {channels.map((c) => {
            const inner = (
              <>
                <c.icon aria-hidden weight="light" className="size-7 shrink-0 text-gold" />
                <span className="flex-1">
                  <span className="block font-display text-[1.375rem] leading-tight font-medium">{c.label}</span>
                  <span className="text-ink-soft">{c.value}</span>
                </span>
              </>
            );
            const cls = "flex items-center gap-4 border-b border-line py-4 transition-colors hover:bg-sand/60 sm:px-2";
            return (
              <li key={c.label}>
                {c.kind === "whatsapp" ? (
                  <WhatsAppLink placement="contact_page" className={cls}>
                    {inner}
                  </WhatsAppLink>
                ) : c.kind === "call" ? (
                  <CallLink placement="contact_page" className={cls}>
                    {inner}
                  </CallLink>
                ) : (
                  <a href={c.href} className={cls} {...(c.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {inner}
                  </a>
                )}
              </li>
            );
          })}
        </ul>

        <div className="rounded-[8px] border border-line">
          <div className="px-5 pt-6 pb-2">
            <h2 className="type-display-m">Check availability</h2>
            <p className="mt-1 text-[0.9375rem] text-ink-soft">The form opens WhatsApp with your details filled in.</p>
          </div>
          <EnquiryForm placement="contact_page" />
        </div>
      </section>

      <section className="container-page pb-16 lg:pb-24">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="type-display-m">Our office</h2>
          <p className="text-ink-soft">
            {site.address.locality}, {site.address.region}. Visits by appointment.
          </p>
        </div>
        <MapEmbed lat={site.office.lat} lng={site.office.lng} zoom={13} title="Social Stays office in Indore" className="mt-5 aspect-[16/9] w-full lg:aspect-[3/1]" />
      </section>
    </>
  );
}
