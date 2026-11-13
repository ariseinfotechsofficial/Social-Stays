import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./lib/http.js";
import { adminRouter } from "./routes/admin/index.js";
import { authRouter } from "./routes/auth.js";
import { ownerRouter } from "./routes/owner.js";
import { bookingPublicRouter } from "./routes/public/bookings.js";
import { publicRouter } from "./routes/public/index.js";
import { webhooksRouter } from "./routes/webhooks.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  // Render, Railway and Nginx all sit in front of the app; trust one proxy hop for client IPs
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // Photos are loaded by the website and admin from other origins
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin.replace(/\/+$/, ""))),
      credentials: true,
    }),
  );

  // Razorpay webhooks need the raw body for signature checks, so they are mounted before JSON parsing
  app.use("/api/webhooks", express.raw({ type: "application/json", limit: "1mb" }), webhooksRouter);

  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  // Uploaded photos first, then the committed seed library as a fallback
  const staticOpts = { maxAge: "365d", immutable: true, index: false as const };
  app.use("/uploads", express.static(env.uploadsDir, staticOpts), express.static(env.seedAssetsDir, staticOpts));

  app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.use("/api/auth", authRouter);
  app.use("/api/public", publicRouter, bookingPublicRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/owner", ownerRouter);

  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
  app.use(errorHandler);
  return app;
}
