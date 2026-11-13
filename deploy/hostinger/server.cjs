/**
 * Production entry for Hostinger (LiteSpeed "lsnode"): ONE Node process serves the whole domain.
 *
 *   /api/*, /uploads/*   -> Express backend   (except /api/revalidate, which belongs to Next.js)
 *   everything else      -> Next.js website + admin (/admin)
 *
 * Layout on the server (see deploy.sh):
 *   ~/domains/socialstays.in/current -> releases/<stamp>   (this file: current/deploy/hostinger/server.cjs)
 *   ~/domains/socialstays.in/shared/{backend.env,frontend.env,uploads,backups,logs}
 *
 * lsnode quirks this file works around:
 *   - it takes over the FIRST http.Server#listen() call (and ignores later ones), so the public
 *     server listens first and the private loopback server uses net.Server#listen directly;
 *   - stdout goes to /dev/null, so console output is appended to shared/logs/app.log.
 */
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

process.env.NODE_ENV = "production";

const ROOT = path.resolve(__dirname, "../..");
const BACKEND = path.join(ROOT, "backend");
const FRONTEND = path.join(ROOT, "frontend");
const SHARED = process.env.SS_SHARED_DIR || path.resolve(ROOT, "../../shared");

/* ---------- logging ---------- */
const LOG_FILE = path.join(SHARED, "logs", "app.log");
try {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  if (fs.statSync(LOG_FILE, { throwIfNoEntry: false })?.size > 10 * 1024 * 1024) fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
} catch {}
for (const level of ["log", "info", "warn", "error"]) {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    const line = `${new Date().toISOString()} ${level.toUpperCase()} [${process.pid}] ${args
      .map((a) => (a instanceof Error ? a.stack : typeof a === "string" ? a : JSON.stringify(a)))
      .join(" ")}\n`;
    try {
      fs.appendFileSync(LOG_FILE, line);
    } catch {}
    original(...args);
  };
}
process.on("uncaughtException", (err) => console.error("[uncaught]", err));
process.on("unhandledRejection", (err) => console.error("[unhandled rejection]", err));

/* ---------- env ---------- */
try {
  process.loadEnvFile(path.join(BACKEND, ".env"));
} catch (err) {
  console.error("[boot] could not read backend/.env:", err.message);
}

/* ---------- routing ---------- */
let ready; // Promise<{ api, handle }>

const isApiPath = (p) => (p === "/api" || p.startsWith("/api/") ? p !== "/api/revalidate" : p.startsWith("/uploads/"));

/** Hostinger's CDN sits in front: never let it hold HTML pages (admin edits must show at once). */
function keepPagesOffTheEdge(res) {
  const setHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) => {
    if (String(name).toLowerCase() === "cache-control" && /s-maxage|stale-while-revalidate/i.test(String(value))) {
      value = "public, max-age=0, must-revalidate";
    }
    return setHeader(name, value);
  };
}

async function route(req, res) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim().toLowerCase();
  if (host.startsWith("www.")) {
    res.writeHead(301, { Location: `https://${host.slice(4)}${req.url}` });
    return res.end();
  }

  let apps;
  try {
    apps = await ready;
  } catch {
    res.writeHead(503, { "Content-Type": "text/plain", "Retry-After": "10" });
    return res.end("Social Stays is starting up, please refresh in a few seconds.");
  }

  const pathname = (req.url || "/").split("?")[0];
  if (isApiPath(pathname)) return apps.api(req, res);
  if (!pathname.startsWith("/_next/static/")) keepPagesOffTheEdge(res);
  return apps.handle(req, res);
}

/* ---------- servers ---------- */
// 1) Public server first: lsnode takes over this listen() call and binds it to LiteSpeed's socket.
http.createServer(route).listen(process.env.PORT || 3000);

// 2) Private loopback server (random port) so Next.js can reach the API, and the API can
//    refresh Next.js's cache, without a round trip through the public CDN.
function listenPrivately() {
  const server = http.createServer(route);
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    net.Server.prototype.listen.call(server, 0, "127.0.0.1", () => resolve(net.Server.prototype.address.call(server).port));
  });
}

async function boot() {
  const started = Date.now();
  const port = await listenPrivately();
  const internalUrl = `http://127.0.0.1:${port}`;
  process.env.API_URL = internalUrl; // read by the website's server code (src/lib/content.ts)
  process.env.REVALIDATE_URL = internalUrl; // read by the backend (src/lib/revalidate.ts)

  const load = (rel) => import(pathToFileURL(path.join(BACKEND, "dist", rel)).href);
  const [{ createApp }, { connectDb }, { startJobs }] = await Promise.all([load("app.js"), load("db.js"), load("jobs.js")]);
  await connectDb();
  const api = createApp();
  startJobs();

  const next = require(require.resolve("next", { paths: [FRONTEND] }));
  const web = next({ dev: false, dir: FRONTEND });
  await web.prepare();
  const handle = web.getRequestHandler();

  console.info(`[boot] ready in ${Date.now() - started} ms (private port ${port}, node ${process.version})`);
  return { api, handle };
}

ready = boot();
ready.catch((err) => {
  console.error("[boot] failed:", err);
  // Exit so LiteSpeed starts a fresh process on the next request
  setTimeout(() => process.exit(1), 2000).unref();
});
