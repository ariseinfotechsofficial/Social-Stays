import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content";

/**
 * Called by the backend after every save in the admin. Drops the cached content so each page
 * renders fresh on its next visit. `expire: 0` means nobody is served the old version afterwards.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json({ ok: true, revalidated: [CONTENT_TAG], at: new Date().toISOString() });
}
