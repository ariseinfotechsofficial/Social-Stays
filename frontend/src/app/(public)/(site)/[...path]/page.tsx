import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getContent } from "@/lib/content";

/**
 * Catches every URL no other page matches and applies the redirects managed in
 * Settings → Redirects (old links, retired villas). Anything else is a 404.
 */
export default async function CatchAll({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const from = `/${path.map(decodeURIComponent).join("/")}`.replace(/\/+$/, "").toLowerCase();
  const { redirects } = await getContent();
  const match = redirects.find((r) => r.from.replace(/\/+$/, "").toLowerCase() === from);
  if (match) (match.permanent ? permanentRedirect : redirect)(match.to);
  notFound();
}
