# Social Stays — website (Phase 1)

The public website for Social Stays: private villas and farmhouses around Indore (Jaam Gate, Mandu, Omkareshwar, Ujjain), booked through WhatsApp enquiries. Built to the requirements in `../docs/Social-Stays-Website-Requirements.pdf`.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the real numbers and IDs
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npm run lint && npm run typecheck
```

Node 20.9 or newer.

## Deploy to Vercel

The Next.js app is this `frontend/` folder; nothing outside it is needed to build or run the site.

1. **Import the project.** Either push the repository to GitHub and import it in Vercel, with **Root Directory** set to `frontend`, or run `npx vercel` from inside `frontend/` with the Vercel CLI.
2. **Keep the detected settings.** Framework preset: Next.js. Build command: `next build`. Install command: `npm ci`. Node 20.9 or newer, enforced by `engines` in `package.json`.
3. **Add environment variables** under Project → Settings → Environment Variables, copied from `.env.example`:
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_PHONE_E164`, `NEXT_PUBLIC_PHONE_DISPLAY`, `NEXT_PUBLIC_EMAIL`: the client's real contact details.
   - `NEXT_PUBLIC_GTM_ID`: once the Tag Manager container exists.
   - `OWNER_LEADS_WEBHOOK_URL`: where owner leads are sent.
   - `NEXT_PUBLIC_SITE_URL`: the custom domain, once it is connected. Until then the site uses Vercel's production domain for canonical links, the sitemap and social previews.
4. **Redeploy after changing variables.** `NEXT_PUBLIC_*` values are baked in at build time.

After the custom domain is live, submit `https://<domain>/sitemap.xml` in Google Search Console.

Every page is pre-rendered at build time. The only server code is `/api/owner-leads`, which Vercel runs as a function. Photos are served through Vercel Image Optimization, which resizes them and converts them to WebP/AVIF.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript. Every page is pre-rendered as static HTML. |
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
      page.tsx         home
      villas/          listing with filters + villa detail template
      destinations/    index + 4 SEO landing pages
      experiences/  celebrations/  owners/  about/  faq/  contact/  policies/
    (landing)/lp/      ad landing template: no menu, one villa or one occasion
    api/owner-leads/   owner partnership form endpoint
    sitemap.ts  robots.ts  icon.svg  apple-icon.png
  components/          layout, enquiry form, villa, home sections, motion helpers
  data/                ALL CONTENT (villas, destinations, experiences, FAQs, policies, reviews, team)
  lib/                 site config, WhatsApp message builder, UTM capture, analytics
  assets/photos/       placeholder photography (WebP), imported so Next can optimise it
public/
  images/              the client's original logo files (logo.jpeg, favicon.jpeg), served at /images/…
```

## Content is mock data

Everything in `src/data` is written for the design and must be replaced or confirmed by the client before launch:

- **Villas** (`villas.ts`): names, prices, rooms, hosts, ratings and coordinates are placeholders.
- **Reviews** (`reviews.ts`): written for the layout. Do not publish them as real; replace them with genuine reviews or the Google reviews widget.
- **Team** (`company.ts`): names, bios and portraits are placeholders.
- **Policies** (`policies.ts`): draft text; needs legal review.
- **Photos**: Unsplash placeholders, credited in `../docs/image-credits.md`. Villa photos must be swapped for the client's professional shoot.
- **Contact details** (`src/lib/site.ts` or `.env.local`): WhatsApp, phone, email and Instagram are placeholders.

The data types in `src/data/types.ts` match what the Phase 2 admin panel and API should return, so pages can switch from static files to fetches without component changes.

## How enquiries work

1. A visitor fills in the enquiry form (destination or villa, dates, guests, occasion).
2. `lib/whatsapp.ts` builds a plain-text message and opens `wa.me/<number>` with it pre-filled.
3. The message ends with the traffic source, e.g. `Source: Instagram ad (diwali-weekends)`, captured by `lib/attribution.ts` from `utm_*`, `gclid`/`fbclid` or the referrer, and kept for 30 days.

Example of what arrives on WhatsApp:

```
Hello Social Stays, I'd like to check availability.

Villa: Amaltas House, Jaam Gate
Dates: Fri 16 Oct – Sun 18 Oct 2026 (2 nights)
Guests: 8
Occasion: Birthday

Source: Instagram ad (diwali-weekends)
Page: socialstays.in/lp/amaltas-house?utm_source=instagram…
```

## Tracking

Set `NEXT_PUBLIC_GTM_ID` and configure GA4, Meta Pixel and Conversions API inside Google Tag Manager. The site pushes these events to `dataLayer` (`lib/analytics.ts`), each with `traffic_source`, `traffic_medium` and `traffic_campaign`:

| Event | Fired when | Extra fields |
| --- | --- | --- |
| `whatsapp_click` | any WhatsApp button or enquiry submit | `placement`, `villa` |
| `form_submit` | an enquiry form is submitted | `form`, `villa`, `occasion` |
| `call_click` | any click-to-call link | `placement` |
| `villa_view` | a villa page is opened | `villa`, `villa_name` |
| `owner_lead` | the owner partnership form succeeds | `rooms` |

If the Meta Pixel is loaded directly, these also map to the standard events `Contact`, `Lead` and `ViewContent`.

## Ad landing pages

`/lp/amaltas-house` (single villa) and `/lp/birthday-farmhouse` (occasion) are examples. Add more in `src/data/landing.ts`. They are `noindex`, show no menu, and keep a WhatsApp button fixed on mobile. Point ads at them with UTM tags.

## Owner leads

`POST /api/owner-leads` validates the form. Set `OWNER_LEADS_WEBHOOK_URL` (for example a Google Apps Script web app that appends to a Sheet and sends an email) and leads are forwarded there; without it they are only logged on the server.

## Performance and SEO

Measured with Lighthouse, mobile, on a local production build: Performance 87–88 on home, villa detail, Mandu and Celebrations (warm image cache); Accessibility, SEO and Best Practices 100. Choices that keep it there:

- The hero photo is preloaded. Calendar, mobile menu, lightbox and Lenis load only when needed, and animation features load after first paint.
- One Cormorant weight (500), with italics not preloaded. The ₹ sign comes from a system font (`SS Rupee` in `globals.css`) so the extended-Latin font files are never downloaded.
- The load animations are CSS-only, and the hero photo zoom is limited to large screens.

Structured data: `Organization` (home), `LodgingBusiness` (each villa), `TouristDestination` + `FAQPage` (destinations), `FAQPage` (FAQ), `BreadcrumbList` and `ItemList`. Every page has its own title, description, canonical URL and Open Graph image.

## Design rules worth keeping

- **Gold:** `#8A6B24` is for buttons and large text. Small gold text uses `gold-deep` (`#75591B`), which passes WCAG AA on both white and beige. `brass` is for rules and stars only.
- **Typography:** type sizes are the `type-*` utilities; avoid `text-*` names for them, because `tailwind-merge` treats those as colours.
- **Motion:** keep it intentional. The hero load sequence, photo reveals on large images, and motion that responds to the visitor. Avoid adding fade-ins to every section.
