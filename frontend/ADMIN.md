# Admin panel (/admin)

The admin for the Social Stays team and villa owners is part of this app, at **`/admin`** (locally http://localhost:3000/admin). It is client-rendered behind a login and talks to the backend through this app's own origin: `next.config.ts` rewrites `/api/*` and `/uploads/*` to the backend, so the session cookie is first-party.

It is kept separate from the public site:

- **Its own root layout** (`src/app/admin/layout.tsx`): no site header, analytics, smooth scrolling or enquiry dialog. Moving between the site and the admin is a full page load.
- **Its own stylesheet** (`src/app/admin/admin.css`): Tailwind scans only the admin's files for it, and the site's `globals.css` excludes them, so neither ships the other's CSS.
- **Its own code** in `src/admin/` (components, lib, resources), imported as `@admin/…`.
- **Not indexed:** `X-Robots-Tag: noindex` on `/admin/*` and `Disallow: /admin` in robots.txt.

## What's where

| Screen | |
| --- | --- |
| Dashboard | New enquiries and owner leads, enquiry trends, listing requests, recent activity |
| Enquiries, Owner leads | Inboxes with status, notes, WhatsApp/call buttons, CSV export. Welcome pop-up leads show the form "Welcome pop-up" |
| Calendar | Internal only: which nights each villa is blocked (e.g. stays confirmed on WhatsApp). Not shown on the website |
| Villas … Occasions | The catalogue |
| Pages & sections | Every heading, paragraph, photo and button on the website; show/hide and reorder sections |
| Reviews … Ad landing pages, Media library | The rest of the website content and the photo library |
| Site settings, Redirects | Contact details, menus, footer, SEO, tracking IDs, enquiry form and welcome pop-up |
| Users & owners, Listing requests, Activity log | Accounts and roles, owners' change requests, who changed what |

Owners see: My villas (suggest changes to their listing, which an admin approves).

## Adding a new editable thing

- **A field on an existing content type:** add it to the backend's Mongoose model, then to its config in `src/admin/resources/` (field types are in `src/admin/components/fields/types.ts`), and render it on the website.
- **A field in a page section:** add it to `backend/src/content/registry.ts`. The page editor picks it up automatically.
- **A new list screen:** add a `ResourceConfig` in `src/admin/resources/` and register it in `src/admin/resources/index.ts`; `/admin/[resource]` and `/admin/[resource]/[id]` render it.
- **Links inside the admin** start with `/admin/…`. Backend calls go through `api("/admin/…")`, which adds `/api`.
