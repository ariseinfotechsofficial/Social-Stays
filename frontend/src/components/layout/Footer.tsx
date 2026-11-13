import { EnvelopeIcon, InstagramLogoIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { LogoBadge } from "@/components/brand/Logo";
import { CallLink, WhatsAppLink } from "@/components/layout/ContactLinks";
import { fill, getContent } from "@/lib/content";

export async function Footer() {
  const c = await getContent();
  const { contact, social, footer, brand } = c.settings;
  const columns = footer.columns.map((col) => ({
    title: col.title,
    links:
      col.auto === "destinations"
        ? c.destinations.map((d) => ({ label: d.name, href: `/destinations/${d.slug}` }))
        : col.auto === "policies"
          ? c.policies.map((p) => ({ label: p.title, href: `/policies/${p.slug}` }))
          : col.links,
  }));

  return (
    <footer className="border-t border-sand/10 bg-ink text-sand">
      <div className="container-page pt-14 pb-8 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] lg:gap-14">
          <div className="max-w-sm">
            <LogoBadge photo={brand.badge} />
            {footer.blurb && <p className="mt-5 leading-relaxed text-sand/75">{footer.blurb}</p>}
            <ul className="mt-6 space-y-2.5 text-[0.9375rem]">
              <li>
                <WhatsAppLink placement="footer" className="inline-flex items-center gap-3 hover:text-white">
                  <WhatsappLogoIcon className="size-5 text-brass" /> Chat on WhatsApp
                </WhatsAppLink>
              </li>
              {contact.phoneDisplay && (
                <li>
                  <CallLink placement="footer" className="inline-flex items-center gap-3 hover:text-white">
                    <PhoneIcon className="size-5 text-brass" /> {contact.phoneDisplay}
                  </CallLink>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-3 hover:text-white">
                    <EnvelopeIcon className="size-5 text-brass" /> {contact.email}
                  </a>
                </li>
              )}
              {social.instagramUrl && (
                <li>
                  <a href={social.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 hover:text-white">
                    <InstagramLogoIcon className="size-5 text-brass" /> @{social.instagramHandle}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="font-sans text-[0.8125rem] font-semibold tracking-[0.01em] text-brass">{col.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={`${l.href}-${l.label}`}>
                      <Link href={l.href} className="text-[0.9375rem] text-sand/85 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-sand/15 pt-6 text-[0.8125rem] text-sand/65 md:flex-row md:items-center md:justify-between">
          <p>{fill(footer.copyright || `© {year} ${brand.name}`, { year: new Date().getFullYear() })}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {c.policies.map((p) => (
              <li key={p.slug}>
                <Link href={`/policies/${p.slug}`} className="hover:text-white">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
