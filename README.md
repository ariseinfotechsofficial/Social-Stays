# Social Stays

Private villas and farmhouses around Indore, booked online or on WhatsApp. Two apps share one MongoDB database:

| Folder | What it is | Local URL |
| --- | --- | --- |
| [`backend/`](backend/README.md) | Express + MongoDB API: content, photos, enquiries, availability calendar, owners | http://localhost:4000 |
| [`frontend/`](frontend/README.md) | One Next.js app: the public website (pre-rendered from the API, refreshed when the admin saves) and the admin panel at [`/admin`](frontend/ADMIN.md) | http://localhost:3000 and http://localhost:3000/admin |

```
 Website (/) ──GET /api/public/content (cached)──►  Backend  ◄── /api proxy, same origin ── Admin (/admin)
    │      POST enquiries, owner leads, bookings   │  │
    │                                             MongoDB  uploads/
    └──◄── POST /api/revalidate after every admin save
```

## Run everything locally

```bash
# 1. API (needs backend/.env, see backend/.env.example)
cd backend && npm install && npm run seed && npm run dev

# 2. Website + admin (needs frontend/.env.local)
cd frontend && npm install && npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/admin for the admin. Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `backend/.env`, then change the password under My profile.

## Deploy

- **Testing:** backend on Render ([`render.yaml`](render.yaml)), website + admin on Vercel (Root Directory `frontend`).
- **Production (VPS):** PM2 + Nginx, see [`deploy/`](deploy). Set `UPLOADS_DIR` to a folder that is backed up, and run `npm run backup:prod` daily.

Deploy the backend first: the website builds its pages from the API.

## Docs

- [`docs/backend-admin-plan.md`](docs/backend-admin-plan.md): the agreed scope and decisions
- [`docs/Social-Stays-Website-Requirements.pdf`](docs/Social-Stays-Website-Requirements.pdf): the original brief
