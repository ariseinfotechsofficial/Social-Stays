# Social Stays: backend, admin panel and booking: build plan

Agreed 26 Oct 2026. Covers the requirements brief (`Social-Stays-Website-Requirements.pdf`), the client corrections, and the Phase 2 items the client chose to bring forward (availability, online booking with Razorpay, owner dashboard).

## Decisions

| Topic | Decision |
| --- | --- |
| Apps | `backend/` Express + TypeScript + Mongoose · `frontend/` the website, switched from mock files to the API, **with the admin inside it at `/admin`** (changed 27 Oct at the user's request: one app on port 3000; the admin keeps its own root layout and stylesheet) |
| Database | MongoDB Atlas, database `Social_Stays`. Every piece of current mock content is seeded. |
| Images | Stored on the backend server's disk (`UPLOADS_DIR`), served by the backend, optimised by Next.js on the site. Seed photos are committed with the backend so they survive Render restarts. |
| Hosting | Testing: backend on Render, website and admin on Vercel. Later: VPS. Everything is configured through env variables. |
| Admin access | Roles: Super Admin, Editor, Sales, Owner. Activity log of every change. |
| Page content | Every section's text, images, CTAs and featured items is editable, and sections can be hidden or reordered. The design itself stays fixed. |
| Enquiries | Saved to the database in the background; WhatsApp still opens instantly. Lead notifications appear in the admin only. |
| Booking | Per villa: instant book or request to book. The admin chooses the payment mode (advance %, full, or guest's choice) globally with a per-villa override. Razorpay. |
| Pricing | Weekday/weekend rates, seasonal and special-date prices, extra-guest charges, GST, coupons |
| Guests | No accounts. Confirmation email (SMTP optional) plus a private booking page (reference + phone). |
| Owners | Owner role in the admin app: bookings, blocking dates, earnings and payouts, listing edit requests (approved by an admin). Commission % per villa; payouts made manually and marked paid. |
| Cancellations | Guest requests from the booking page, the policy suggests a refund, an admin approves, and the refund goes through the Razorpay API |

## Architecture

```
 Website (Next.js, static + on-demand revalidation)      Admin (Next.js)
        │  GET /api/public/*  (cached, tagged)                 │  /api/* rewrite → backend (same-origin cookie)
        │  POST enquiries, owner leads, bookings               │
        └──────────────────────► Backend (Express) ◄───────────┘
                                   │   │
                       MongoDB Atlas   uploads/ (disk)   Razorpay   SMTP
                                   │
                    after every admin save → POST {SITE_URL}/api/revalidate {tags}
```

- **Fast public site.** Pages stay pre-rendered. Every fetch is tagged (`villas`, `villa:<slug>`, `settings`, `page:home`, …). When the admin saves, the backend calls the website's `/api/revalidate` with the tags that changed, so the page updates on the next visit. A one-hour time-based refresh is kept as a safety net.
- **Admin auth.** JWT in an httpOnly cookie. The admin app proxies `/api/*` to the backend, so the cookie stays first-party on every host. Images are resized in the browser before upload, so large camera files never hit request-size limits.
- **No double bookings.** One `VillaNight` document per villa per night, with a unique index on `{villa, date}`. A booking or block inserts its nights, and a clash fails at the database. Unpaid checkout holds expire automatically (TTL).

## Data model (MongoDB collections)

| Collection | Holds |
| --- | --- |
| `users` | name, email, password hash, role, owner's villas, active, last login |
| `activitylogs` | who changed what, when |
| `media` | file path, URL, width, height, size, alt text, blur placeholder, folder |
| `settings` (single doc) | brand, contact (WhatsApp, phone, email, Instagram, address, reply hours, office map pin), tracking (GTM, GA4, Meta Pixel, Search Console), SEO defaults, header nav, footer columns and text, booking and payment defaults, GST, enquiry occasions |
| `pages` | one per page (home, villas, destinations, experiences, about, faq, contact, owners, booking pages, 404): SEO plus ordered sections `{key, enabled, data}` |
| `villas` | everything on the villa page today, plus booking mode, payment override, extra-guest charge, minimum nights, commission %, owner, draft/live/coming-soon/archived |
| `pricerules` | seasonal and special-date prices per villa |
| `villacategories` | Luxury / Budget (labels, blurbs, order) |
| `amenities` | label + icon from a curated icon set |
| `destinations`, `experiences`, `occasions`, `reviews`, `faqs` (grouped), `team`, `policies`, `landingpages`, `cancellationpolicies` (refund tiers) | as today, editable |
| `enquiries` | villa/destination, dates, guests, occasion, UTM source, page, status, notes |
| `ownerleads` | partner form submissions, status, notes |
| `villanights` | one per booked or blocked night (unique) |
| `blocks` | owner/admin date blocks |
| `bookings` | reference, guest, dates, guests, add-ons, price breakdown, payment plan, payments, status timeline, cancellation, commission and owner share |
| `payments`, `refunds` | Razorpay orders, payments and refunds |
| `coupons` | code, % or flat, limits, dates, villas |
| `payouts` | owner, period, bookings, amount, status, reference |
| `listingrequests` | owner's proposed changes, admin decision |
| `redirects` | old URL → new URL (SEO) |

## Admin panel

- **Dashboard**: new enquiries and leads, bookings, revenue, occupancy, upcoming arrivals.
- **Bookings**: bookings list and detail (approve requests, record offline payments, send balance link, cancel/refund), availability calendar, coupons, payouts.
- **Leads**: enquiries inbox and owner leads, with status, notes, filters and CSV export.
- **Catalogue**: villas (tabbed editor: basics, gallery, rooms, amenities, rules, pricing and booking, location, host, SEO), price rules, categories, amenities, destinations, experiences, occasions.
- **Content**: pages and sections editor (show/hide, drag to reorder), reviews, FAQs, team, policies, ad landing pages, media library.
- **Settings**: general and contact, header and footer, booking and payments, tax, SEO and tracking, cancellation policies, redirects.
- **People**: users and roles, owners, listing edit requests, activity log.
- **Owner view**: my villas, my bookings, block dates, earnings and payouts, request edits.

## Build order

1. **Backend core.** Express app, config, Mongo, auth and roles, media upload (sharp → WebP + blur), CRUD for every content type, public API, page-section registry, revalidation hook, activity log.
2. **Seed.** Copy all mock data and the ~150 photos into the backend, then load them into Atlas.
3. **Website on real data.** API client with cache tags, images from the API, settings-driven header/footer/contact/tracking, sections from page config, enquiries and owner leads saved to the backend, DB-driven sitemap and redirects. Check visually against today's site and re-check PageSpeed.
4. **Admin panel.** Shell, login, every screen above.
5. **Booking engine.** Availability, pricing engine and quote, coupons, checkout + Razorpay, webhooks, emails, booking page, cancellation and refunds. Booking UI on the website.
6. **Owner dashboard.** Owner-scoped views, blocks, earnings, payouts, edit requests.
7. **Ship.** Render and Vercel configs, VPS notes (PM2 + Nginx), READMEs, end-to-end checks.

## Env variables (summary)

- **backend:** `MONGODB_URI`, `JWT_SECRET`, `UPLOADS_DIR`, `PUBLIC_URL`, `SITE_URL`, `ADMIN_URL`, `REVALIDATE_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SMTP_*`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
- **frontend:** `API_URL`, `NEXT_PUBLIC_API_URL`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- **admin:** `BACKEND_URL`, `NEXT_PUBLIC_SITE_URL`

## Needed from the client later (not blocking)

Razorpay keys (test first, then live), SMTP details for guest emails, real contact details, real villa photos and content (all replaceable from the admin).

## Status (27 Oct 2026)

All seven steps are built, and the database is seeded with the full original site (114 photos, 9 villas, 4 destinations, 9 experiences, 15 FAQs, 13 pages of section copy).

Verified:
- Type checks, lint and production builds pass for all three apps.
- Every website page renders from the database and refreshes after admin saves (checked on the production build).
- Enquiry and owner-lead forms save, with CORS limited to the site and admin.
- Booking engine via the API: pricing (weekend, extra guest, add-ons, GST, advance), request → approve → offline payment → confirm, double-booking blocked, cancel with refund. The Razorpay webhook was tested twice for idempotency and the late-payment auto-refund. Owner scoping, owner blocks, listing request → partial approval, and payout → paid were tested too.
- Photo upload → WebP → serve → usage check → delete.

Not yet verified:
- The admin and booking screens have not been clicked through in a browser.
- No new Lighthouse run.
- Razorpay with real test keys, and SMTP email sending.

Still needed from the client: Razorpay keys, SMTP details, real contact numbers, real photos and copy. The FAQ and How-it-works copy still describes WhatsApp-only booking; update it in the admin when online booking goes live. Delete the demo owner (`owner@socialstays.in`) before launch.
