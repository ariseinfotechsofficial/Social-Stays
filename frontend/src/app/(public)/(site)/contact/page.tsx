import { EnvelopeIcon, InstagramLogoIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { CallLink, WhatsAppLink } from "@/components/layout/ContactLinks";
import { MapEmbed } from "@/components/shared/MapEmbed";
import { PageHeader } from "@/components/shared/PageHeader";
import { getContent, getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return buildMetadata(c, getPage(c, "contact").seo, { path: "/contact", title: `Contact ${c.settings.brand.name}` });
}

export default async function ContactPage() {
  const c = await getContent();
  const page = getPage(c, "contact");
  const { contact, social, address } = c.settings;
  const header = page.section("header");
  const ch = page.section("channels");
  const form = page.section("form");
  const office = page.section("office");

  const channels = ch
    ? [
        { icon: WhatsappLogoIcon, label: ch.text("whatsappLabel", "WhatsApp"), value: ch.text("whatsappValue"), kind: "whatsapp" as const, show: Boolean(contact.whatsappNumber) },
        { icon: PhoneIcon, label: ch.text("callLabel", "Call"), value: contact.phoneDisplay, kind: "call" as const, show: Boolean(contact.phoneDisplay) },
        { icon: EnvelopeIcon, label: ch.text("emailLabel", "Email"), value: contact.email, href: `mailto:${contact.email}`, show: Boolean(contact.email) },
        { icon: InstagramLogoIcon, label: ch.text("instagramLabel", "Instagram"), value: `@${social.instagramHandle}`, href: social.instagramUrl, show: Boolean(social.instagramUrl) },
      ].filter((x) => x.show)
    : [];

  return (
    <>
      {header && <PageHeader crumbs={[{ label: "Contact", href: "/contact" }]} title={header.text("title")} intro={header.text("intro")} />}

      {(channels.length > 0 || form) && (
        <section className="container-page grid gap-10 pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16 lg:pb-20">
          {channels.length > 0 && (
            <ul className="border-t border-line">
              {channels.map((item) => {
                const inner = (
                  <>
                    <item.icon aria-hidden weight="light" className="size-7 shrink-0 text-gold" />
                    <span className="flex-1">
                      <span className="block font-display text-[1.375rem] leading-tight font-medium">{item.label}</span>
                      <span className="text-ink-soft">{item.value}</span>
                    </span>
                  </>
                );
                const cls = "flex items-center gap-4 border-b border-line py-4 transition-colors hover:bg-sand/60 sm:px-2";
                return (
                  <li key={item.label}>
                    {item.kind === "whatsapp" ? (
                      <WhatsAppLink placement="contact_page" className={cls}>
                        {inner}
                      </WhatsAppLink>
                    ) : item.kind === "call" ? (
                      <CallLink placement="contact_page" className={cls}>
                        {inner}
                      </CallLink>
                    ) : (
                      <a href={item.href} className={cls} {...(item.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {inner}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {form && (
            <div className="self-start overflow-hidden rounded-[8px] border border-line pb-4">
              <div className="px-5 pt-6 pb-2">
                <h2 className="type-display-m">{form.text("title")}</h2>
                {form.text("intro") && <p className="mt-1 text-[0.9375rem] text-ink-soft">{form.text("intro")}</p>}
              </div>
              <EnquiryForm placement="contact_page" />
            </div>
          )}
        </section>
      )}

      {office && (
        <section className="container-page pb-16 lg:pb-24">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="type-display-m">{office.text("title")}</h2>
            {office.text("note") && <p className="text-ink-soft">{office.text("note")}</p>}
          </div>
          <MapEmbed lat={address.lat} lng={address.lng} zoom={office.num("zoom", 13)} title={`${c.settings.brand.name} office in ${address.locality}`} className="mt-5 aspect-[16/9] w-full lg:aspect-[3/1]" />
        </section>
      )}
    </>
  );
}
