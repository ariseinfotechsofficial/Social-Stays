import type { Faq } from "@/data/types";

export type FaqGroup = { id: string; title: string; items: Faq[] };

export const faqGroups: FaqGroup[] = [
  {
    id: "booking",
    title: "Booking",
    items: [
      {
        q: "How do I book a villa?",
        a: "Send us an enquiry on WhatsApp from any villa page, or from the form at the top of the home page. We confirm availability and send a full quote, usually within 30 minutes between 9 am and 10 pm. A 50% advance holds your dates.",
      },
      {
        q: "Is the whole villa just for our group?",
        a: "Yes. Every Social Stays booking is for the whole villa, so only your group stays there, up to the guest limit agreed when you book. The caretaker family lives nearby, not in the house.",
      },
      {
        q: "Why can't I book and pay online?",
        a: "Most of our guests are planning something: a birthday, a family trip, a haldi. A quick WhatsApp chat lets us suggest the right villa and add the meals and set-ups you need in one quote. Online booking is coming later this year.",
      },
      {
        q: "Do you allow unmarried couples?",
        a: "Yes. All guests over 18 need a valid government photo ID at check-in, and that is all we ask.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & cancellations",
    items: [
      {
        q: "How do payments work?",
        a: "A 50% advance confirms your booking, by UPI or bank transfer. The balance is due 7 days before check-in. We send a receipt for every payment, and a GST invoice on request.",
      },
      {
        q: "Is there a security deposit?",
        a: "Yes, a refundable deposit between ₹8,000 and ₹20,000 depending on the villa, paid with the balance. It is returned within 3 working days of check-out.",
      },
      {
        q: "What is your cancellation policy?",
        a: "Cancel 15 or more days before check-in for a full refund of the advance, minus payment charges. Cancel 7 to 14 days before for a 50% refund. Within 7 days the booking is non-refundable, but we will always try to move your dates instead. Peak dates follow a separate policy.",
      },
    ],
  },
  {
    id: "stay",
    title: "During your stay",
    items: [
      {
        q: "Are meals included?",
        a: "Breakfast is included at every villa. Lunch and dinner are cooked to order by the caretaker family or the villa kitchen, and charged per person per meal. You can also bring in your own food.",
      },
      {
        q: "Can we bring our pet?",
        a: "Amaltas House, Palash Farm, Mahua Farm and Shipra Farm welcome pets, with a ₹1,000 cleaning fee per stay. Use the 'pet-friendly' filter on the villas page to see them.",
      },
      {
        q: "Can we play music and have a party?",
        a: "Indoors, yes, at a reasonable volume. Outdoor music stops at 10:30 pm in line with local rules. Celebrations with guests from outside your group need approval in advance and an event charge.",
      },
      {
        q: "Is alcohol allowed?",
        a: "It depends on where the villa is. Our Ujjain and Omkareshwar villas are alcohol-free, as they fall in holy towns. At the others you may bring your own for private consumption. We confirm the rule for your villa when you enquire.",
      },
      {
        q: "Is there power backup and Wi-Fi?",
        a: "Every villa has inverter or generator backup for lights, fans and the kitchen. Most have Wi-Fi; mobile signal varies on the ridge and in Mandu, and each villa page says what to expect.",
      },
      {
        q: "What are the check-in and check-out times?",
        a: "Usually 1 pm and 11 am; each villa page shows its exact times. Early check-in and late check-out are possible when the dates either side are free.",
      },
    ],
  },
  {
    id: "celebrations",
    title: "Celebrations",
    items: [
      {
        q: "Can you decorate the villa for a birthday or anniversary?",
        a: "Yes. Tell us the occasion, colours and number of guests and we send a mood board on WhatsApp. Set-ups start at ₹4,500 and are in place before you arrive.",
      },
      {
        q: "How many outside guests can we invite for a function?",
        a: "Palash Farm can host up to 60 and Shipra Farm up to 80 for a daytime or evening function, with approval and an event charge. Overnight guests are limited to each villa's capacity.",
      },
    ],
  },
];

/** The six shown on the home page */
export const homeFaqs: Faq[] = [
  faqGroups[0].items[0],
  faqGroups[0].items[1],
  faqGroups[2].items[0],
  faqGroups[2].items[1],
  faqGroups[1].items[2],
  faqGroups[2].items[3],
];
