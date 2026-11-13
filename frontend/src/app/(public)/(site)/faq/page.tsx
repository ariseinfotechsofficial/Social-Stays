import type { Metadata } from "next";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { FaqList } from "@/components/shared/FaqList";
import { JsonLd } from "@/components/shared/JsonLd";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { getContent, getPage, labels } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return buildMetadata(c, getPage(c, "faq").seo, { path: "/faq", title: "FAQ: booking, payments and stays" });
}

export default async function FaqPage() {
  const c = await getContent();
  const { faqGroups } = c;
  const header = labels(c, "faq", "header");
  const sidebar = getPage(c, "faq").section("sidebar");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqGroups.flatMap((g) => g.items).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <PageHeader crumbs={[{ label: "FAQ", href: "/faq" }]} title={header.text("title")} intro={header.text("intro")} />

      <section className="container-page grid gap-8 pb-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:pb-24">
        <nav aria-label="FAQ sections" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:block lg:space-y-1 lg:px-0">
            {faqGroups.map((g) => (
              <li key={g.id}>
                <a href={`#${g.id}`} className="block rounded-full border border-line px-4 py-2 text-[0.9375rem] font-medium whitespace-nowrap hover:border-ink lg:rounded-none lg:border-0 lg:px-0 lg:py-1.5 lg:hover:text-gold">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
          {sidebar && (
            <div className="mt-8 hidden rounded-[6px] bg-sand p-5 lg:block">
              <p className="font-display text-[1.375rem] font-medium">{sidebar.text("title")}</p>
              <p className="mt-2 text-[0.9375rem] text-ink-soft">{sidebar.text("body")}</p>
              <WhatsAppLink placement="faq_sidebar" className={buttonClasses("primary", "sm", "mt-4")}>
                {sidebar.text("buttonLabel", "Chat with us")}
              </WhatsAppLink>
            </div>
          )}
        </nav>
        <div className="space-y-11">
          {faqGroups.map((g) => (
            <section key={g.id} id={g.id} className="scroll-mt-28">
              <h2 className="type-display-m mb-3">{g.title}</h2>
              <FaqList items={g.items} />
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
