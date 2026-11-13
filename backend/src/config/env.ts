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
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  MAIL_FROM: z.string().default("Social Stays <bookings@socialstays.in>"),
  SEED_ADMIN_EMAIL: z.string().default("admin@socialstays.in"),
  SEED_ADMIN_PASSWORD: z.string().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:\n", z.prettifyError(parsed.error));
  process.exit(1);
}

const trim = (url: string) => url.replace(/\/+$/, "");

export const env = {
  ...parsed.data,
  PUBLIC_URL: trim(parsed.data.PUBLIC_URL),
  SITE_URL: trim(parsed.data.SITE_URL),
  ADMIN_URL: trim(parsed.data.ADMIN_URL),
  isProd: parsed.data.NODE_ENV === "production",
  uploadsDir: path.resolve(parsed.data.UPLOADS_DIR),
  /** Photos shipped with the code (seed library); served under /uploads as a fallback so they survive disk wipes */
  seedAssetsDir: path.resolve(import.meta.dirname, "../../seed-assets"),
  corsOrigins: [parsed.data.SITE_URL, parsed.data.ADMIN_URL, ...parsed.data.CORS_ORIGINS.split(",")]
    .map((o) => trim(o.trim()))
    .filter(Boolean),
  razorpayEnabled: Boolean(parsed.data.RAZORPAY_KEY_ID && parsed.data.RAZORPAY_KEY_SECRET),
  smtpEnabled: Boolean(parsed.data.SMTP_HOST),
};
