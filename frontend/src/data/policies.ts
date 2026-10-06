import type { Policy } from "@/data/types";
import { site } from "@/lib/site";

/*
 * DRAFT POLICY TEXT written for the design. Have it reviewed by the client's legal
 * advisor before launch.
 */
export const policies: Policy[] = [
  {
    slug: "cancellation-refund",
    title: "Cancellation & refund policy",
    summary: "When you can cancel, what you get back, and how dates can be moved.",
    updated: "4 October 2026",
    sections: [
      {
        heading: "Standard cancellations",
        body: [
          "If you cancel 15 or more days before check-in, we refund your full advance minus payment-gateway or bank charges.",
          "If you cancel 7 to 14 days before check-in, we refund 50% of the advance.",
          "If you cancel within 7 days of check-in, or do not arrive, the booking is non-refundable.",
        ],
      },
      {
        heading: "Peak dates",
        body: [
          "Bookings that include Diwali week, Christmas to New Year, Holi, Rang Panchami and long weekends are non-refundable once confirmed.",
          "You may move a peak-date booking once, to other dates within six months, subject to availability and any difference in price.",
        ],
      },
      {
        heading: "Changing your dates",
        body: [
          "You can move a standard booking once without charge if you tell us at least 7 days before check-in. The new dates must be within six months and the villa must be available.",
        ],
      },
      {
        heading: "If we have to cancel",
        body: [
          "If a villa becomes unavailable for reasons on our side, we offer a comparable villa or a full refund, at your choice, within 5 working days.",
          "If travel is unsafe because of severe weather or an official advisory, we move your booking to new dates at no charge.",
        ],
      },
      {
        heading: "Security deposit",
        body: [
          "The refundable security deposit is returned within 3 working days of check-out, minus the cost of any damage, missing items or extra cleaning, which we will explain with photographs.",
        ],
      },
      {
        heading: "How refunds are paid",
        body: [
          `Refunds go back to the original payment method within 7 working days of the cancellation being confirmed. Questions: ${site.email}.`,
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of stay & use",
    summary: "The agreement between you, Social Stays and the villa owner when you book.",
    updated: "4 October 2026",
    sections: [
      {
        heading: "Who we are",
        body: [
          "Social Stays curates and manages bookings for privately owned villas and farmhouses around Indore, Madhya Pradesh. Each villa remains the property of its owner family; we act as the booking and guest-experience partner.",
        ],
      },
      {
        heading: "Making a booking",
        body: [
          "A booking is confirmed when we receive your advance and send a written confirmation on WhatsApp or email. Quotes are valid for 48 hours.",
          "The person who books must be at least 18, must stay at the villa, and is responsible for the conduct of their group.",
        ],
      },
      {
        heading: "Guests and ID",
        body: [
          "Every adult must show valid government photo ID at check-in. The number of overnight guests may not exceed the number agreed at booking.",
          "Visitors and events with outside guests need written approval in advance and may carry an additional charge.",
        ],
      },
      {
        heading: "House rules",
        body: [
          "Each villa's house rules are listed on its page and form part of these terms. Outdoor music ends at 10:30 pm in line with local regulations.",
          "Villas in Ujjain and Omkareshwar are alcohol-free. Illegal substances are prohibited at every villa.",
        ],
      },
      {
        heading: "Damage and liability",
        body: [
          "Guests are responsible for damage beyond normal wear during their stay. Pools are unsupervised; children must be accompanied by an adult at all times.",
          "Social Stays and the villa owner are not liable for loss of personal belongings or for injury resulting from guests' own actions.",
        ],
      },
      {
        heading: "Using this website",
        body: [
          "Photographs, prices and availability on this website are shown in good faith and may change. The quote we send on WhatsApp is the final price.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "What we collect when you enquire, why, and how to ask us to delete it.",
    updated: "4 October 2026",
    sections: [
      {
        heading: "What we collect",
        body: [
          "When you enquire, we receive the details you choose to share: your name, phone number, travel dates, number of guests and occasion, along with the page and campaign that brought you to us.",
          "When you book, we also collect payment references and the ID details required at check-in under local law.",
        ],
      },
      {
        heading: "Why we collect it",
        body: [
          "To answer your enquiry, arrange your stay, meet legal requirements for guest registration, and understand which of our adverts and pages are useful.",
        ],
      },
      {
        heading: "Cookies and analytics",
        body: [
          "We use Google Analytics, Google Tag Manager and the Meta Pixel to measure visits and enquiries. These tools set cookies; you can block them in your browser settings without affecting your ability to enquire.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Your host receives the names and arrival details they need to welcome you. We do not sell your data or share it for anyone else's marketing.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Enquiry details are kept for up to 24 months; booking records for as long as Indian tax law requires.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          `To see, correct or delete the information we hold about you, write to ${site.email}. We respond within 30 days.`,
        ],
      },
    ],
  },
];

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
