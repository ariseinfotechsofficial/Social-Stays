import { Router } from "express";
import { requireAuth, requirePermission } from "../../lib/auth.js";
import { HttpError, pagination } from "../../lib/http.js";
import { Booking, Coupon } from "../../models/booking.js";
import { Amenity, CancellationPolicy, Destination, Experience, Occasion, PriceRule, Villa, VillaCategory } from "../../models/catalog.js";
import { FaqGroup, FaqItem, LandingPage, Policy, Redirect, Review, TeamMember } from "../../models/content.js";
import { Activity } from "../../models/users.js";
import { bookingsRouter, calendarRouter } from "./bookings.js";
import { crudRouter, inUseBy, slugFrom } from "./crud.js";
import { dashboardRouter } from "./dashboard.js";
import { enquiriesRouter, ownerLeadsRouter } from "./leads.js";
import { mediaRouter } from "./media.js";
import { pagesRouter } from "./pages.js";
import { listingRequestsRouter, payoutsRouter } from "./payouts.js";
import { settingsRouter } from "./settings.js";
import { usersRouter } from "./users.js";

export const adminRouter = Router();
adminRouter.use(requireAuth);

/* ---------- Catalogue ---------- */

adminRouter.use(
  "/villas",
  crudRouter(Villa, {
    entity: "villa",
    permission: "catalog",
    searchFields: ["name", "slug", "tagline"],
    filters: ["status", "destination", "category", "owner"],
    populate: [
      { path: "destination", select: "name slug" },
      { path: "category", select: "label slug" },
      { path: "owner", select: "name email" },
    ],
    listExclude: "-description -rooms -houseRules -seo",
    prepare: slugFrom("name"),
    duplicate: () => ({ status: "draft", rating: { score: 0, count: 0 } }),
    beforeDelete: async (doc) => {
      const count = await Booking.countDocuments({ villa: String(doc._id) });
      if (count) throw new HttpError(409, `This villa has ${count} booking${count === 1 ? "" : "s"} on record. Archive it instead of deleting.`);
    },
  }),
);

adminRouter.use(
  "/destinations",
  crudRouter(Destination, {
    entity: "destination",
    permission: "catalog",
    searchFields: ["name", "slug"],
    filters: ["status"],
    listExclude: "-intro -thingsToDo -faqs",
    prepare: slugFrom("name"),
    duplicate: () => ({ status: "draft" }),
    beforeDelete: inUseBy([{ model: Villa, field: "destination", what: "villa" }]),
  }),
);

adminRouter.use(
  "/experiences",
  crudRouter(Experience, {
    entity: "experience",
    permission: "catalog",
    searchFields: ["title", "slug"],
    filters: ["status"],
    prepare: slugFrom("title"),
    duplicate: () => ({ status: "draft" }),
  }),
);

adminRouter.use(
  "/occasions",
  crudRouter(Occasion, { entity: "occasion", permission: "catalog", searchFields: ["title"], filters: ["status"], prepare: slugFrom("title") }),
);

adminRouter.use(
  "/categories",
  crudRouter(VillaCategory, {
    entity: "villa category",
    permission: "catalog",
    label: (d) => String(d.label),
    prepare: slugFrom("label"),
    beforeDelete: inUseBy([{ model: Villa, field: "category", what: "villa" }]),
  }),
);

adminRouter.use(
  "/amenities",
  crudRouter(Amenity, {
    entity: "amenity",
    permission: "catalog",
    searchFields: ["label", "key"],
    label: (d) => String(d.label),
    prepare: slugFrom("label", "key"),
    beforeDelete: inUseBy([{ model: Villa, field: "amenities", what: "villa" }]),
  }),
);

adminRouter.use(
  "/cancellation-policies",
  crudRouter(CancellationPolicy, {
    entity: "cancellation policy",
    permission: "catalog",
    defaultSort: "name",
    prepare: slugFrom("name", "key"),
    beforeDelete: inUseBy([{ model: Villa, field: "cancellationPolicy", what: "villa" }]),
  }),
);

adminRouter.use(
  "/price-rules",
  crudRouter(PriceRule, {
    entity: "price rule",
    permission: "catalog",
    filters: ["villa", "active"],
    defaultSort: "from",
    populate: { path: "villa", select: "name slug" },
    label: (d) => String(d.label),
    // Booking prices aren't cached by the website
    affectsSite: false,
  }),
);

/* ---------- Content ---------- */

adminRouter.use(
  "/reviews",
  crudRouter(Review, {
    entity: "review",
    permission: "content",
    searchFields: ["name", "text", "city"],
    filters: ["villa", "featured", "status"],
    populate: { path: "villa", select: "name slug" },
    defaultSort: "order",
  }),
);

adminRouter.use(
  "/faq-groups",
  crudRouter(FaqGroup, {
    entity: "FAQ group",
    permission: "content",
    prepare: slugFrom("title", "key"),
    beforeDelete: inUseBy([{ model: FaqItem, field: "group", what: "question" }]),
  }),
);

adminRouter.use(
  "/faqs",
  crudRouter(FaqItem, {
    entity: "FAQ",
    permission: "content",
    searchFields: ["q", "a"],
    filters: ["group", "showOnHome", "status"],
    populate: { path: "group", select: "title key" },
    label: (d) => String(d.q),
  }),
);

adminRouter.use("/team", crudRouter(TeamMember, { entity: "team member", permission: "content", searchFields: ["name", "role"], filters: ["status"] }));

adminRouter.use(
  "/policies",
  crudRouter(Policy, { entity: "policy", permission: "content", searchFields: ["title"], filters: ["status"], prepare: slugFrom("title") }),
);

adminRouter.use(
  "/landing-pages",
  crudRouter(LandingPage, {
    entity: "landing page",
    permission: "content",
    searchFields: ["headline", "slug"],
    filters: ["status", "kind"],
    defaultSort: "-updatedAt",
    populate: { path: "villas", select: "name slug" },
    label: (d) => `/lp/${d.slug}`,
    prepare: slugFrom("headline"),
    duplicate: () => ({ status: "draft" }),
  }),
);

adminRouter.use(
  "/redirects",
  crudRouter(Redirect, { entity: "redirect", permission: "settings", searchFields: ["from", "to"], defaultSort: "from", label: (d) => `${d.from} → ${d.to}` }),
);

adminRouter.use("/pages", pagesRouter);
adminRouter.use("/settings", settingsRouter);
adminRouter.use("/media", mediaRouter);
adminRouter.use("/users", usersRouter);

/* ---------- Leads ---------- */

adminRouter.use("/enquiries", enquiriesRouter);
adminRouter.use("/owner-leads", ownerLeadsRouter);

/* ---------- Bookings ---------- */

adminRouter.use("/dashboard", dashboardRouter);
adminRouter.use("/bookings", bookingsRouter);
adminRouter.use("/calendar", calendarRouter);
adminRouter.use("/payouts", payoutsRouter);
adminRouter.use("/listing-requests", listingRequestsRouter);
adminRouter.use(
  "/coupons",
  crudRouter(Coupon, {
    entity: "coupon",
    permission: "coupons",
    readPermission: "coupons",
    searchFields: ["code", "description"],
    filters: ["active"],
    defaultSort: "-createdAt",
    label: (d) => String(d.code),
    affectsSite: false,
    duplicate: () => ({ usedCount: 0, active: false }),
  }),
);

/* ---------- Activity ---------- */

adminRouter.get("/activity", requirePermission("activity"), async (req, res) => {
  const { page, limit, skip } = pagination(req.query, { limit: 50 });
  const filter: Record<string, unknown> = {};
  if (typeof req.query.user === "string" && req.query.user) filter.user = req.query.user;
  if (typeof req.query.entity === "string" && req.query.entity) filter.entity = req.query.entity;
  const [items, total] = await Promise.all([Activity.find(filter).sort("-createdAt").skip(skip).limit(limit).lean(), Activity.countDocuments(filter)]);
  res.json({ items, total, page, limit });
});
