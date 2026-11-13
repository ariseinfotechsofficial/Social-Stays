import { bookingSteps, ownerBenefits, ownerCriteria, ownerSteps } from "./data/company.js";

type Img = (key: string, alt?: string) => unknown;
type SeedPage = { seo?: { title?: string; description?: string }; sections: Record<string, { enabled?: boolean; data: Record<string, unknown> }> };

/** The copy that used to be written into each page file, now the starting content of the page editor. */
export function defaultPages(img: Img): Record<string, SeedPage> {
  return {
    shared: {
      sections: {
        ownerBand: {
          data: {
            image: img("site/owners-hero"),
            title: "Own a villa or farmhouse near Indore?",
            body: "We look after the photography, the listing, the guests and the bookings. You keep your home, your calendar and your weekends when you want them.",
            primaryLabel: "Partner with us",
            primaryHref: "/owners",
            secondaryLabel: "How partnership works",
            secondaryHref: "/owners#how-it-works",
          },
        },
        instagram: {
          data: {
            title: "Weekends at our villas, on Instagram",
            linkLabel: "Follow @{handle}",
            images: ["villas/sunset-ridge/01", "experiences/thali", "villas/baobab-house/02", "occasions/birthday", "destinations/omkareshwar/boats", "villas/palash-farm/07"].map((k) => img(k)),
          },
        },
      },
    },

    home: {
      sections: {
        hero: {
          data: {
            line1: "Private villas,",
            line2: "an easy drive from Indore",
            intro: "Whole-villa stays in Jaam Gate, Mandu, Omkareshwar and Ujjain, hosted by the families who own them.",
            image: img("villas/shipra-farm/01", "Shipra Farm at dusk: a stone farmhouse with lit windows, a lawn and a long pool"),
            caption: "Pictured: Shipra Farm, Ujjain",
            captionHref: "/villas/shipra-farm",
            submitLabel: "Check availability",
            mobileNote: "No payment to enquire. We reply on WhatsApp, usually within 30 minutes.",
          },
        },
        destinations: {
          data: {
            title: "Pick a destination",
            intro: "Four places we know well, each an easy drive from Indore.",
            linkLabel: "Explore destinations",
            helpText: "Not sure which suits your group?",
            helpLinkLabel: "Ask us on WhatsApp",
            helpMessage: "Hello Social Stays, can you suggest a destination for our group?",
          },
        },
        collection: {
          data: {
            title: "The collection",
            intro: "Eight homes open now and one on the way. Each one visited, photographed and hosted by the family who owns it.",
            linkLabel: "View all villas",
            panelPoints: ["The whole villa, only your group", "Hosted by the owner family", "Home-cooked meals on request"],
            panelButtonLabel: "Ask about {category} stays",
            panelLinkLabel: "See {category} stays",
          },
        },
        experiences: {
          data: {
            eyebrow: "Add to your stay",
            title: "Experiences",
            intro: "Arranged by your host. Just mention it in your WhatsApp enquiry.",
            linkLabel: "All experiences",
            items: ["malwa-thali", "bonfire-evening", "celebration-decor", "candlelit-dinner"],
          },
        },
        howItWorks: {
          data: {
            title: "Booking takes one WhatsApp message",
            intro: "No accounts, no payment forms. Tell us your dates and we send one clear quote, usually within half an hour.",
            steps: bookingSteps,
            chatStatus: "Usually replies within 30 minutes",
            chatRequest: "Hello Social Stays, I'd like to check availability.\n\nVilla: Amaltas House, Jaam Gate\nDates: Fri 14 Nov – Sun 16 Nov (2 nights)\nGuests: 10\nOccasion: Birthday",
            chatSource: "Source: Instagram ad",
            chatSentAt: "7:42 pm",
            chatReply: "Hi Priya! Amaltas House is free on 14–16 Nov. For 10 guests it's ₹45,000 for two nights, breakfast included. Shall I add the birthday décor and a barbecue dinner?",
            chatReplyAt: "7:58 pm",
          },
        },
        reviews: { data: { title: "From recent guests", image: img("site/guests-lawn") } },
        faq: {
          enabled: false,
          data: { title: "Questions, answered", intro: "Booking, meals, pets and the rest of what guests ask us most.", linkLabel: "All FAQs" },
        },
        ownerBand: { data: {} },
        instagram: { data: {} },
      },
    },

    villas: {
      seo: {
        title: "Villas & farmhouses near Indore with private pools",
        description:
          "Browse private villas and farmhouses near Indore in Jaam Gate, Mandu, Omkareshwar and Ujjain. Filter by luxury or budget, private pool, group size and pet-friendly. Whole-villa stays from ₹14,500 a night.",
      },
      sections: {
        header: {
          data: {
            title: "Our villas",
            intro: "Booked whole, for your group only. Prices are per night for the entire property; meals and set-ups are added to your quote.",
            allLabel: "All",
            poolLabel: "Private pool",
            groupLabel: "{n}+ guests",
            groupSize: 12,
            petsLabel: "Pet friendly",
            emptyTitle: "No villa matches all of that yet.",
            emptyBody: "Try fewer filters, or tell us what you need on WhatsApp. New villas join the collection every month.",
            emptyReset: "Show all villas",
          },
        },
      },
    },

    villa: {
      sections: {
        labels: {
          data: {
            enquireLabel: "Enquire for {villa}",
            notifyLabel: "Notify me when it opens",
            sleepTitle: "Where you'll sleep",
            amenitiesTitle: "What's at the villa",
            mealsTitle: "Meals and add-ons",
            addOnsLinkLabel: "See all experiences",
            goodToKnowTitle: "Good to know",
            depositNote: "refunded within 3 working days",
            rulesTitle: "House rules",
            locationTitle: "Where it is",
            locationNote: "The map shows the approximate area; we share the exact location and directions when you book.",
            reviewsTitle: "What guests say",
            similarTitle: "You might also like",
            cardNote: "No payment needed to enquire.",
            callPrompt: "Prefer to talk?",
            waitlistBody: "Be the first to hear when {villa} opens. We will send photos and opening dates on WhatsApp.",
            waitlistLabel: "Join the list",
          },
        },
      },
    },

    destinations: {
      seo: {
        title: "Weekend destinations near Indore: Jaam Gate, Mandu, Omkareshwar, Ujjain",
        description: "Four weekend destinations within 2½ hours of Indore, each with private villas and farmhouses. Drive times, things to do and where to stay.",
      },
      sections: {
        header: {
          data: {
            title: "Four places, one easy drive",
            intro:
              "A ridge above the Narmada, a plateau of Afghan palaces, a temple island and one of India's oldest cities. All between one and two and a half hours from Indore.",
          },
        },
        list: { data: { linkLabel: "Stays and things to do in {name}" } },
      },
    },

    destination: {
      sections: {
        labels: {
          data: {
            heroTitle: "Villas in {name}",
            ctaLabel: "Check availability",
            whyTitle: "Why stay in {name}",
            planTitle: "Plan the trip",
            staysTitle: "Where to stay in {name}",
            suggestTitle: "Not sure which villa suits your group?",
            suggestBody: "Tell us who is coming and what you are planning. We will suggest the right home in {name}, or a better fit nearby.",
            suggestButton: "Ask on WhatsApp",
            thingsTitle: "Things to do around {name}",
            faqTitle: "{name}, answered",
            faqIntro: "The questions we hear most about staying in {name}.",
          },
        },
      },
    },

    experiences: {
      seo: {
        title: "Experiences & add-ons: Malwa thali, bonfires, BBQ, celebration décor",
        description:
          "Add home-cooked Malwa thalis, bonfire evenings, barbecue dinners, celebration décor and private chefs to your villa stay near Indore. Indicative prices inside.",
      },
      sections: {
        hero: {
          data: {
            image: img("site/experiences-hero"),
            title: "Add to your stay",
            intro: "Food from the villa kitchen, fires on the lawn and celebrations set up before you arrive. Ask for any of these in your enquiry.",
            buttonLabel: "",
          },
        },
        list: {
          data: {
            note: "Prices are indicative and per the unit shown. Your WhatsApp quote confirms the final amount, along with what is possible at the villa you choose.",
          },
        },
        cta: { data: { title: "Tell us what you'd like and we'll add it to your quote", buttonLabel: "Check availability" } },
      },
    },

    about: {
      seo: {
        title: "About Social Stays",
        description: "Social Stays is a small Indore team curating private villas and farmhouses around the city, hosted by the families who own them.",
      },
      sections: {
        hero: {
          data: { image: img("site/about-hero"), title: "We started with one question", intro: "Where can all of us stay together for a weekend that isn't a hotel?", buttonLabel: "" },
        },
        story: {
          data: {
            lead: "Social Stays began in 2021, when our families kept asking the same thing every Diwali, every birthday and every long weekend. Hotels split everyone across floors. Resorts were full of other people's parties.",
            paragraphs: [
              "Meanwhile, around Indore, families who had built beautiful weekend homes were leaving them empty most of the year. Farmhouses near Mhow, an old house in Mandu, a villa above the Narmada.",
              "So we started introducing one to the other. Today we look after a small collection of homes within two and a half hours of the city, each one still lived in and hosted by the family that owns it. We keep the collection small on purpose, so we can know every house, and every host, well.",
            ],
            image: img("site/family-diwali"),
          },
        },
        values: {
          data: {
            title: "How we work",
            items: [
              {
                title: "We stay before we list",
                body: "Every villa is visited and slept in by someone on our team before it joins the collection. If we wouldn't bring our own families, it doesn't go on the site.",
              },
              {
                title: "Hosts, not managers",
                body: "The owner families cook, welcome you and answer the door. We look after everything before you arrive, so they can look after you once you do.",
              },
              {
                title: "Straight answers on WhatsApp",
                body: "One quote with everything in it, the real photos of the real rooms, and someone who replies. That's the whole booking process.",
              },
            ],
          },
        },
        team: { data: { title: "The team", intro: "Four of us in Indore, and the families who host you at every villa." } },
        ownerBand: { data: {} },
      },
    },

    faq: {
      seo: {
        title: "FAQ: booking, payments and stays",
        description:
          "Answers about booking a Social Stays villa near Indore: how booking on WhatsApp works, payments, cancellations, meals, pets, music and alcohol rules.",
      },
      sections: {
        header: { data: { title: "Questions, answered", intro: "How booking on WhatsApp works, payments and cancellations, and what to expect at the villa." } },
        sidebar: { data: { title: "Still wondering?", body: "Ask us anything on WhatsApp.", buttonLabel: "Chat with us" } },
      },
    },

    contact: {
      seo: {
        title: "Contact Social Stays",
        description: "WhatsApp, call or email the Social Stays team in Indore. We reply on WhatsApp from 9 am to 10 pm, every day.",
      },
      sections: {
        header: { data: { title: "Talk to us", intro: "We reply on WhatsApp from 9 am to 10 pm, every day. Calls are welcome from 10 am to 7 pm." } },
        channels: { data: { whatsappLabel: "WhatsApp", whatsappValue: "Fastest for bookings", callLabel: "Call", emailLabel: "Email", instagramLabel: "Instagram" } },
        form: { data: { title: "Check availability", intro: "The form opens WhatsApp with your details filled in." } },
        office: { data: { title: "Our office", note: "Indore, Madhya Pradesh. Visits by appointment.", zoom: 13 } },
      },
    },

    owners: {
      seo: {
        title: "List your villa or farmhouse near Indore",
        description:
          "Own a villa or farmhouse within 2½ hours of Indore? Partner with Social Stays for photography, listing, vetted guests and monthly payouts. You keep control of your calendar.",
      },
      sections: {
        hero: {
          data: {
            image: img("site/owners-hero"),
            title: "Your villa, looked after and booked",
            intro: "We partner with families who own villas and farmhouses around Indore. You keep your home and your weekends; we bring the right guests.",
            buttonLabel: "Tell us about your property",
          },
        },
        benefits: { data: { title: "What partnering with us looks like", items: ownerBenefits } },
        process: {
          data: { title: "How partnership works", steps: ownerSteps, image: img("villas/palash-farm/03"), criteriaTitle: "What we look for", criteria: ownerCriteria },
        },
        form: {
          data: {
            title: "Tell us about your property",
            intro: "A few details and a link to some photos is enough. We reply within two working days.",
            prompt: "Prefer to talk first?",
            linkLabel: "Message us on WhatsApp",
            message: "Hello Social Stays, I own a property near Indore and would like to know about partnering with you.",
            submitLabel: "Send property details",
            successTitle: "Thank you, we have your details",
            successBody: "Someone from our partnerships team will call you within two working days to talk about your property and arrange a visit.",
            privacyNote: "We use these details only to get in touch about a partnership.",
          },
        },
      },
    },

    booking: {
      seo: { title: "Your booking", description: "Book a private villa near Indore with Social Stays." },
      sections: {
        labels: {
          data: {
            bookLabel: "Book now",
            requestLabel: "Request to book",
            orEnquire: "or ask us on WhatsApp first",
            checkoutTitle: "Confirm and pay",
            checkoutIntro: "Check your stay, add anything you'd like, and pay securely with Razorpay. Your dates are held while you pay.",
            requestIntro: "Send your request and our team will confirm within a few hours. You pay only once we approve it.",
            payLabel: "Pay and confirm",
            submitRequestLabel: "Send booking request",
            confirmedBody: "Your villa is booked. We've sent the details to your email, and your host's number and directions reach you the day before you arrive.",
            requestedBody: "We have your request. Our team will check the dates and get back to you on WhatsApp and email, usually within a few hours.",
            termsNote: "By booking you agree to our terms of stay and the villa's cancellation policy.",
            manageIntro: "Enter your booking reference and the phone number you booked with.",
          },
        },
      },
    },

    "not-found": {
      sections: {
        content: {
          data: {
            eyebrow: "Page not found",
            title: "This road doesn't lead to a villa",
            body: "The page may have moved, or the link has a typo. Start from the villas, or pick a destination.",
            primaryLabel: "Browse villas",
            primaryHref: "/villas",
          },
        },
      },
    },
  };
}
