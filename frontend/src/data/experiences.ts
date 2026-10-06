import type { Experience } from "@/data/types";

/* Indicative prices — confirmed in the WhatsApp quote. */
export const experiences: Experience[] = [
  {
    slug: "malwa-thali",
    title: "Malwa thali",
    summary: "Dal bafla, bhutte ka kees, kadhi and malpua, cooked in the villa kitchen.",
    description:
      "A full Malwa spread served at the villa table: dal bafla with ghee, bhutte ka kees in season, kadhi, two sabzis, rice and malpua or shrikhand to finish. Cooked by the caretaker family the way they cook at home.",
    price: { amount: 650, unit: "per person" },
    includes: ["Serves lunch or dinner", "Vegetarian", "Minimum 6 guests"],
    photo: "experiences/thali",
    availableAt: "all",
  },
  {
    slug: "indori-breakfast",
    title: "Indori breakfast",
    summary: "Poha with jalebi and sev, chai in kulhads, on the lawn.",
    description:
      "The breakfast every Indori misses when they leave home: poha with jeeravan and sev, hot jalebi, seasonal fruit and as much kulhad chai as you can drink, laid out on the lawn or the verandah.",
    price: { amount: 250, unit: "per person" },
    includes: ["Upgrade on the included breakfast", "Served from 8 am"],
    photo: "experiences/poha",
    availableAt: "all",
  },
  {
    slug: "bonfire-evening",
    title: "Bonfire evening",
    summary: "A wood fire on the lawn with blankets, roasted corn and chai.",
    description:
      "We set up a wood fire on the lawn with low seating, blankets for winter nights, roasted corn or shakarkandi depending on the season, and a flask of masala chai. The best way to end a day in October to February.",
    price: { amount: 2500, unit: "per evening" },
    includes: ["Firewood for 3 hours", "Seating and blankets", "Seasonal snacks for 10"],
    photo: "experiences/bonfire",
    availableAt: "all",
  },
  {
    slug: "barbecue-dinner",
    title: "Barbecue dinner",
    summary: "A live grill by the pool, with someone else on tong duty.",
    description:
      "Paneer and mushroom tikka, grilled corn, and chicken or fish where the villa allows it, cooked on a live grill by the pool. Comes with salads, breads, dips and a dessert. One of our staff stays on the grill so you don't have to.",
    price: { amount: 1200, unit: "per person" },
    includes: ["Live grill and grill cook", "Veg and non-veg menus", "Minimum 8 guests"],
    photo: "experiences/bbq",
    availableAt: ["jaam-gate", "mandu"],
  },
  {
    slug: "celebration-decor",
    title: "Celebration décor",
    summary: "Flowers, lights and a cake table, set up before you arrive.",
    description:
      "Birthday or anniversary set-ups in calm, natural tones: fresh flowers, fairy lights, a banner, a cake table and a photo corner. Tell us the occasion and colours you like; we send a mood board on WhatsApp before we build it.",
    price: { amount: 4500, unit: "per set-up", from: true },
    includes: ["Mood board before booking", "Set-up and clear-up", "Cake on request"],
    photo: "experiences/decor",
    availableAt: "all",
  },
  {
    slug: "candlelit-dinner",
    title: "Candle-lit dinner for two",
    summary: "A private table by the pool or on the pavilion, with a set menu.",
    description:
      "A table for two set apart from the house, with candles, flowers and a four-course set menu cooked for the evening. Popular for anniversaries and the occasional proposal; we can hide a photographer in the garden too.",
    price: { amount: 6500, unit: "per couple" },
    includes: ["Four-course menu", "Flowers and candles", "Private set-up"],
    photo: "experiences/candlelight",
    availableAt: "all",
  },
  {
    slug: "private-chef",
    title: "Private chef",
    summary: "A chef who cooks your menu for the whole stay.",
    description:
      "For groups who want more than home cooking: a chef plans the menu with you before the trip and cooks every meal at the villa, from Malwa classics to continental. Groceries are billed at cost.",
    price: { amount: 3500, unit: "per day" },
    includes: ["Menu planned with you", "All meals cooked on site", "Groceries at cost"],
    photo: "experiences/chef",
    availableAt: "all",
  },
  {
    slug: "haldi-mehendi",
    title: "Haldi & mehendi set-ups",
    summary: "Marigold décor, low seating and a mehendi artist for the afternoon.",
    description:
      "Small, family-sized haldi and mehendi afternoons on the lawn: marigold and mango-leaf décor, low seating, a dhol on request, and a mehendi artist booked for as long as you need.",
    price: { amount: 12000, unit: "per set-up", from: true },
    includes: ["Décor and seating", "Mehendi artist on request", "Up to 40 guests"],
    photo: "experiences/mehendi",
    availableAt: "all",
  },
  {
    slug: "guided-day-trip",
    title: "Guided day trips",
    summary: "Mandu's palaces, Omkareshwar's parikrama or Ujjain's temples, with a local guide.",
    description:
      "A licensed local guide and a car with driver for a half or full day. Our hosts suggest the route and timing so you see the monuments or temples before the crowds.",
    price: { amount: 2500, unit: "per group", from: true },
    includes: ["Licensed guide", "Car with driver", "Half or full day"],
    photo: "experiences/day-trip",
    availableAt: ["mandu", "omkareshwar", "ujjain"],
  },
];

export const getExperience = (slug: string) => experiences.find((e) => e.slug === slug);
