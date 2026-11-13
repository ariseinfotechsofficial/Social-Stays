import { Router } from "express";
import { can } from "../../lib/auth.js";
import { Booking, ListingRequest, VillaNight } from "../../models/booking.js";
import { Villa } from "../../models/catalog.js";
import { Enquiry, OwnerLead } from "../../models/leads.js";
import { Activity } from "../../models/users.js";
import { addDays, dayKey, monthStart, todayIST } from "../../services/dates.js";

export const dashboardRouter = Router();

/** The admin home: what needs attention today, plus the trend lines. Each block appears only for roles that can act on it. */
dashboardRouter.get("/", async (req, res) => {
  const user = req.user!;
  const today = todayIST();
  const in30 = addDays(today, 30);
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

  if (can(user, "bookings")) {
    const [requests, cancellations, arrivals, liveVillas, bookedNights, revenueByMonth, upcomingCount] = await Promise.all([
      Booking.countDocuments({ status: "requested" }),
      Booking.countDocuments({ "cancellation.status": "requested" }),
      Booking.find({ status: "confirmed", checkIn: { $gte: today, $lte: addDays(today, 7) } })
        .sort("checkIn")
        .limit(12)
        .select("ref villaName checkIn checkOut guests guest.name amountPaid pricing.total")
        .lean(),
      Villa.countDocuments({ status: "live" }),
      VillaNight.countDocuments({ kind: "booking", date: { $gte: today, $lt: in30 }, $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }] }),
      Booking.aggregate([
        { $match: { status: { $in: ["confirmed", "completed"] }, checkIn: { $gte: monthStart(addDays(today, -150)) } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$checkIn" } }, value: { $sum: "$pricing.total" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Booking.countDocuments({ status: "confirmed", checkIn: { $gte: today } }),
    ]);
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = monthStart(today);
      d.setUTCMonth(d.getUTCMonth() - 5 + i);
      return d.toISOString().slice(0, 7);
    });
    const byMonth = Object.fromEntries(revenueByMonth.map((m) => [m._id, m]));
    out.bookings = {
      requests,
      cancellations,
      upcoming: upcomingCount,
      arrivals,
      occupancy30: liveVillas ? Math.round((bookedNights / (liveVillas * 30)) * 100) : 0,
      byMonth: months.map((m) => ({ month: m, value: byMonth[m]?.value ?? 0, count: byMonth[m]?.count ?? 0 })),
    };
  }

  if (can(user, "payments")) {
    const start = monthStart(today);
    const [collected] = await Booking.aggregate([
      { $unwind: "$payments" },
      { $match: { "payments.status": "paid", "payments.paidAt": { $gte: start } } },
      { $group: { _id: null, amount: { $sum: "$payments.amount" } } },
    ]);
    out.payments = { collectedThisMonth: collected?.amount ?? 0 };
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
  const [needsAction, newEnquiries, newOwnerLeads, listingRequests] = await Promise.all([
    can(user, "bookings") ? Booking.countDocuments({ $or: [{ status: "requested" }, { "cancellation.status": "requested" }] }) : 0,
    can(user, "leads") ? Enquiry.countDocuments({ status: "new" }) : 0,
    can(user, "leads") ? OwnerLead.countDocuments({ status: "new" }) : 0,
    can(user, "owners") || can(user, "catalog") ? ListingRequest.countDocuments({ status: "pending" }) : 0,
  ]);
  res.json({ needsAction, newEnquiries, newOwnerLeads, listingRequests });
});
