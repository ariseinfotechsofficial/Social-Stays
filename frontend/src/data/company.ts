import type { TeamMember } from "@/data/types";

/* MOCK — team names, bios and portraits are placeholders. */
export const team: TeamMember[] = [
  {
    name: "Arjun Malviya",
    role: "Co-founder",
    bio: "Grew up spending school holidays at his grandfather's farm near Mhow. Visits every villa before it joins the collection.",
    photo: "people/team-1",
  },
  {
    name: "Nandini Joshi",
    role: "Co-founder, guest experience",
    bio: "Ran events in Indore for ten years. Plans most of the birthdays, haldis and anniversaries that happen at our villas.",
    photo: "people/team-2",
  },
  {
    name: "Kabir Solanki",
    role: "Villa partnerships",
    bio: "Works with owner families on everything from photography to pricing. Usually on the road between Mandu and Omkareshwar.",
    photo: "people/team-3",
  },
  {
    name: "Ritika Patidar",
    role: "Bookings",
    bio: "The person most likely to answer your WhatsApp. Knows which villa has the best breakfast and which one has the best sunset.",
    photo: "people/team-4",
  },
];

export const ownerBenefits = [
  {
    title: "Bookings from guests we know",
    body: "Families and friend groups from Indore and Bhopal, every one spoken to on WhatsApp before they are confirmed.",
  },
  {
    title: "Photography and listing, done for you",
    body: "A professional shoot, a written listing and a page on our site, at no cost to you.",
  },
  {
    title: "You keep control of your calendar",
    body: "Block the dates your family wants, any time. We only sell the nights you open.",
  },
  {
    title: "Clear monthly payouts",
    body: "One statement a month showing every booking, every add-on and our commission. Paid by the 5th.",
  },
  {
    title: "Support for your caretaker team",
    body: "Housekeeping checklists, a training day, and a guest-ready standard we hold every villa to.",
  },
  {
    title: "Events handled end to end",
    body: "Décor, catering and music partners we trust, so celebrations at your property run without surprises.",
  },
];

/** A real sequence, so it is numbered on the page */
export const ownerSteps = [
  { title: "Tell us about your property", body: "Fill in the form below with a few photos. We reply within two working days." },
  { title: "We visit", body: "Someone from our team comes to see the property and meet the people who look after it." },
  { title: "Shoot, listing and pricing", body: "We photograph the villa, write the listing and agree prices and blocked dates with you." },
  { title: "Bookings begin", body: "Your villa goes live on Social Stays. You get a monthly statement and payout." },
];

export const ownerCriteria = [
  "Within two and a half hours' drive of Indore",
  "At least three bedrooms with attached bathrooms",
  "Private outdoor space: a lawn, garden or terrace",
  "A caretaker or family member living nearby",
  "Reliable water and power backup",
];

export const bookingSteps = [
  {
    title: "Send an enquiry",
    body: "Pick a villa, add your dates and number of guests, and the form opens WhatsApp with everything filled in.",
  },
  {
    title: "Get a quote",
    body: "We confirm availability and send one clear quote, with meals and any set-ups you asked for.",
  },
  {
    title: "Pay the advance",
    body: "50% by UPI or bank transfer holds your dates. The balance is due a week before you arrive.",
  },
  {
    title: "Arrive",
    body: "Directions and your host's number reach you the day before. The house is ready when you are.",
  },
];
