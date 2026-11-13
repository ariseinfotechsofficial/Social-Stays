# Social Stays API

Express 5 + TypeScript + Mongoose (MongoDB Atlas). Serves the website's content, stores enquiries and owner leads, runs online booking with Razorpay, and powers the admin panel (served by the website at `/admin`) and owner dashboard.

## Run it

```bash
npm install
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, REVALIDATE_SECRET…
npm run seed              # loads the original site content + photo library (safe to re-run)
npm run dev               # http://localhost:4000, restarts on changes
npm run build && npm start
```

| Script | |
| --- | --- |
| `npm run seed` | Adds anything missing. Never overwrites edits made in the admin. |
| `npm run seed -- --force` | Resets seeded content to the original copy (users, bookings and leads untouched). |
| `npm run seed -- --demo` | Also creates a demo owner (`owner@socialstays.in` / `owner-demo-2026`) for Amaltas House. Delete it before launch. |
| `npm run backup` / `backup:prod` | Writes every collection to `backups/<date>/` (keeps 14). |
| `npm run restore -- backups/<folder>` | Replaces the database with a backup. |

## Environment

See [.env.example](.env.example). The important ones:

| Variable | |
| --- | --- |
| `MONGODB_URI` | Atlas connection string, database `Social_Stays` |
| `JWT_SECRET` | Long random string; changing it signs everyone out |
| `PUBLIC_URL` | This API's public address (photo URLs, webhooks) |
| `SITE_URL`, `ADMIN_URL`, `CORS_ORIGINS` | Allowed browser origins; `SITE_URL` also receives revalidation calls and is used in email links |
| `REVALIDATE_SECRET` | Shared with the website; lets admin saves refresh cached pages |
| `UPLOADS_DIR` | Where uploaded photos are written. On a VPS, a backed-up folder outside the code |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Online payment. Without them the website stays in WhatsApp-enquiry mode |
| `SMTP_*`, `MAIL_FROM` | Guest emails. Without them, emails are logged to the console instead |

### Razorpay

1. Add the test keys, then the live keys at launch.
2. In the Razorpay Dashboard → Webhooks, add `{PUBLIC_URL}/api/webhooks/razorpay` with events `payment.captured`, `order.paid`, `refund.processed`, `refund.failed`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`. The webhook catches payments whose browser never came back to the site.

## How it's organised

```
src/
  app.ts, server.ts, jobs.ts      Express app, startup, housekeeping (expiring holds, completing stays)
  config/env.ts                   validated environment
  content/registry.ts             every editable page section and its fields (drives the admin page editor)
  models/                         catalog (villas, destinations…), content, settings, users, leads, booking
  routes/public/                  /api/public: content bundle, enquiries, owner leads, quotes, bookings
  routes/admin/                   /api/admin: CRUD for everything, bookings, calendar, payouts, dashboard
  routes/owner.ts                 /api/owner: owner dashboard, scoped to their villas
  routes/webhooks.ts              Razorpay
  services/                       pricing, availability (night locks), bookings, dates
  seed/                           original content + seed/data, photos in ../seed-assets/library
```

### Things worth knowing

- **No double bookings.** Every booked, held or blocked night is a `VillaNight` document with a unique `{villa, date}` index. Claims are all-or-nothing; unpaid holds carry a TTL.
- **Dates are calendar days.** Stored as UTC midnight; "today" is today in India (`services/dates.ts`).
- **Payments are idempotent.** The browser callback and the webhook may both report a payment; it's claimed atomically and counted once. A payment that lands after its hold lapsed re-checks the dates and refunds automatically if they're gone.
- **One content cache.** The website caches `/api/public/content` under one tag. Any admin save calls `{SITE_URL}/api/revalidate` (batched), so pages refresh within seconds.
- **Roles.** `superadmin`, `editor`, `sales`, `owner`; permissions are listed in `src/lib/auth.ts` and mirrored in `frontend/src/admin/lib/session.tsx`.
- **Photos.** Uploads become WebP (max 2560px) with a blur placeholder. Seed photos are served from `seed-assets/` so they survive a wiped disk.
