# Social Stays API

Express 5 + TypeScript + Mongoose (MongoDB Atlas). Serves the website's content, stores enquiries and owner leads, and powers the admin panel (served by the website at `/admin`), including the internal availability calendar and owner listing requests. There is no online booking or payment: guests enquire on WhatsApp.

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
| `npm run seed -- --force` | Resets seeded content to the original copy (users and leads untouched). |
| `npm run seed -- --demo` | Also creates a demo owner (`owner@socialstays.in` / `owner-demo-2026`) for Amaltas House. Delete it before launch. |
| `npm run backup` / `backup:prod` | Writes every collection to `backups/<date>/` (keeps 14). |
| `npm run restore -- backups/<folder>` | Replaces the database with a backup. |

## Environment

See [.env.example](.env.example). The important ones:

| Variable | |
| --- | --- |
| `MONGODB_URI` | Atlas connection string, database `Social_Stays` |
| `JWT_SECRET` | Long random string; changing it signs everyone out |
| `PUBLIC_URL` | This API's public address (photo URLs) |
| `SITE_URL`, `ADMIN_URL`, `CORS_ORIGINS` | Allowed browser origins; `SITE_URL` also receives revalidation calls |
| `REVALIDATE_SECRET` | Shared with the website; lets admin saves refresh cached pages |
| `UPLOADS_DIR` | Where uploaded photos are written. On a VPS, a backed-up folder outside the code |

## How it's organised

```
src/
  app.ts, server.ts               Express app, startup
  config/env.ts                   validated environment
  content/registry.ts             every editable page section and its fields (drives the admin page editor)
  models/                         catalog (villas, destinations…), content, settings, users, leads, calendar (date blocks, listing requests)
  routes/public/                  /api/public: content bundle, enquiries, owner leads
  routes/admin/                   /api/admin: CRUD for everything, calendar, listing requests, dashboard
  routes/owner.ts                 /api/owner: owners' villas and listing edit requests
  services/                       availability (date-block night locks), dates
  seed/                           original content + seed/data, photos in ../seed-assets/library
```

### Things worth knowing

- **No overlapping blocks.** Every blocked night is a `VillaNight` document with a unique `{villa, date}` index. Claims are all-or-nothing.
- **Dates are calendar days.** Stored as UTC midnight; "today" is today in India (`services/dates.ts`).
- **One content cache.** The website caches `/api/public/content` under one tag. Any admin save calls `{SITE_URL}/api/revalidate` (batched), so pages refresh within seconds.
- **Roles.** `superadmin`, `editor`, `sales`, `owner`; permissions are listed in `src/lib/auth.ts` and mirrored in `frontend/src/admin/lib/session.tsx`.
- **Photos.** Uploads become WebP (max 2560px) with a blur placeholder. Seed photos are served from `seed-assets/` so they survive a wiped disk.
