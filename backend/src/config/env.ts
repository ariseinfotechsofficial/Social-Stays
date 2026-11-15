import path from "node:path";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  PUBLIC_URL: z.string().default("http://localhost:4000"),
  UPLOADS_DIR: z.string().default("./uploads"),
  SITE_URL: z.string().default("http://localhost:3000"),
  ADMIN_URL: z.string().default("http://localhost:3001"),
  /** Extra comma-separated origins allowed by CORS (preview deployments etc.) */
  CORS_ORIGINS: z.string().default(""),
  REVALIDATE_SECRET: z.string().default(""),
  /** Optional private address of the website for cache refreshes (defaults to SITE_URL) */
  REVALIDATE_URL: z.string().default(""),
  SEED_ADMIN_EMAIL: z.string().default("admin@socialstays.in"),
  SEED_ADMIN_PASSWORD: z.string().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:\n", z.prettifyError(parsed.error));
  process.exit(1);
}

const trim = (url: string) => url.replace(/\/+$/, "");

/** https://example.com and https://www.example.com, whichever one was configured */
const withWwwVariant = (origin: string) => {
  const m = /^(https?:\/\/)(www\.)?([^/]+)$/.exec(origin);
  if (!m || /^(localhost|\d+\.\d+\.\d+\.\d+)(:\d+)?$/.test(m[3])) return [origin];
  return [`${m[1]}${m[3]}`, `${m[1]}www.${m[3]}`];
};

/** The deployed backend folder; a redeploy replaces everything inside it */
const appRoot = path.resolve(import.meta.dirname, "../..");
const uploadsDir = path.resolve(parsed.data.UPLOADS_DIR);

export const env = {
  ...parsed.data,
  PUBLIC_URL: trim(parsed.data.PUBLIC_URL),
  SITE_URL: trim(parsed.data.SITE_URL),
  ADMIN_URL: trim(parsed.data.ADMIN_URL),
  isProd: parsed.data.NODE_ENV === "production",
  uploadsDir,
  /** True when uploads live inside the app folder, where the next redeploy deletes them */
  uploadsInsideApp: uploadsDir === appRoot || uploadsDir.startsWith(appRoot + path.sep),
  /** Photos shipped with the code (seed library); served under /uploads as a fallback so they survive disk wipes */
  seedAssetsDir: path.resolve(import.meta.dirname, "../../seed-assets"),
  // The site is reachable with and without "www", so both are allowed whichever is configured
  corsOrigins: [...new Set([parsed.data.SITE_URL, parsed.data.ADMIN_URL, ...parsed.data.CORS_ORIGINS.split(",")]
    .map((o) => trim(o.trim()))
    .filter(Boolean)
    .flatMap(withWwwVariant))],
};
