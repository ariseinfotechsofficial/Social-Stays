import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { getPolicy, policies } from "@/data/policies";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return {};
  return { title: policy.title, description: policy.summary, alternates: { canonical: `/policies/${policy.slug}` } };
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <article className="container-page pt-26 pb-16 lg:pt-30 lg:pb-24">
      <Breadcrumbs items={[{ label: policy.title, href: `/policies/${policy.slug}` }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Policies" className="order-2 lg:order-1">
          <ul className="space-y-2 border-t border-line pt-6 lg:sticky lg:top-28">
            {policies.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/policies/${p.slug}`}
                  aria-current={p.slug === policy.slug ? "page" : undefined}
                  className={cn("text-[0.9375rem] hover:text-gold", p.slug === policy.slug ? "font-semibold text-ink" : "text-ink-soft")}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="order-1 max-w-[46rem] lg:order-2">
          <h1 className="type-display-l">{policy.title}</h1>
          <p className="type-lead mt-4 text-ink-soft">{policy.summary}</p>
          <p className="mt-3 text-[0.875rem] text-ink-soft">Last updated {policy.updated}</p>
          <div className="mt-8 space-y-8">
            {policy.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-[1.5rem] font-medium">{s.heading}</h2>
                <div className="mt-2.5 space-y-3 leading-relaxed text-ink-soft">
                  {s.body.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
