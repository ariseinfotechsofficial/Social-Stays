import { EnvelopeIcon, InstagramLogoIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { CallLink, WhatsAppLink } from "@/components/layout/ContactLinks";
import { destinations } from "@/data/destinations";
import { policies } from "@/data/policies";
import { site } from "@/lib/site";

const columns = [
  {
    title: "Destinations",
    links: destinations.map((d) => ({ label: d.name, href: `/destinations/${d.slug}` })),
  },
  {
    title: "Stay with us",
    links: [
      { label: "All villas", href: "/villas" },
      { label: "Experiences", href: "/experiences" },
      { label: "Celebrations", href: "/celebrations" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "List your villa", href: "/owners" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-sand/10 bg-ink text-sand">
      <div className="container-page pt-14 pb-8 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] lg:gap-14">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <LogoMark className="w-9 text-brass" />
              <span className="font-display text-2xl font-medium tracking-[0.14em] uppercase">Social Stays</span>
            </div>
            <p className="mt-5 leading-relaxed text-sand/75">
              Private villas and farmhouses around Indore, hosted by the families who own them.
            </p>
            <ul className="mt-6 space-y-2.5 text-[0.9375rem]">
              <li>
                <WhatsAppLink placement="footer" className="inline-flex items-center gap-3 hover:text-white">
                  <WhatsappLogoIcon className="size-5 text-brass" /> Chat on WhatsApp
                </WhatsAppLink>
              </li>
              <li>
                <CallLink placement="footer" className="inline-flex items-center gap-3 hover:text-white">
                  <PhoneIcon className="size-5 text-brass" /> {site.phone.display}
                </CallLink>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="inline-flex items-center gap-3 hover:text-white">
                  <EnvelopeIcon className="size-5 text-brass" /> {site.email}
                </a>
              </li>
              <li>
                <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 hover:text-white">
                  <InstagramLogoIcon className="size-5 text-brass" /> @{site.instagram.handle}
                </a>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="font-sans text-[0.8125rem] font-semibold tracking-[0.01em] text-brass">{col.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
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
          <p>© {new Date().getFullYear()} Social Stays, Indore. All villas are privately owned.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {policies.map((p) => (
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
