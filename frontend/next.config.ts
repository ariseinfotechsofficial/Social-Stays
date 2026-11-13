import path from "node:path";
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

/** Photos are served by the backend; allow its host (and any extra media hosts) for image optimisation. */
const mediaHosts = [process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", ...(process.env.EXTRA_IMAGE_HOSTS ?? "").split(",")]
  .map((u) => u.trim())
  .filter(Boolean)
  .map((u) => new URL(u));

const remotePatterns: RemotePattern[] = mediaHosts.map((u) => ({
  protocol: u.protocol.replace(":", "") as "http" | "https",
  hostname: u.hostname,
  ...(u.port ? { port: u.port } : {}),
  pathname: "/uploads/**",
}));

/** Where the server reaches the backend; the admin's /api and /uploads requests are proxied there */
const BACKEND_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

const localApi = mediaHosts.some((u) => ["localhost", "127.0.0.1", "::1"].includes(u.hostname));

const nextConfig: NextConfig = {
  // Pin the project root so a lockfile in a parent folder is never mistaken for a workspace root
  turbopack: { root: path.join(__dirname) },
  outputFileTracingRoot: path.join(__dirname),

  poweredByHeader: false,

  // Shared hosting caps processes per account: NEXT_BUILD_CPUS limits the build's worker processes there
  ...(process.env.NEXT_BUILD_CPUS ? { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } } : {}),

  images: {
    remotePatterns,
    qualities: [75],
    // Only for local development, where the backend runs on this machine
    dangerouslyAllowLocalIP: localApi,
  },

  // The admin (/admin) calls the backend through the site's own origin, so its login cookie is first-party.
  // These run after the app's own routes, so /api/revalidate still reaches this app.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/uploads/:path*", destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },

  // Basic hardening from the brief (§6); the Google Maps embed is unaffected
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
