import type { Destination, DestinationSlug } from "@/data/types";

export const destinations: Destination[] = [
  {
    slug: "jaam-gate",
    name: "Jaam Gate",
    district: "Near Mhow, Indore district",
    driveMinutes: 70,
    distanceKm: 50,
    route: "Via Mhow and the Mandleshwar road",
    tagline: "Ridge-top stays above the Narmada valley",
    intro: [
      "Jaam Gate is an old stone gateway on the Vindhya ridge, where the road from Mhow tips over the edge and drops towards the Narmada. It is the closest of our four destinations to Indore, and the one people come back to most.",
      "The villas here sit below or along the ridge, so most have open views to the west. Come in the monsoon for cloud rolling over the hills, or in winter for clear evenings and a fire after dark.",
    ],
    bestTime: "July to February. Monsoon is green and misty; winter is clear and cool.",
    hero: "destinations/jaam-gate/hero",
    card: "destinations/jaam-gate/monsoon",
    thingsToDo: [
      {
        title: "Sunset at the gate",
        description:
          "Drive up to the gateway an hour before sunset. The viewpoint looks south over the valley, and on clear days you can trace the river towards Mandleshwar.",
        photo: "destinations/jaam-gate/hills",
        time: "1–2 hours",
      },
      {
        title: "Monsoon drives on the ghat",
        description:
          "From July the ghat road turns green and the waterfalls along it start running. Go slowly, stop often, and take an umbrella for the walk to the edge.",
        photo: "destinations/jaam-gate/rain-road",
        time: "Half day",
      },
      {
        title: "Choral dam and the forest road",
        description:
          "A quiet reservoir ringed by teak forest, twenty minutes from most of our Jaam Gate villas. Good for an early walk before breakfast.",
        photo: "destinations/jaam-gate/monsoon",
        time: "2–3 hours",
      },
      {
        title: "Day trip to Maheshwar",
        description:
          "Ahilya Fort, the long ghats on the Narmada and the handloom workshops where Maheshwari saris are still woven. About an hour from the ridge.",
        photo: "destinations/jaam-gate/maheshwar",
        time: "Full day",
      },
    ],
    faqs: [
      {
        q: "How long is the drive from Indore to Jaam Gate?",
        a: "About 1 hour 10 minutes for 50 km, via Mhow. The last stretch is a ghat road, so allow a little longer after dark or in heavy rain.",
      },
      {
        q: "Is Jaam Gate good in the monsoon?",
        a: "It is at its best. From July to September the ridge is green, the clouds sit low and the seasonal waterfalls are running. Roads stay open, but we share any closures on WhatsApp before you leave.",
      },
      {
        q: "Are the villas close to the viewpoint?",
        a: "Most are 5 to 15 minutes from the gate itself. Each villa page shows its approximate location on the map.",
      },
    ],
    coordinates: { lat: 22.4204, lng: 75.6969 },
    seo: {
      title: "Villas & farmhouses at Jaam Gate, near Indore",
      description:
        "Private villas with pools on the Vindhya ridge at Jaam Gate, 1 hr 10 min from Indore. Whole-villa stays for families, friends and celebrations. Enquire on WhatsApp.",
    },
  },
  {
    slug: "mandu",
    name: "Mandu",
    district: "Dhar district",
    driveMinutes: 135,
    distanceKm: 95,
    route: "Via Dhar",
    tagline: "Afghan palaces, baobabs and monsoon mist",
    intro: [
      "Mandu is a walled plateau of fifteenth-century palaces, tombs and step-wells, with the plain falling away on every side. In the monsoon the ruins sit in cloud and the lakes around Jahaz Mahal fill to the brim.",
      "Our Mandu homes are built in the local way, with arches, courtyards and thick walls that stay cool in summer, and they make a calm base for two or three days of slow sightseeing.",
    ],
    bestTime: "July to March. Monsoon for mist and full lakes; winter for long days among the monuments.",
    hero: "destinations/mandu/hero",
    card: "destinations/mandu/jahaz-mahal",
    thingsToDo: [
      {
        title: "Jahaz Mahal and Hindola Mahal",
        description:
          "The 'ship palace' between two lakes, and the audience hall next to it with its sloping walls. Go at opening time, before the day-trip buses arrive.",
        photo: "destinations/mandu/jahaz-mahal",
        time: "2–3 hours",
      },
      {
        title: "Hoshang Shah's tomb",
        description:
          "Often called India's first marble building, and said to have been studied by the architects of the Taj Mahal. Lovely in late afternoon light.",
        photo: "destinations/mandu/hoshang-tomb",
        time: "1 hour",
      },
      {
        title: "Rani Roopmati's pavilion",
        description:
          "Domed pavilions on the southern edge of the plateau, looking down towards the Narmada. The place to be at sunset.",
        photo: "destinations/mandu/pavilion",
        time: "1–2 hours",
      },
      {
        title: "Baobabs and the old palaces",
        description:
          "Mandu's baobab trees, locally called khurasani imli, grow among the ruins. Our hosts can arrange a local guide who knows the stories behind each palace.",
        photo: "destinations/mandu/baobab",
        time: "Half day",
      },
    ],
    faqs: [
      {
        q: "How far is Mandu from Indore?",
        a: "About 95 km, or 2 hours 15 minutes by road via Dhar.",
      },
      {
        q: "How many days do we need in Mandu?",
        a: "Two nights is ideal. That gives you one unhurried day for the main monuments and a morning for the southern edge of the plateau.",
      },
      {
        q: "Can you arrange a guide?",
        a: "Yes. We work with licensed local guides for a half or full day. Add it to your enquiry and we will include it in your quote.",
      },
    ],
    coordinates: { lat: 22.3366, lng: 75.3991 },
    seo: {
      title: "Villas in Mandu — private stays near Jahaz Mahal",
      description:
        "Courtyard villas with pools in Mandu, 2 hrs 15 min from Indore. Whole-home stays close to Jahaz Mahal and the monuments. Enquire on WhatsApp.",
    },
  },
  {
    slug: "omkareshwar",
    name: "Omkareshwar",
    district: "Khandwa district",
    driveMinutes: 120,
    distanceKm: 78,
    route: "On the Khandwa road via Simrol",
    tagline: "The Narmada, the temple island and slow mornings",
    intro: [
      "Omkareshwar sits where the Narmada splits around Mandhata island, home to one of the twelve Jyotirlingas. Most people come for darshan; the ones who stay a night or two find a quieter town of ghats, boats and river light.",
      "Our villas here are set back from the temple crowds, close enough for an early visit and far enough to hear nothing but the river at night.",
    ],
    bestTime: "October to March. In the monsoon the river runs high and the boats may pause.",
    hero: "destinations/omkareshwar/hero",
    card: "destinations/omkareshwar/boats",
    thingsToDo: [
      {
        title: "Darshan at the Jyotirlinga",
        description:
          "Visit Omkareshwar and Mamleshwar on opposite banks. Early mornings on weekdays are calmest; your host will tell you the current timings.",
        photo: "destinations/omkareshwar/temple",
        time: "2–3 hours",
      },
      {
        title: "Boat ride around the island",
        description:
          "A slow loop around Mandhata island on one of the painted wooden boats, best just after sunrise or in the hour before dusk.",
        photo: "destinations/omkareshwar/boats",
        time: "45 minutes",
      },
      {
        title: "The parikrama path",
        description:
          "A 7 km walk around the island past smaller shrines and old gates, with the river below you the whole way. Start early and carry water.",
        photo: "destinations/omkareshwar/river",
        time: "3 hours",
      },
      {
        title: "Sunset at the bridge",
        description:
          "Walk onto the suspension bridge as the light turns orange over the water. The lamps on the ghats come on just after.",
        photo: "destinations/omkareshwar/sunset",
        time: "1 hour",
      },
    ],
    faqs: [
      {
        q: "How far is Omkareshwar from Indore?",
        a: "About 78 km, a 2-hour drive on the Khandwa road.",
      },
      {
        q: "Can you help with temple timings and darshan?",
        a: "Our hosts share the day's timings and the quietest windows. For special pujas, tell us in your enquiry and we will point you to the right temple office.",
      },
      {
        q: "Is alcohol allowed at the Omkareshwar villas?",
        a: "No. Omkareshwar is a holy town where liquor sales are banned, and our villas here are alcohol-free as a house rule.",
      },
    ],
    coordinates: { lat: 22.2453, lng: 76.1511 },
    seo: {
      title: "Villas in Omkareshwar — private stays by the Narmada",
      description:
        "Riverside villas and farm stays near Omkareshwar Jyotirlinga, 2 hrs from Indore. Book the whole villa for your family. Enquire on WhatsApp.",
    },
  },
  {
    slug: "ujjain",
    name: "Ujjain",
    district: "Ujjain district",
    driveMinutes: 75,
    distanceKm: 55,
    route: "On the Indore–Ujjain highway",
    tagline: "Temple mornings, garden evenings",
    intro: [
      "Ujjain is one of India's oldest cities, home to Mahakaleshwar and the ghats of the Shipra. Most of our guests come for a family darshan and stay for the evenings: a cooked dinner on the lawn after a long day in the old city.",
      "The villas are on the Indore side of town, so you can visit the temples before the crowds and be back for lunch by the pool.",
    ],
    bestTime: "October to March. Avoid the biggest festival days unless darshan is the reason for your trip.",
    hero: "destinations/ujjain/hero",
    card: "destinations/ujjain/mahakal",
    thingsToDo: [
      {
        title: "Mahakaleshwar and the Bhasma Aarti",
        description:
          "The pre-dawn Bhasma Aarti needs an online booking in advance. We help with the process and the villa kitchen will have tea ready before you leave.",
        photo: "destinations/ujjain/mahakal",
        time: "Early morning",
      },
      {
        title: "Shri Mahakal Lok",
        description:
          "The long temple corridor with its murals and lamp posts. Walk it in the evening, when it is lit and the heat has gone.",
        photo: "destinations/ujjain/mahakal-lok",
        time: "1–2 hours",
      },
      {
        title: "Evening aarti at Ram Ghat",
        description:
          "Lamps on the Shipra, bells from the riverside temples and a crowd that is mostly local. Arrive half an hour early for a spot on the steps.",
        photo: "destinations/ujjain/ghat-night",
        time: "1 hour",
      },
      {
        title: "Kal Bhairav, Harsiddhi and the old city",
        description:
          "A morning loop of the older temples, the lanes around them and the eighteenth-century observatory at Vedh Shala.",
        photo: "destinations/ujjain/shikhara",
        time: "Half day",
      },
    ],
    faqs: [
      {
        q: "How far are the villas from Mahakaleshwar temple?",
        a: "Our Ujjain villas are 20 to 30 minutes' drive from the temple, on the Indore side of the city.",
      },
      {
        q: "Can you help us book the Bhasma Aarti?",
        a: "Yes. Bookings open online on the temple's official website. We send you the steps when you confirm, and can arrange a car for the early start.",
      },
      {
        q: "Is alcohol allowed at the Ujjain villas?",
        a: "No. Ujjain is a holy city where liquor sales are banned, and all our Ujjain stays are alcohol-free as a house rule.",
      },
    ],
    coordinates: { lat: 23.1765, lng: 75.7885 },
    seo: {
      title: "Villas & farmhouses in Ujjain for families",
      description:
        "Private villas with pools near Mahakaleshwar, 1 hr 15 min from Indore. Whole-villa family stays for temple trips and celebrations. Enquire on WhatsApp.",
    },
  },
];

export const getDestination = (slug: DestinationSlug | string) => destinations.find((d) => d.slug === slug);

export const destinationName = (slug: DestinationSlug) => getDestination(slug)?.name ?? slug;
