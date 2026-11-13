import { env } from "../config/env.js";

/**
 * The website caches every API response under the "cms" tag. After any content change we ask it to
 * drop that cache, so the next visit to each page renders the new content. Saves made in quick
 * succession are batched into one call.
 */
let timer: NodeJS.Timeout | undefined;

export function revalidateSite() {
  if (!env.REVALIDATE_SECRET) return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const res = await fetch(`${env.SITE_URL}/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-revalidate-secret": env.REVALIDATE_SECRET },
        body: JSON.stringify({ tags: ["cms"] }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) console.warn(`[revalidate] website answered ${res.status}`);
    } catch (err) {
      console.warn("[revalidate] website not reachable:", (err as Error).message);
    }
  }, 1500);
}
