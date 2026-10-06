import type { Occasion } from "@/data/types";

export const occasions: Occasion[] = [
  {
    slug: "birthdays",
    title: "Birthdays",
    heading: "Birthdays the whole family can stay for",
    summary: "A villa to yourselves, décor in place before you arrive, and dinner on the lawn.",
    description:
      "From a first birthday with both sets of grandparents to a fortieth with old college friends: book the whole villa, and we arrange the décor, the cake and a dinner that nobody has to cook.",
    photo: "occasions/birthday",
    ideas: ["Garden décor with fairy lights", "Cake from a trusted Indore bakery", "Barbecue or Malwa thali dinner", "Bonfire and music after"],
    groupSize: "8 to 60 guests",
    villas: ["palash-farm", "shipra-farm", "amaltas-house"],
    enquiryOccasion: "Birthday",
  },
  {
    slug: "anniversaries",
    title: "Anniversaries",
    heading: "Anniversaries, just the two of you or the whole family",
    summary: "Candle-lit dinners, a pool at sunset and a host who keeps the surprise.",
    description:
      "A quiet night at Sunset Ridge with a table set on the pavilion, or a family lunch for your parents' fiftieth: tell us who is coming and what they love, and we plan the rest with you on WhatsApp.",
    photo: "occasions/anniversary",
    ideas: ["Candle-lit dinner for two", "Flowers in the room on arrival", "Photographer for an hour", "Late check-out where possible"],
    groupSize: "2 to 30 guests",
    villas: ["sunset-ridge", "baobab-house", "rewa-riverside"],
    enquiryOccasion: "Anniversary",
  },
  {
    slug: "pre-wedding",
    title: "Pre-wedding",
    heading: "Haldi, mehendi and pre-wedding shoots",
    summary: "Small, family-sized functions on a private lawn, and locations your photographer will love.",
    description:
      "For the functions that don't need a banquet hall: a haldi on the lawn, a mehendi afternoon by the pool, or a pre-wedding shoot among Mandu's arches or on the Jaam Gate ridge. The family stays the night, so nobody is driving home at midnight.",
    photo: "occasions/pre-wedding",
    ideas: ["Marigold haldi set-up", "Mehendi artist for the afternoon", "Shoot permissions and timings", "Rooms for the immediate family"],
    groupSize: "10 to 80 guests",
    villas: ["shipra-farm", "palash-farm", "sunset-ridge"],
    enquiryOccasion: "Pre-wedding",
  },
  {
    slug: "offsites",
    title: "Offsites",
    heading: "Small team offsites, an hour from the office",
    summary: "Fast Wi-Fi, a long table to work at and a pool for after.",
    description:
      "Two days away with your team without a flight: a working session at the dining table, a long lunch, a swim, and a bonfire to finish. We sort meals, transport from Indore and a GST invoice for the company.",
    photo: "occasions/offsite",
    ideas: ["Working space with power backup", "All meals and tea breaks", "Coach from Indore", "GST invoice"],
    groupSize: "8 to 24 guests",
    villas: ["shipra-farm", "palash-farm", "mahua-farm"],
    enquiryOccasion: "Team offsite",
  },
];

export const enquiryOccasions = [
  "Weekend getaway",
  "Birthday",
  "Anniversary",
  "Pre-wedding",
  "Family get-together",
  "Team offsite",
  "Something else",
] as const;
