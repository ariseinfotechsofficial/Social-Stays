# Social Stays — website (Phase 1)

The public website for Social Stays: private villas and farmhouses around Indore (Jaam Gate, Mandu, Omkareshwar, Ujjain), booked through WhatsApp enquiries. Built to the requirements in `../docs/Social-Stays-Website-Requirements.pdf`.

## Run it

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, REVALIDATE_SECRET, NEXT_PUBLIC_SITE_URL
npm run dev                  # site on http://localhost:3000, admin on http://localhost:3000/admin (the backend must be running)
npm run build && npm start   # production; the build reads all content from the API
npm run lint && npm run typecheck
```

Node 20.9 or newer.

The admin panel lives in this app at `/admin`; see [ADMIN.md](ADMIN.md).

## Where the content comes from

All content (villas, destinations, experiences, page copy, photos, contact details, menus, SEO, tracking IDs) is edited in the **admin panel** and served by the **backend** (`../backend`). The site fetches one bundle, `GET /api/public/content`, through `src/lib/content.ts`:

- The fetch is cached by Next.js under the tag `cms` (and refreshed at least hourly), so pages stay static and fast.
- Every save in the admin makes the backend call `POST /api/revalidate` with the shared `REVALIDATE_SECRET`; the next visit to each page renders the new content.
- Photo paths in the bundle (`/uploads/…`) are turned into absolute URLs on the backend's host and optimised by `next/image`.
- Settings that client components need (WhatsApp number, menus, enquiry options) reach them through `<SiteProvider>` (`useSite()`).
- Page sections are rendered in the order and on/off state set in the admin (`getPage()`); a section's text is read with `section.text("key", fallback)` so a half-filled section never breaks a page.
- Redirects managed in the admin are applied by the catch-all route `app/(site)/[...path]`.

## Deploy to Vercel

1. Deploy the backend first (see `../README.md`): the build fetches every page's content from it.
2. Import the repository in Vercel with **Root Directory** `frontend`. Framework Next.js, `npm ci`, `next build`.
3. Environment variables: `NEXT_PUBLIC_API_URL` (the backend), `REVALIDATE_SECRET` (same as the backend), `NEXT_PUBLIC_SITE_URL` (the custom domain, once connected).
4. In the backend, set `SITE_URL` and `ADMIN_URL` to this site's URL, so admin saves reach `/api/revalidate`.

The admin's photo uploads pass through this app's `/api` proxy; the browser shrinks photos before upload, which keeps requests under Vercel's 4.5 MB limit.

After the custom domain is live, submit `https://<domain>/sitemap.xml` in Google Search Console (the verification code goes in the admin under Settings → SEO & tracking).

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript. Every page is pre-rendered from the API and refreshed on demand. |
| Styling | Tailwind CSS v4. Design tokens live in `src/app/globals.css`. |
| Motion | Motion (`motion/react`) via `LazyMotion`, so animation code loads after first paint. Lenis smooth scrolling on mouse devices only. React `<ViewTransition>` for page changes and the villa photo morph. |
| UI primitives | Radix (dialog, popover, accordion), Embla (carousels), react-day-picker (loaded on demand) |
| Fonts | Cormorant Garamond 500 (display) + Manrope (body), self-hosted by `next/font` |
| Icons | Phosphor, light weight |

## Where things are

```
src/
  app/
    (site)/            pages with the full header and footer
      page.tsx         home: sections in the admin's order
      villas/          listing with filters + villa detail template
      destinations/    index + one page per destination
      experiences/  owners/  about/  faq/  contact/  policies/
      booking/         checkout, the guest's booking page, find my booking
      [...path]/       redirects from the admin, otherwise 404
    (landing)/lp/      ad landing template: no menu, one villa or one occasion
    admin/             the admin panel: its own root layout and stylesheet (see ADMIN.md)
    api/revalidate/    called by the backend after admin saves
    sitemap.ts  robots.ts
  components/          layout, enquiry form, booking, villa, home sections, motion helpers
  data/types.ts        the content model (matches the backend's bundle)
  lib/content.ts       getContent() + lookups (getVilla, villasIn, getPage…)
  lib/booking.ts       quotes, availability, Razorpay Checkout
  lib/                 site config, WhatsApp message builder, UTM capture, analytics
  assets/brand/        fallback logos, used until logos are uploaded in Settings
  admin/               the admin's components, lib and resource configs (imported as @admin/…)
```

## How enquiries work

1. A visitor fills in the enquiry form (destination or villa, dates, guests, occasion).
2. The enquiry is saved to the admin's Enquiries inbox in the background (`keepalive` request), then `lib/whatsapp.ts` opens `wa.me/<number>` with a pre-filled message. The number comes from Settings, or from the villa if it has its own.
3. The message ends with the traffic source, e.g. `Source: Instagram ad (diwali-weekends)`, captured by `lib/attribution.ts` from `utm_*`, `gclid`/`fbclid` or the referrer, and kept for 30 days. The same source is stored with the enquiry.

## Online booking

Shown on a villa only when the backend has Razorpay keys, booking is switched on in Settings, and the villa is set to Instant or Request. Otherwise the villa keeps the WhatsApp enquiry card.

- **Booking card** (villa sidebar): dates with booked nights struck through, guests, live price.
- **Checkout** (`/booking/checkout`): add-ons, coupon, guest details, then Razorpay (instant) or a request the team approves.
- **Booking page** (`/booking/<ref>?key=…`): status, payment of the balance, cancellation with the policy's refund shown. Guests reach it from their email or from Find my booking (reference + phone).

## Tracking

Set the Google Tag Manager ID in the admin (Settings → SEO & tracking) and configure GA4, Meta Pixel and Conversions API inside GTM. (Direct GA4 / Pixel IDs work too when no GTM ID is set.) The site pushes these events to `dataLayer` (`lib/analytics.ts`), each with `traffic_source`, `traffic_medium` and `traffic_campaign`:

| Event | Fired when | Extra fields |
| --- | --- | --- |
| `whatsapp_click` | any WhatsApp button or enquiry submit | `placement`, `villa` |
| `form_submit` | an enquiry form, checkout or booking request is submitted | `form`, `villa`, `occasion` |
| `call_click` | any click-to-call link | `placement` |
| `villa_view` | a villa page is opened | `villa`, `villa_name` |
| `owner_lead` | the owner partnership form succeeds | `rooms` |

If the Meta Pixel is loaded directly, these also map to the standard events `Contact`, `Lead` and `ViewContent`.

## Ad landing pages

Created in the admin (Ad landing pages) at `/lp/<slug>`. They are `noindex` by default, show no menu, and keep a WhatsApp button fixed on mobile. Point ads at them with UTM tags.

## Owner leads

The Partner with us form posts to the backend; leads appear in the admin under Owner leads.

## Performance and SEO

Measured with Lighthouse, mobile, on a local production build: Performance 87–88 on home, villa detail, Mandu and Celebrations (warm image cache); Accessibility, SEO and Best Practices 100. Choices that keep it there:

- The hero photo is preloaded. Calendar, mobile menu, lightbox and Lenis load only when needed, and animation features load after first paint.
- One Cormorant weight (500), with italics not preloaded. The ₹ sign comes from a system font (`SS Rupee` in `globals.css`) so the extended-Latin font files are never downloaded.
- The load animations are CSS-only, and the hero photo zoom is limited to large screens.

Structured data: `Organization` (home), `LodgingBusiness` (each villa), `TouristDestination` + `FAQPage` (destinations), `FAQPage` (FAQ), `BreadcrumbList` and `ItemList`. Every page has its own title, description, canonical URL and Open Graph image.

## Design rules worth keeping

- **Gold:** `#8A6B24` is for buttons and large text. Small gold text uses `gold-deep` (`#75591B`), which passes WCAG AA on both white and beige. `brass` is for rules and stars only.
- **Typography:** type sizes are the `type-*` utilities; avoid `text-*` names for them, because `tailwind-merge` treats those as colours.
- **Motion:** keep it intentional. The hero load sequence, photo reveals on large images, and motion that responds to the visitor. Avoid adding fade-ins to every section. oaky
