/**
 * Calls the backend directly at NEXT_PUBLIC_API_URL (e.g. https://api.socialstays.in), with the session cookie.
 * Not through the website's /api rewrite: Hostinger's CDN in front of the API rejects browser requests that
 * Vercel forwards (429). Without NEXT_PUBLIC_API_URL the /api rewrite on the same origin is used.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

/** Uploaded photos are stored as "/uploads/…"; point them at the backend too. */
export const mediaUrl = (src?: string | null) => (src && src.startsWith("/uploads/") ? `${API_BASE}${src}` : (src ?? ""));


export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]> | { usedIn?: string[] },
  ) {
    super(message);
  }
}

type Options = Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit; query?: Record<string, string | number | boolean | undefined | null> };

export function withQuery(path: string, query?: Options["query"]) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  const qs = params.toString();
  return qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path;
}

export async function api<T = unknown>(path: string, { json, query, headers, ...init }: Options = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api${withQuery(path, query)}`, {
    credentials: "include",
    ...init,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* not JSON (e.g. an HTML error page from a proxy) */
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/")) {
      window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
    throw new ApiError(res.status, (data.error as string) ?? (res.status >= 500 ? "The server had a problem. Try again in a moment." : "Something went wrong"), data.details as ApiError["details"]);
  }
  return data as T;
}

export type ListResponse<T> = { items: T[]; total: number; page?: number; limit?: number; counts?: Record<string, number> };

/** Field errors from a 422 as { field: message } */
export const fieldErrors = (err: unknown): Record<string, string> =>
  err instanceof ApiError && err.details && !("usedIn" in err.details)
    ? Object.fromEntries(Object.entries(err.details as Record<string, string[]>).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]))
    : {};
