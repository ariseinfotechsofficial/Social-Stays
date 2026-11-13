# Deploying on Hostinger (socialstays.in)

The live site runs on Hostinger shared hosting as **one Node.js app** (LiteSpeed `lsnode`):
the website, the admin at `/admin` and the API at `/api` all share `https://socialstays.in`.
`server.cjs` routes `/api/*` and `/uploads/*` to Express and everything else to Next.js.
Hostinger's CDN sits in front and already points the domain (and `www`, redirected to the bare domain) at the server.

## Deploy an update

1. Push to `main` on GitHub (the repo is public, so the server clones it without keys).
2. On the server:

   ```bash
   ssh -p 65002 u365735344@145.79.210.89
   bash ~/domains/socialstays.in/current/deploy/hostinger/deploy.sh
   ```

   It clones `main` into `releases/<stamp>`, installs, builds (with a temporary API, because pages are
   pre-rendered from it), switches `current` to the new release, restarts the app and checks it answers.
   A failed build leaves the live site untouched. Takes about 5–10 minutes.

**Rollback:** `ln -sfn ~/domains/socialstays.in/releases/<older> ~/domains/socialstays.in/current && pkill -f "^lsnode:"`
(the last 3 releases are kept).

## Server layout

```
~/domains/socialstays.in/
  public_html/.htaccess   Passenger directives pointing LiteSpeed at current/ (written by deploy.sh)
  current -> releases/<stamp>
  releases/               the last 3 builds
  shared/
    backend.env           backend secrets  (linked as backend/.env)
    frontend.env          website env      (linked as frontend/.env.production.local)
    uploads/              photos uploaded in the admin (UPLOADS_DIR)
    backups/
    logs/app.log          the app's log; build-api.log is the temporary build API
```

`shared/backend.env` uses the variables in `backend/.env.example` with `PUBLIC_URL`, `SITE_URL` and `ADMIN_URL`
set to `https://socialstays.in`, `CORS_ORIGINS=https://www.socialstays.in` and `UPLOADS_DIR` pointing at `shared/uploads`.
`shared/frontend.env` holds `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` (both `https://socialstays.in`) and the
same `REVALIDATE_SECRET` as the backend. Edit them on the server, then re-run `deploy.sh`
(`NEXT_PUBLIC_*` values are built into the site) or just restart with `pkill -f "^lsnode:"` for backend-only changes.

## Notes

- Node 22 comes from `/opt/alt/alt-nodejs22`; there is no global `node` on the PATH.
- The app restarts on the next request after `pkill -f "^lsnode:"`; LiteSpeed starts it on demand.
- MongoDB Atlas must allow the server's outbound IP, `145.79.210.89`.
- HTML pages are sent with `max-age=0` so the CDN never serves a stale page after an admin edit.
