import { PhoneIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { CallLink } from "@/components/layout/ContactLinks";
import { getContent } from "@/lib/content";

/** Ad landing layout: logo and a call button only, so nothing pulls visitors away from the enquiry. */
export default async function LandingLayout({ children }: LayoutProps<"/">) {
  const { policies, settings } = await getContent();
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="container-page flex h-20 items-center justify-between">
          <Logo tone="light" preload />
          {settings.contact.phoneDisplay && (
            <CallLink placement="landing_header" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/50 px-4 text-[0.9375rem] font-semibold text-white">
              <PhoneIcon className="size-[1.1rem]" />
              <span className="hidden sm:inline">{settings.contact.phoneDisplay}</span>
              <span className="sm:hidden">Call</span>
            </CallLink>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-line py-10 pb-28 text-[0.8125rem] text-ink-soft lg:pb-10">
        <div className="container-page flex flex-col gap-4 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.brand.name}, {settings.address.locality}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {policies.map((p) => (
              <li key={p.slug}>
                <Link href={`/policies/${p.slug}`} className="hover:text-ink">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </>
  );
}
