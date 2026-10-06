import type { Review } from "@/data/types";

/*
 * MOCK REVIEWS for the design. Replace with real guest reviews (or the Google reviews
 * widget) before launch — do not publish these as genuine.
 */
export const reviewSummary = { score: 4.9, count: 180, source: "Google" };

export const reviews: Review[] = [
  {
    id: "r1",
    name: "Priya Agrawal",
    city: "Indore",
    villa: "palash-farm",
    occasion: "Birthday",
    date: "2026-08",
    rating: 5,
    text: "We booked Palash Farm for my father's sixtieth: twenty-two of us, three generations. The décor was done before we arrived, the food kept coming, and not once did anyone ask where they were sleeping.",
  },
  {
    id: "r2",
    name: "Rohan & Megha Jain",
    city: "Indore",
    villa: "sunset-ridge",
    occasion: "Anniversary",
    date: "2026-07",
    rating: 5,
    text: "Dinner on the pavilion with the valley going pink below us. The host had set up candles and flowers without us asking twice. We have already booked the same weekend for next year.",
  },
  {
    id: "r3",
    name: "Dr. Sanjay Mehta",
    city: "Bhopal",
    villa: "avantika-house",
    occasion: "Family trip",
    date: "2026-06",
    rating: 5,
    text: "My parents are in their eighties and everything at Avantika House is on one level. Meenakshi ji helped us with the Bhasma Aarti booking and had tea ready at 3 am. Thoughtful in every way.",
  },
  {
    id: "r4",
    name: "Aditi Bhargava",
    city: "Indore",
    villa: "amaltas-house",
    occasion: "Weekend with friends",
    date: "2026-09",
    rating: 5,
    text: "Rain on the hills, the pool to ourselves and the best dal bafla I've had outside my nani's house. The whole thing was arranged in a single WhatsApp chat.",
  },
  {
    id: "r5",
    name: "Harshit Gupta",
    city: "Indore",
    villa: "shipra-farm",
    occasion: "Team offsite",
    date: "2026-03",
    rating: 5,
    text: "Took our team of eighteen for two days. Wi-Fi held up for the working sessions, the coach from Indore was on time, and the barbecue on the second night is still being talked about at work.",
  },
  {
    id: "r6",
    name: "Neha Khandelwal",
    city: "Ujjain",
    villa: "mahua-farm",
    occasion: "Family trip",
    date: "2026-01",
    rating: 5,
    text: "We brought both our dogs and two toddlers. The farm is fenced, the lawn is enormous and Kavita ji made the children aloo parathas every single morning.",
  },
];

export const getReviewsFor = (villaSlug: string) => reviews.filter((r) => r.villa === villaSlug);
