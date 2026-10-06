import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root so a lockfile in a parent folder is never mistaken for a workspace root
  turbopack: { root: path.join(__dirname) },
  outputFileTracingRoot: path.join(__dirname),

  poweredByHeader: false,

  // Basic hardening from the brief (§6); the Google Maps embed is unaffected
  async headers() {
    return [
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
