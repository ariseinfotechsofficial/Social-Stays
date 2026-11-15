import { Router } from "express";
import { can } from "../../lib/auth.js";
import { ListingRequest } from "../../models/calendar.js";
import { Enquiry, OwnerLead } from "../../models/leads.js";
import { Activity } from "../../models/users.js";
import { addDays, dayKey, todayIST } from "../../services/dates.js";

export const dashboardRouter = Router();

/** The admin home: new leads and listing requests, plus the enquiry trend. Each block appears only for roles that can act on it. */
dashboardRouter.get("/", async (req, res) => {
  const user = req.user!;
  const today = todayIST();
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const out: Record<string, unknown> = {};

  if (can(user, "leads")) {
    const [newEnquiries, enquiries30, newOwnerLeads, bySource, byDay] = await Promise.all([
      Enquiry.countDocuments({ status: "new" }),
      Enquiry.countDocuments({ createdAt: { $gte: since30 } }),
      OwnerLead.countDocuments({ status: "new" }),
      Enquiry.aggregate([{ $match: { createdAt: { $gte: since30 } } }, { $group: { _id: { $ifNull: ["$attribution.source", "Direct"] }, n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]),
      Enquiry.aggregate([
        { $match: { createdAt: { $gte: since30 } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, n: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    const days = Array.from({ length: 30 }, (_, i) => dayKey(addDays(today, i - 29)));
    const counts = Object.fromEntries(byDay.map((d) => [d._id, d.n]));
    out.leads = {
      newEnquiries,
      enquiries30,
      newOwnerLeads,
      bySource: bySource.map((s) => ({ source: s._id || "Direct", count: s.n })),
      byDay: days.map((d) => ({ date: d, count: counts[d] ?? 0 })),
    };
  }

  if (can(user, "owners") || can(user, "catalog")) {
    out.listingRequests = await ListingRequest.countDocuments({ status: "pending" });
  }

  if (can(user, "activity")) {
    out.activity = await Activity.find().sort("-createdAt").limit(8).lean();
  }

  res.json(out);
});

/** Small counts for the sidebar badges, polled every minute */
dashboardRouter.get("/counts", async (req, res) => {
  const user = req.user!;
  const [newEnquiries, newOwnerLeads, listingRequests] = await Promise.all([
    can(user, "leads") ? Enquiry.countDocuments({ status: "new" }) : 0,
    can(user, "leads") ? OwnerLead.countDocuments({ status: "new" }) : 0,
    can(user, "owners") || can(user, "catalog") ? ListingRequest.countDocuments({ status: "pending" }) : 0,
  ]);
  res.json({ newEnquiries, newOwnerLeads, listingRequests });
});
