// Data_Config: all brand, contact, policy and content data for Travel Guru Raipur.
// Pure data only: exported constants, no functions, no imports, no DOM, storage,
// clock or randomness access. Edit values here to update the whole Site.

export const BUSINESS = {
  brandName: "Travel Guru Raipur",
  shortName: "Travel Guru", // used in policy text
  logoInitials: "TG", // CSS fallback logo mark
  logo: { src: "/assets/logo.svg", alt: "Travel Guru Raipur logo" }, // SVG logo in public/assets/
  favicon: "/assets/favicon.png", // USER-SUPPLIED or generated from the logo
  ogImage: "/assets/og-image.jpg", // USER-SUPPLIED or generated, 1200x630
  heroImage: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1920&q=75", // Phuket/Krabi karst rock boats (prototype image)
  timeZone: "Asia/Kolkata", // business calendar for server-side "today"
  tagline: "Your Journey, Our Priority",
  motto: "Fly | Stay | Explore | Experience",
  website: "https://travelgururaipur.com/",
  email: "travelguru008@gmail.com",
  phones: [
    // display order from the poster
    { display: "+91 91719 95559", tel: "+919171995559" },
    { display: "+91 95842 97000", tel: "+919584297000" },
    { display: "+91 93406 41769", tel: "+919340641769" },
  ],
  whatsapp: "919171995559", // digits only, E.164 without "+"
  instagram: "https://www.instagram.com/travelgururaipur/", // PLACEHOLDER — confirm handle
  facebook: "https://www.facebook.com/travelgururaipur/",   // PLACEHOLDER — confirm handle
  expert: {
    name: "Pranav Dubey",
    role: "Founder, Travel Guru Raipur",
    bio: "Plans every trip personally, from visa paperwork to the last hotel check-in.", // PLACEHOLDER
    photo: "/assets/founder.jpg", // USER-SUPPLIED
  },
  address:
    "1st Floor, Currency Tower, Shop No 1087, 1088, VIP Chowk, Telibandha, Raipur, Chhattisgarh 492001",
  originCity: { name: "Raipur", iata: "RPR" }, // default quote departure city
  baseCurrency: "INR",
  paymentPolicy: {
    thresholdPerPersonINR: 25000, // below this: 100% at booking
    advanceRate: 0.5, // otherwise 50% advance
    balanceDueDaysBefore: 21, // balance due 21 days prior to departure
    fullPaymentWithinDays: 21, // daysUntilDeparture < 21 -> 100% (PLACEHOLDER boundary, confirm)
  },
  quoteValidityHours: 24,
  callbackHours: 24,
  whatsappResponseMins: 10,
  ticketPrefix: "QT",
  bookingPrefix: "BK",
  rating: { score: 4.9, count: null }, // count PLACEHOLDER; hidden while null
  badges: ["Verified", "Trusted"],
};

export const LEAD_STATUSES = ["new", "contacted", "quoted", "closed"];
export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled"];

// Best-effort, per server instance (see Security Considerations).
export const RATE_LIMITS = {
  quote: { limit: 5, windowMs: 10 * 60 * 1000 },
  booking: { limit: 5, windowMs: 10 * 60 * 1000 },
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
};

export const API_LIMITS = { maxBodyBytes: 16384, maxIdAttempts: 5, clientTimeoutMs: 10000 };

// Hosts allowed for package / destination images (mirrored in the CSP img-src).
// The Supabase Storage host is added at call sites from NEXT_PUBLIC_SUPABASE_URL.
export const IMAGE_HOSTS = ["images.unsplash.com"];

// Phrases that must never appear in content (Requirement 32), also enforced by validatePackage.
export const FORBIDDEN_CLAIMS = ["100% refundable", "25% deposit", "450+ airlines", "iata-style"];

// rate = units of currency per 1 INR. Static, INDICATIVE (PLACEHOLDER values, confirm).
export const CURRENCIES = {
  INR: { symbol: "₹", rate: 1, locale: "en-IN", decimals: 0 },
  USD: { symbol: "$", rate: 0.012, locale: "en-US", decimals: 0 },
  EUR: { symbol: "€", rate: 0.011, locale: "de-DE", decimals: 0 },
  GBP: { symbol: "£", rate: 0.0095, locale: "en-GB", decimals: 0 },
  AUD: { symbol: "A$", rate: 0.018, locale: "en-AU", decimals: 0 },
  AED: { symbol: "AED ", rate: 0.044, locale: "en-AE", decimals: 0 },
  SGD: { symbol: "S$", rate: 0.016, locale: "en-SG", decimals: 0 },
};

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "international", label: "International" },
  { id: "domestic", label: "Domestic" },
  { id: "honeymoon", label: "Honeymoon" },
  { id: "family", label: "Family" },
  { id: "beach", label: "Beach & Islands" },
];

export const TIER_IDS = ["deluxe", "superior", "premium"];

export const HOTEL_CATEGORIES = ["3★", "4★", "5★", "Deluxe", "Superior", "Premium", "Any"];

export const MEAL_PLANS = ["Breakfast only", "Breakfast + Dinner", "All meals", "Any"]; // optional quote field

export const TRIP_TYPES = ["Honeymoon", "Family", "Friends", "Solo", "Group", "Corporate"];

export const DURATIONS = ["3-4 days", "5-7 days", "8-10 days", "11-14 days", "15+ days"];

export const BUDGETS = ["Value", "Premium", "Luxury", "Ultra-Luxury"];

export const LIMITS = {
  adults: [1, 12],
  children: [0, 8],
  childAgesMaxLength: 100,
  // text limits shared by client and server validation (and mirrored by DB check constraints)
  fullName: [2, 80],
  departureCityMax: 80,
  destinationsMax: 200,
  emailMax: 254,
  phoneMax: 20,
  notesMax: 1000,
};

export const CALLBACK_SLOTS = [
  { id: "anytime", label: "Anytime (Fastest)", startHour: null, endHour: null },
  { id: "morning", label: "Morning (9:00 AM – 12:00 PM)", startHour: 9, endHour: 12 },
  { id: "afternoon", label: "Afternoon (12:00 PM – 4:00 PM)", startHour: 12, endHour: 16 },
  { id: "evening", label: "Evening (4:00 PM – 8:00 PM)", startHour: 16, endHour: 20 },
];

export const QUOTE_SERVICE_OPTIONS = [
  "Flights",
  "Hotels",
  "Passport",
  "Visa",
  "Holidays",
  "Train",
  "Packages",
];

// CSS token names of the service icon circle colours, in SERVICES order.
export const SERVICE_ACCENTS = [
  "--svc-blue",
  "--svc-orange",
  "--svc-green",
  "--svc-pink",
  "--svc-purple",
  "--svc-red",
  "--svc-violet",
];

// 8 services, poster order. accent = CSS token name of the icon circle colour.
// quoteOption maps one-to-one onto QUOTE_SERVICE_OPTIONS.
export const SERVICES = [
  {
    id: "flights",
    icon: "plane",
    title: "Flights",
    subtitle: "Domestic & International",
    quoteOption: "Flights",
    accent: "--svc-blue",
    summary: "Domestic and international air tickets at good fares, booked and tracked for you.",
    bullets: ["One-way, return and multi-city", "Fare comparison across airlines", "Date changes and web check-in help"],
  },
  {
    id: "hotels",
    icon: "hotel",
    title: "Hotels",
    subtitle: "Best Stays Worldwide",
    quoteOption: "Hotels",
    accent: "--svc-orange",
    summary: "Handpicked hotels and resorts for every budget, in India and abroad.",
    bullets: ["3★ to 5★ and boutique stays", "Meal plans to suit you", "Confirmed bookings with vouchers"],
  },
  {
    id: "holidays",
    icon: "palm",
    title: "Holidays",
    subtitle: "Domestic & International Packages",
    quoteOption: "Holidays",
    accent: "--svc-green",
    summary: "Ready and tailor-made holidays across India and abroad, planned end to end.",
    bullets: ["Honeymoon, family and friends trips", "Hotels, transfers and sightseeing", "Day-by-day itinerary"],
  },
  {
    id: "packages",
    icon: "suitcase",
    title: "Packages",
    subtitle: "Customized & Group Tour Packages",
    quoteOption: "Packages",
    accent: "--svc-pink",
    summary: "Customized and group tour packages built around your dates, budget and group size.",
    bullets: ["Family, corporate and group tours", "Pilgrimage and special-interest trips", "One point of contact throughout"],
  },
  {
    id: "passport",
    icon: "passport",
    title: "Passport",
    subtitle: "New / Renewal Assistance",
    quoteOption: "Passport",
    accent: "--svc-purple",
    summary: "Guidance for new passport applications and renewals, from forms to appointment.",
    bullets: ["Document checklist", "Online form and appointment help", "Tatkal guidance where eligible"],
  },
  {
    id: "visa",
    icon: "visa",
    title: "Visa",
    subtitle: "Tourist / Business Visa Support",
    quoteOption: "Visa",
    accent: "--svc-red",
    summary: "Tourist and business visa support with document review and application filing.",
    bullets: ["Country-wise document checklist", "Application and appointment support", "Status follow-up"],
  },
  {
    id: "train",
    icon: "train",
    title: "Train",
    subtitle: "IRCTC Ticket Booking & Assistance",
    quoteOption: "Train",
    accent: "--svc-violet",
    summary: "IRCTC train ticket booking and assistance for journeys across India.",
    bullets: ["Reserved class bookings", "Tatkal booking help", "PNR and cancellation support"],
  },
];

export const REVIEWS = [
  {
    quote: "As we returning Tommorow.. I want to Thank everyone for making these 7 days memorable.. Literally we enjoyed alot, best service, best people nd everything very convenient… For you it may b daily things.. but for us it was like one's in a life.. tht also you made one of best moments of our life.. Big salute to all of you.. 😁🙏🙏🙏 Thankyou Travel guru for choosing such a best team…",
    name: "Shahenshah Singh",
    city: "Raipur",
    destination: null,
    rating: 5,
  },
  {
    quote: "Travel Guru Raipur is one of the best travel agency you can contact for planning your next vacation, organizing a outstation meeting or any event. They are highly professional and understand their customer's needs. Here I have shared few glimpse of my recent vacation to Kashmir. The property selection for my stay was beautiful by Travel Guru. Special thanks to Mr Pranav Dubey and his colleague.",
    name: "Prabhakar Rai",
    city: "Raipur",
    destination: "Kashmir",
    rating: 5,
  },
  {
    quote: "We booked our trip to Mauritius with Travel Guru and the trip was amazing. We received help when required and never felt helpless. Even when our connecting flight got delayed and we called Mr Pranav Dubey at 4 am he helped us and guided us on what to do. I would give him 10 stars if I could.",
    name: "Yash Misra",
    city: "Raipur",
    destination: "Mauritius",
    rating: 5,
  },
];

// Operations FAQ. Answers to confirm with the agency. No cruise or forex entries and
// no "No booking fees" claim until confirmed. `link` is optional (rendered after the answer).
export const FAQ = [
  {
    q: "How does an independent agency get good fares?",
    a: "We compare fares and hotel rates across airlines, hotels and trusted travel suppliers, then build your quote with the best options we find for your dates.",
  },
  {
    q: "Can you help with a new passport or renewal?",
    a: "Yes. We guide you through new passport applications and renewals, including the document checklist, online form and appointment booking.",
  },
  {
    q: "Which visas do you support?",
    a: "We support tourist and business visa applications for popular destinations, with document review, application filing and status follow-up. Visas are issued at the embassy's discretion.",
  },
  {
    q: "Can you book IRCTC train tickets for me?",
    a: "Yes. We book IRCTC train tickets across India and help with Tatkal bookings, PNR status and cancellations.",
  },
  {
    q: "Can you build a customized or group package?",
    a: "Yes. Tell us your dates, destinations, group size and budget, and we will build a customized or group tour package with hotels, transfers and sightseeing.",
  },
  {
    q: "How much do I pay to book?",
    // Built from BUSINESS.paymentPolicy so the wording follows the policy values.
    a:
      `If the package costs less than ₹${BUSINESS.paymentPolicy.thresholdPerPersonINR.toLocaleString("en-IN")} per person, ` +
      `100% is payable at booking. Otherwise you pay a ${BUSINESS.paymentPolicy.advanceRate * 100}% advance, ` +
      `with the balance due ${BUSINESS.paymentPolicy.balanceDueDaysBefore} days before departure. ` +
      `If you book within ${BUSINESS.paymentPolicy.fullPaymentWithinDays} days of departure, 100% is payable at booking.`,
  },
  {
    q: "What is your cancellation policy?",
    a: "Cancellation must be requested in writing by the lead passenger. Charges apply on the total package cost and increase as the departure date gets closer, from 10% at 46 days or more to 100% within 7 days or for a no show.",
    link: { href: "#terms-cancellation", label: "See the full cancellation table" },
  },
  {
    q: "How do you accept payments?",
    // PLACEHOLDER: confirm the exact accepted payment methods with the agency.
    a: `Payment details are shared with your confirmed quotation, and a booking is confirmed only after payment is received and a confirmation is issued by ${BUSINESS.shortName}. Card payment on this website is a demo and no card is charged.`,
  },
];

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Real packages from the agency's quotations (design section 6.2).
// Prices are land package per person in whole INR; extras are priced separately and
// never added to the package total. image = Unsplash PLACEHOLDER, replace with own photos.
export const PACKAGES = [
  {
    id: "bali-6n7d",
    title: "Trip to Bali, Indonesia",
    destination: "Bali, Indonesia",
    region: "international",
    categories: ["international", "beach", "honeymoon", "family"],
    seasons: [10, 11, 12, 1, 2, 3],
    nights: 6,
    days: 7,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=70", // PLACEHOLDER
    highlights: ["Private pool villa in Ubud", "Nusa Penida West Tour", "Uluwatu Kecak Dance"],
    hotelStarRating: 4,
    mealPlan: "Breakfast in hotel",
    transferBasis: "Private transfers throughout",
    tiers: [
      {
        id: "deluxe",
        label: "Deluxe",
        hotelLabel: "Superior",
        adultPriceINR: 39000,
        childPriceINR: 15000,
        hotels: [
          { location: "Ubud", nights: 3, names: ["Barong Resort Ubud"], roomType: "One Bedroom Pool Villa" },
          { location: "Seminyak", nights: 3, names: ["Metland Seva Seminyak"], roomType: "Double Bed Room" },
        ],
      },
      {
        id: "premium",
        label: "Premium",
        adultPriceINR: 48000,
        childPriceINR: 16000,
        hotels: [
          { location: "Ubud", nights: 3, names: ["Furama Xclusive Resort"], roomType: "Villa, Private Pool" },
          { location: "Seminyak", nights: 3, names: ["Four Points by Sheraton"], roomType: "Double Bed Room" },
        ],
      },
    ],
    extras: {
      flightFareINR: 60000,
      flightNote: "Indicative round trip Raipur–Denpasar via Delhi/Mumbai (IndiGo). Dynamic fare, subject to change.",
      visa: null,
      onArrivalCharges: [
        "Visa on arrival: IDR 500,000 (approx. USD 35–40), payable by tourist",
        "International tourism levy: IDR 150,000, payable by tourist",
      ],
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival & transfer to Ubud",
        transferType: "private",
        description: "Pickup from Bali (DPS) Airport and transfer to your Ubud hotel.",
      },
      {
        day: 2,
        title: "Kintamani Tour",
        transferType: "private",
        description:
          "Mount Batur view, coffee plantation, Tegalalang Rice Terraces, Tegenungan Falls, Bali Jungle Swing (lunch not included) and Ubud Art Market.",
      },
      {
        day: 3,
        title: "Ubud Waterfalls Tour",
        transferType: "private",
        description: "Kanto Lampo Falls, Tibumana Falls and Pura Tirta Empul.",
      },
      {
        day: 4,
        title: "Balinese massage & transfer to Seminyak",
        transferType: "private",
        description: "120-minute traditional Balinese massage at Kalpika Ubud, then transfer to your Seminyak hotel.",
      },
      {
        day: 5,
        title: "Watersports & Uluwatu",
        transferType: "private",
        description:
          "Full-day watersports (banana boat, jet ski, parasailing) and Uluwatu Temple with Kecak Dance.",
      },
      {
        day: 6,
        title: "Nusa Penida West Tour",
        transferType: "private",
        description: "Kelingking Beach, Broken Beach and Angel Billabong, with Indian lunch and 2-way ferry.",
      },
      {
        day: 7,
        title: "Departure",
        transferType: "private",
        description: "Pickup from hotel and transfer to Bali (DPS) Airport.",
      },
    ],
  },
  {
    id: "dubai-4n5d",
    title: "Trip to Dubai",
    destination: "Dubai, UAE",
    region: "international",
    categories: ["international", "family"],
    seasons: [10, 11, 12, 1, 2, 3, 4],
    nights: 4,
    days: 5,
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=70", // PLACEHOLDER
    highlights: ["At the Top Burj Khalifa", "Desert Safari with BBQ dinner", "Abu Dhabi & Ferrari World"],
    hotelStarRating: null,
    mealPlan: "Breakfast only",
    transferBasis: "Private airport transfers; tours on sharing basis",
    tiers: [
      {
        id: "deluxe",
        label: "Deluxe",
        adultPriceINR: 36000,
        childPriceINR: null,
        hotels: [{ location: "Dubai", nights: 4, names: ["Luxe Avenue", "Orchid Vue"], roomType: null }],
      },
      {
        id: "superior",
        label: "Superior",
        adultPriceINR: 38000,
        childPriceINR: null,
        hotels: [
          { location: "Dubai", nights: 4, names: ["Royal Ascot", "The Canvas", "Grand Excelsior"], roomType: null },
        ],
      },
      {
        id: "premium",
        label: "Premium",
        adultPriceINR: 41000,
        childPriceINR: null,
        hotels: [{ location: "Dubai", nights: 4, names: ["Radisson Blu Barsha Heights"], roomType: null }],
      },
    ],
    extras: {
      flightFareINR: 45500,
      flightNote: "Indicative round trip Raipur–Dubai via Delhi/Mumbai (IndiGo). Dynamic fare, subject to change.",
      visa: { feeINR: 8000, type: "UAE e-visa, single entry" },
      onArrivalCharges: [],
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival & Dhow Marina Cruise",
        transferType: "mixed",
        description:
          "Arrival at Dubai (DXB), private transfer to hotel. Evening Dhow Marina Cruise with dinner (sharing transfers).",
      },
      {
        day: 2,
        title: "City Tour & Burj Khalifa",
        transferType: "sharing",
        description: "Dubai City Tour followed by At the Top Burj Khalifa, 124th floor (non-prime time tickets).",
      },
      {
        day: 3,
        title: "Desert Safari",
        transferType: "sharing",
        description: "Standard Desert Safari with BBQ dinner.",
      },
      {
        day: 4,
        title: "Abu Dhabi & Ferrari World",
        transferType: "sharing",
        description: "Abu Dhabi City Tour with Ferrari World (general tickets).",
      },
      {
        day: 5,
        title: "Shopping & departure",
        transferType: "private",
        description: "Check-out, free time for shopping, private drop to Dubai (DXB) Airport.",
      },
    ],
  },
  {
    id: "singapore-4n5d",
    title: "Trip to Singapore",
    destination: "Singapore",
    region: "international",
    categories: ["international", "family"],
    seasons: [2, 3, 4, 7, 8, 9],
    nights: 4,
    days: 5,
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=70", // PLACEHOLDER
    highlights: ["Universal Studios Singapore", "Sentosa & Wings of Time", "Gardens by the Bay"],
    hotelStarRating: 4,
    mealPlan: "Breakfast only",
    transferBasis: "Private airport transfers; tours mostly on sharing basis",
    // Per-person prices derived from the quoted group totals divided by 4 travellers
    // (3 adults + 1 child): 225000 / 4 = 56250 and 251000 / 4 = 62750.
    tiers: [
      {
        id: "deluxe",
        label: "Deluxe",
        adultPriceINR: 56250,
        childPriceINR: null,
        priceNote:
          "Indicative per person (₹2,25,000 ÷ 4) based on 3 adults + 1 child sharing a family room. Price on request for your exact group.",
        hotels: [
          {
            location: "Singapore",
            nights: 4,
            names: ["The Serangoon House, Little India"],
            roomType: "Maharaja 2 King, city view",
          },
        ],
      },
      {
        id: "premium",
        label: "Premium",
        adultPriceINR: 62750,
        childPriceINR: null,
        priceNote:
          "Indicative per person (₹2,51,000 ÷ 4) based on 3 adults + 1 child sharing a family room. Price on request for your exact group.",
        hotels: [{ location: "Singapore", nights: 4, names: ["Orchard Hotel Singapore"], roomType: "Premier Triple" }],
      },
    ],
    extras: {
      flightFareINR: 51125,
      flightNote:
        "Indicative round trip (≈ ₹2,04,500 for 4), out via Chennai, return via Kolkata. Dynamic fare, subject to change.",
      visa: { feeINR: 5000, type: "Singapore visa" },
      onArrivalCharges: [],
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival & Night Safari",
        transferType: "mixed",
        description:
          "Private one-way transfer Changi Airport to hotel (6 am–10 pm). Evening Singapore Night Safari (sharing).",
      },
      {
        day: 2,
        title: "Universal Studios Singapore",
        transferType: "sharing",
        description: "Universal Studios Singapore with sharing transfers.",
      },
      {
        day: 3,
        title: "Sentosa full day",
        transferType: "sharing",
        description: "One-way cable car + Madame Tussauds (4-in-1 combo) and Wings of Time at 7:30 pm.",
      },
      {
        day: 4,
        title: "City Tour, Marina Bay & Gardens by the Bay",
        transferType: "mixed",
        description:
          "Singapore City Tour (3 hrs, sharing). Day at Marina Bay with Marina Bay Sands ticket, 2-way private transfers. Gardens by the Bay: Cloud Forest + Flower Dome + Jurassic World: The Exhibition.",
      },
      {
        day: 5,
        title: "Departure",
        transferType: "private",
        description: "Private one-way transfer hotel to Changi Airport (6 am–10 pm).",
      },
    ],
  },
  {
    id: "kerala-5n6d",
    title: "Trip to Kerala",
    destination: "Kerala, India",
    region: "domestic",
    categories: ["domestic", "honeymoon"], // "nature" is a highlight tag, not a filter
    seasons: [10, 11, 12, 1, 2, 3],
    nights: 5,
    days: 6,
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=70", // PLACEHOLDER
    highlights: ["Alleppey houseboat night", "Munnar tea gardens", "Athirappilly Waterfalls", "Nature"],
    hotelStarRating: 4,
    mealPlan: "Breakfast + Dinner; all meals onboard houseboat",
    transferBasis:
      "Sedan car, point-to-point transfers (not at disposal); tolls, parking, driver allowance and fuel included",
    tiers: [
      {
        id: "deluxe",
        label: "Deluxe",
        hotelLabel: "Superior",
        adultPriceINR: 28500,
        childPriceINR: null,
        hotels: [
          { location: "Kochi", nights: 1, names: ["Keys Select by Lemon Tree", "Starlit Suites"], roomType: null },
          {
            location: "Munnar",
            nights: 2,
            names: ["Sterling Munnar", "Southern Panorama", "Misty Mountain Resort"],
            roomType: null,
          },
          {
            location: "Thekkady",
            nights: 1,
            names: ["Keys Prima by Lemon Tree", "Holiday Vista Luxury"],
            roomType: null,
          },
          {
            location: "Alleppey",
            nights: 1,
            names: ["Southern Panorama Houseboats"],
            roomType: "Deluxe room, sharing boat, AC at night",
          },
        ],
      },
      {
        id: "premium",
        label: "Premium",
        adultPriceINR: 38500,
        childPriceINR: null,
        hotels: [
          { location: "Kochi", nights: 1, names: ["Hotel Luminara", "Luxo Kochi"], roomType: null },
          {
            location: "Munnar",
            nights: 2,
            names: ["Munnar Queen", "Fort Munnar", "Star Emirates Luxury", "Pleasant Hill Resort", "Issacs Residency"],
            roomType: null,
          },
          {
            location: "Thekkady",
            nights: 1,
            names: ["Mountain Courtyard", "Greenwoods Thekkady", "Forest Canopy", "Poetree Thekkady"],
            roomType: null,
          },
          {
            location: "Alleppey",
            nights: 1,
            names: ["Southern Panorama Houseboats"],
            roomType: "AC premium sharing room, full AC",
          },
        ],
      },
    ],
    extras: {
      flightFareINR: 20500,
      flightNote: "Indicative round trip Raipur–Kochi. Dynamic fare, subject to change.",
      visa: null,
      onArrivalCharges: [],
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival in Kochi",
        transferType: "private",
        description: "Arrival at Kochi Airport (evening, ~8 pm), private transfer to hotel. Overnight Kochi.",
      },
      {
        day: 2,
        title: "Kochi – Athirappilly – Munnar",
        transferType: "private",
        description:
          '~170 km / 5–6 hrs. Athirappilly Waterfalls ("Niagara of Kerala") and scenic photo stops. Overnight Munnar.',
      },
      {
        day: 3,
        title: "Munnar sightseeing",
        transferType: "private",
        description:
          "Mattupetty Dam & Lake, Echo Point, Kundala Lake, tea gardens, Photo Point and a tea attraction. Overnight Munnar.",
      },
      {
        day: 4,
        title: "Munnar – Thekkady",
        transferType: "private",
        description:
          "~110 km / 3.5–4 hrs through Western Ghats tea and spice plantations; spice market; optional Kathakali or Kalaripayattu show. Overnight Thekkady.",
      },
      {
        day: 5,
        title: "Thekkady – Alleppey houseboat",
        transferType: "private",
        description:
          "~145 km / 4–5 hrs. Board a traditional Kerala houseboat for a backwater cruise, all meals onboard. Overnight on houseboat.",
      },
      {
        day: 6,
        title: "Alleppey – Fort Kochi – Kochi Airport",
        transferType: "private",
        description:
          "~85 km / 2.5 hrs. En route Fort Kochi, Chinese Fishing Nets, St. Francis Church and Mattancherry/Jewish Town. Reach the airport by ~1 pm.",
      },
    ],
  },
  {
    id: "vietnam-7n8d",
    title: "Vietnam Grand Discovery",
    destination: "Vietnam (Hanoi, Da Nang, Phu Quoc, HCMC)",
    region: "international",
    categories: ["international", "family", "beach", "honeymoon"],
    seasons: [10, 11, 12, 1, 2, 3],
    nights: 7,
    days: 8,
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=70",
    highlights: [
      "Halong Bay deluxe cruise & kayaking",
      "Hoi An lanterns & basket boat ride",
      "Ba Na Hills & Golden Bridge",
      "Phu Quoc 4-island speedboat tour",
      "VinWonders theme park & Grand World",
      "Hanoi Train Street & Saigon tour",
    ],
    hotelStarRating: 4,
    mealPlan: "Breakfast in hotel; local lunches during Halong Bay & island tour",
    transferBasis: "Private airport transfers & tours; sharing cruise & island tours",
    tiers: [
      {
        id: "superior",
        label: "Superior",
        hotelLabel: "Superior Hotels",
        adultPriceINR: 60000,
        childPriceINR: null,
        priceNote:
          "₹1,20,000 for 2 adults (₹60,000 per person) land package. Hotel-only option available at ₹47,000 for 2.",
        hotels: [
          {
            location: "Hanoi",
            nights: 2,
            names: ["Classy Holiday Hotel & Spa"],
            roomType: "Classic Double Bed",
          },
          {
            location: "Da Nang",
            nights: 2,
            names: ["Grand Ocean Luxury", "Sunny Ocean"],
            roomType: "Double Bed Partial Ocean View",
          },
          {
            location: "Phu Quoc",
            nights: 2,
            names: ["AVS Hotel Phu Quoc"],
            roomType: "Deluxe Room City View",
          },
          {
            location: "Ho Chi Minh City",
            nights: 1,
            names: ["Ramana Hotel Saigon"],
            roomType: "Superior Double Bed",
          },
        ],
      },
      {
        id: "premium",
        label: "Premium",
        hotelLabel: "Luxury 5★ Upgrade",
        adultPriceINR: 76000,
        childPriceINR: null,
        priceNote:
          "Upgraded 5★ luxury stays across all four destinations, available on request.",
        hotels: [
          {
            location: "Hanoi",
            nights: 2,
            names: ["Pan Pacific Hanoi", "Peridot Grand Luxury"],
            roomType: "Deluxe Room",
          },
          {
            location: "Da Nang",
            nights: 2,
            names: ["TMS Hotel Da Nang Beach", "Furama Resort"],
            roomType: "Ocean Front Suite",
          },
          {
            location: "Phu Quoc",
            nights: 2,
            names: ["Novotel Phu Quoc Resort"],
            roomType: "Deluxe Resort Room",
          },
          {
            location: "Ho Chi Minh City",
            nights: 1,
            names: ["Caravelle Saigon", "Hotel Nikko Saigon"],
            roomType: "Deluxe Double",
          },
        ],
      },
    ],
    extras: {
      flightFareINR: 24500,
      flightNote:
        "Optional internal flights with 20 kg check-in: Hanoi→Da Nang (₹8,000), Da Nang→Phu Quoc (₹10,500), Phu Quoc→HCMC (₹6,000). Total ₹24,500 PP.",
      visa: { feeINR: 3000, type: "Vietnam e-visa (single entry, 30 days)" },
      onArrivalCharges: [
        "Compulsory tips for driver & guide: USD 5–6 per person per day (1–4 guests), payable in cash",
        "Prepaid tips subject to 10% service charge",
      ],
    },
    notes: [
      "Hotel-only option available at ₹47,000 for 2 persons with daily breakfast included.",
      "Compulsory tips policy: USD 5–6 per person/day for 1–4 guests, payable in cash during the tour.",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Hanoi & Train Street City Tour",
        transferType: "private",
        description:
          "Arrival Hanoi Airport pickup and private transfer to hotel. Half-day Hanoi city tour with Train Street (Hoan Kiem Lake, Ngoc Son Temple, The Huc Bridge, Quan Thanh Temple, and the famous Train Street) by private transfer.",
      },
      {
        day: 2,
        title: "Halong Bay Deluxe Day Cruise",
        transferType: "sharing",
        description:
          "Full-day trip to Halong Bay on a deluxe cruise with sharing transfers. Enjoy a local buffet lunch onboard, exploring Surprising Cave (Sung Sot), Titop Island panoramic summit, and kayaking or bamboo boating.",
      },
      {
        day: 3,
        title: "Fly to Da Nang & Hoi An Ancient Town Tour",
        transferType: "private",
        description:
          "Private transfer from Hanoi hotel to airport. Flight to Da Nang (optional, Vietjet). Da Nang Airport pickup and transfer to hotel. Afternoon/evening private Hoi An Ancient Town tour with basket boat ride and lantern release on the river.",
      },
      {
        day: 4,
        title: "Ba Na Hills & Golden Bridge Day Tour",
        transferType: "sharing",
        description:
          "Day trip to Ba Na Hills and Golden Bridge (cable car, French Village, and Fantasy Park indoor theme park) with sharing transfers.",
      },
      {
        day: 5,
        title: "Fly to Phu Quoc & Grand World Tour",
        transferType: "private",
        description:
          "Private transfer to Da Nang Airport and flight to Phu Quoc (optional, Vietjet). Phu Quoc Airport pickup and transfer to hotel. Afternoon Grand World tour with entry tickets included (Teddy Bear Museum and Venice-style Gondola ride) by private transfers.",
      },
      {
        day: 6,
        title: "Phu Quoc 4-Island Speedboat Tour & Cable Car",
        transferType: "sharing",
        description:
          "4-Island tour by sharing speedboat: explore Gam Ghi Island (coral snorkeling), May Rut Island, Buom Island, and Thom Island with local lunch and world's longest oversea cable car ride.",
      },
      {
        day: 7,
        title: "VinWonders Theme Park & Fly to Ho Chi Minh City",
        transferType: "private",
        description:
          "Visit Vinpearl Land (VinWonders) Phu Quoc with entry tickets and private transfers included. Evening transfer to Phu Quoc Airport, flight to Ho Chi Minh City (optional, Vietjet). Private pickup at SGN Airport and transfer to hotel.",
      },
      {
        day: 8,
        title: "Ho Chi Minh City Tour & Departure",
        transferType: "private",
        description:
          "Private city tour of Ho Chi Minh City visiting Reunification Palace, Notre Dame Cathedral, and the War Remnants Museum. Private transfer to Tan Son Nhat (SGN) Airport for departure.",
      },
    ],
  },
  {
    id: "malaysia-6n7d",
    title: "Malaysia Family Escape",
    destination: "Malaysia (Langkawi & Kuala Lumpur)",
    region: "international",
    categories: ["international", "family", "beach"],
    seasons: [1, 2, 3, 6, 7, 8, 9, 12],
    nights: 6,
    days: 7,
    image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=70",
    highlights: [
      "Langkawi Sunset Dinner Cruise",
      "SkyCab, SkyBridge & 3D Art Museum",
      "Crocodile Adventureland with Snack Combo",
      "Genting Highlands & Two-Way Cable Car",
      "Batu Caves 30-Minute Photo Stop",
      "Kuala Selangor Fireflies Tour & KL Tower",
    ],
    hotelStarRating: 4,
    mealPlan: "Breakfast in hotel; dinner onboard Langkawi sunset cruise",
    transferBasis: "Private airport transfers & private vehicle tours throughout",
    tiers: [
      {
        id: "deluxe",
        label: "Deluxe",
        hotelLabel: "3★ / 4★ Deluxe",
        adultPriceINR: 48750,
        childPriceINR: 48750,
        priceNote:
          "Indicative per person (₹1,95,000 ÷ 4) based on 3 adults + 1 child (10 yrs) sharing family room accommodation. Custom group rates on request.",
        hotels: [
          {
            location: "Langkawi",
            nights: 3,
            names: ["Dayang Bay Resort"],
            roomType: "Family Room",
          },
          {
            location: "Kuala Lumpur",
            nights: 3,
            names: ["Verdant Hill Hotel"],
            roomType: "Family Villa",
          },
        ],
      },
      {
        id: "premium",
        label: "Premium",
        hotelLabel: "Superior / Boutique 4★",
        adultPriceINR: 53000,
        childPriceINR: 53000,
        priceNote:
          "Indicative per person (₹2,12,000 ÷ 4) based on 3 adults + 1 child (10 yrs) in upgraded boutique family suites.",
        hotels: [
          {
            location: "Langkawi",
            nights: 3,
            names: ["The Serangoon House Little India", "Dayang Bay Resort (Deluxe)"],
            roomType: "Royal Classic Double + Bunk Beds",
          },
          {
            location: "Kuala Lumpur",
            nights: 3,
            names: ["Ramada Suites by Wyndham"],
            roomType: "Family Studio",
          },
        ],
      },
    ],
    extras: {
      flightFareINR: 47500,
      flightNote:
        "Indicative round trip (₹1,90,000 for family of 4) Raipur–Langkawi / KL–Raipur via Bengaluru (IndiGo/Batik Air). Dynamic fare, subject to change.",
      visa: null,
      onArrivalCharges: [
        "Malaysia Tourism Tax (TTx): MYR 10 per room per night payable at hotel check-in",
        "Mandatory Malaysia Digital Arrival Card (MDAC) online submission prior to arrival",
      ],
    },
    notes: [
      "Quoted cost is based on 3 adults + 1 child (10 yrs) sharing 1 family/triple room.",
      "Visa-free entry for Indian passport holders with online MDAC pre-registration.",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Langkawi & Sunset Dinner Cruise",
        transferType: "private",
        description:
          "One-way private transfer from Langkawi (LGK) Airport to hotel. Evening Langkawi Sunset Dinner Cruise (starts 16:00 hrs) with private hotel transfers: open sea sailing, saltwater jacuzzi net, and onboard dinner buffet.",
      },
      {
        day: 2,
        title: "Langkawi SkyCab & SkyBridge Tour",
        transferType: "private",
        description:
          "Half-day private SkyCab tour including SkyCab cable car, SkyDome, SkyRex, 3D Art Museum, and the famous curved pedestrian SkyBridge + SkyGlide.",
      },
      {
        day: 3,
        title: "Crocodile Adventureland Tour",
        transferType: "private",
        description:
          "Half-day private Crocodile Adventureland tour with Snack Bite combo ticket included. Watch crocodile feeding demonstrations and interactive reptile exhibits.",
      },
      {
        day: 4,
        title: "Fly to Kuala Lumpur & Leisure",
        transferType: "private",
        description:
          "Private transfer from Langkawi hotel to airport. Flight to Kuala Lumpur (optional, Batik Air). Private pickup at KUL Airport and transfer to hotel. Rest of the day at leisure.",
      },
      {
        day: 5,
        title: "Full-Day Genting Highlands & Batu Caves",
        transferType: "private",
        description:
          "Full-day Genting Highlands tour by private vehicle with two-way cable car ticket included. En route 30-minute stop at the iconic Batu Caves with its giant Murugan statue.",
      },
      {
        day: 6,
        title: "Kuala Selangor Fireflies Tour",
        transferType: "private",
        description:
          "Morning and afternoon at leisure. Evening half-day Fireflies tour by private transfers: boat ride along the Selangor River observing synchronised glowing fireflies in the mangroves.",
      },
      {
        day: 7,
        title: "Kuala Lumpur City Tour, KL Tower & Departure",
        transferType: "private",
        description:
          "Half-day private Kuala Lumpur city tour with KL Tower Observation Deck ticket included (Petronas Towers photo stop, King's Palace, Merdeka Square). One-way private transfer from hotel to Kuala Lumpur (KUL) Airport.",
      },
    ],
  },
  {
    id: "phuket-krabi-5n6d",
    title: "Phuket & Krabi Island Hopper",
    destination: "Thailand (Phuket & Krabi)",
    region: "international",
    categories: ["international", "beach", "honeymoon", "family"],
    seasons: [11, 12, 1, 2, 3, 4],
    nights: 5,
    days: 6,
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=70",
    highlights: [
      "Phi Phi Island Speedboat Tour & Lunch",
      "Phuket Dolphin Show Regular Seat",
      "Rafting 5 km, ATV 30 min & Monkey Cave",
      "Big Buddha Viewpoint & City Tour",
      "Krabi 4-Island Tour by Longtail Boat",
      "National Park Entry Fees Included",
    ],
    hotelStarRating: 4,
    mealPlan: "Breakfast in hotel; lunches during Phi Phi, adventure & Krabi tours",
    transferBasis: "Private airport transfers & intercity drive; sharing speedboat tours",
    tiers: [
      {
        id: "deluxe",
        label: "Deluxe",
        hotelLabel: "4★ Deluxe",
        adultPriceINR: 43000,
        childPriceINR: null,
        priceNote:
          "Land package per person on triple-sharing basis (3 adults). Double-sharing quotes available on request.",
        hotels: [
          {
            location: "Phuket",
            nights: 3,
            names: ["Casa Del M Resort"],
            roomType: "Family Room",
          },
          {
            location: "Krabi",
            nights: 2,
            names: ["Ananta Burin Resort"],
            roomType: "Pool View Room",
          },
        ],
      },
      {
        id: "premium",
        label: "Premium",
        hotelLabel: "4★ Superior",
        adultPriceINR: 47000,
        childPriceINR: null,
        priceNote:
          "Land package per person on triple-sharing basis (3 adults) with upgraded 4★ superior resort rooms.",
        hotels: [
          {
            location: "Phuket",
            nights: 3,
            names: ["Fishermen's Harbour Urban Resort"],
            roomType: "Deluxe Family Room",
          },
          {
            location: "Krabi",
            nights: 2,
            names: ["Bluesotel Krabi Aonang Beach"],
            roomType: "Superior Room",
          },
        ],
      },
    ],
    extras: {
      flightFareINR: 47000,
      flightNote:
        "Indicative round trip Raipur–Phuket / Krabi–Raipur via Kolkata/Delhi (IndiGo). Dynamic fare, subject to change.",
      visa: null,
      onArrivalCharges: [
        "National park entry fees for Phi Phi Islands and Krabi 4 Islands are included in package",
      ],
    },
    notes: [
      "Quoted per-person price is based on 3 adults with 1 triple-sharing room.",
      "National park fees for Phi Phi Island and Krabi 4 Islands are fully included.",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Phuket & Dolphin Show",
        transferType: "private",
        description:
          "Arrival at Phuket (HKT) Airport, private transfer to hotel. Visit the Phuket Dolphin Show with regular seat entry ticket and private transfers included.",
      },
      {
        day: 2,
        title: "Phi Phi Islands Tour by Speedboat",
        transferType: "sharing",
        description:
          "Full-day Phi Phi Island tour by shared speedboat with buffet lunch included. Visit Maya Bay, Pileh Lagoon, Viking Cave, and Monkey Beach with snorkeling. National park fees included.",
      },
      {
        day: 3,
        title: "White Water Rafting, ATV & Jungle Adventure",
        transferType: "sharing",
        description:
          "Full-day action-packed adventure on sharing basis with lunch: 5 km white water rafting, 30-minute ATV off-road ride, 30-minute elephant trekking, and visit to Monkey Cave (Suwankuha Temple).",
      },
      {
        day: 4,
        title: "Phuket City Tour & Drive to Krabi",
        transferType: "private",
        description:
          "Half-day private Phuket city tour visiting the Big Buddha, Wat Chalong temple, and coastal viewpoints. Scenic private vehicle transfer from Phuket hotel to your Krabi resort.",
      },
      {
        day: 5,
        title: "Krabi Four Islands Tour by Longtail Boat",
        transferType: "sharing",
        description:
          "Krabi 4-Island tour by traditional longtail boat with picnic lunch: visit Koh Poda, Chicken Island, Tup Island sandbar, and Phra Nang Cave Beach. National park fee included.",
      },
      {
        day: 6,
        title: "Departure from Krabi",
        transferType: "private",
        description:
          "Breakfast at resort, check-out, and private transfer from Krabi hotel to Krabi (KBV) Airport for your departure flight.",
      },
    ],
  },
  {
    id: "dubai-abu-dhabi-6n7d",
    title: "Dubai & Abu Dhabi Highlights",
    destination: "Dubai & Abu Dhabi, UAE",
    region: "international",
    categories: ["international", "family", "honeymoon"],
    seasons: [10, 11, 12, 1, 2, 3, 4],
    nights: 6,
    days: 7,
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=70",
    highlights: [
      "Burj Khalifa 124th Floor (Non-Prime)",
      "AYA Universe Immersive Light Park",
      "Deluxe Desert Safari with BBQ Dinner",
      "Miracle Garden & Global Village",
      "Yas Island 2 Days 2 Theme Parks Access",
      "Abu Dhabi Panoramic City Tour",
    ],
    hotelStarRating: 4,
    mealPlan: "Breakfast in hotel; BBQ dinner during desert safari",
    transferBasis: "Private airport transfers & private vehicle tours throughout",
    tiers: [
      {
        id: "deluxe",
        label: "Deluxe",
        hotelLabel: "Silver 3★/4★",
        adultPriceINR: 80000,
        childPriceINR: null,
        priceNote:
          "₹1,60,000 for couple (₹80,000 per person) land package. 4 nights Dubai + 2 nights Abu Dhabi.",
        hotels: [
          {
            location: "Dubai",
            nights: 4,
            names: ["Citymax Bur Dubai", "Admiral Plaza Hotel", "Gateway Hotel"],
            roomType: "Standard Room",
          },
          {
            location: "Abu Dhabi",
            nights: 2,
            names: ["City Seasons Al Hamra"],
            roomType: "Deluxe Room",
          },
        ],
      },
      {
        id: "superior",
        label: "Superior",
        hotelLabel: "Gold 4★",
        adultPriceINR: 95000,
        childPriceINR: null,
        priceNote:
          "₹1,90,000 for couple (₹95,000 per person) land package with 4★ premium hotels.",
        hotels: [
          {
            location: "Dubai",
            nights: 4,
            names: ["Royal Ascot Hotel", "Majestic City Retreat", "Omega Hotel", "Grand Excelsior"],
            roomType: "Deluxe Double Room",
          },
          {
            location: "Abu Dhabi",
            nights: 2,
            names: ["Ramada By Wyndham Downtown"],
            roomType: "Superior Room",
          },
        ],
      },
    ],
    extras: {
      flightFareINR: 45500,
      flightNote:
        "Indicative round trip (₹91,000 for couple) Raipur–Dubai / Abu Dhabi–Raipur via Mumbai/Hyderabad (IndiGo). Dynamic fare, subject to change.",
      visa: { feeINR: 8000, type: "UAE 30-day tourist e-visa (single entry)" },
      onArrivalCharges: [
        "Tourism Dirham Fee (TD): AED 10 (3★) / 15 (4★) / 20 (5★) per room per night payable at hotel check-in",
        "Refundable hotel security deposit (approx. AED 100–500 per room per night) required at check-in",
      ],
    },
    notes: [
      "Quoted for 2 adults sharing 1 double room. Passports must have at least 6 months validity.",
      "Yas Island pass includes choice of 2 parks across 2 days: Ferrari World, Warner Bros, Yas Waterworld or SeaWorld.",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Dubai",
        transferType: "private",
        description:
          "Arrival at Dubai International (DXB) Airport. Private pickup and transfer to your Dubai hotel. Check-in and relax.",
      },
      {
        day: 2,
        title: "Dubai City Tour & Burj Khalifa 124th Floor",
        transferType: "private",
        description:
          "Dubai city tour by private vehicle (Dubai Creek, Gold & Spice Souks, Jumeirah Mosque photo stop), followed by entry to At the Top Burj Khalifa 124th floor (non-prime time tickets).",
      },
      {
        day: 3,
        title: "AYA Universe & Deluxe Desert Safari",
        transferType: "private",
        description:
          "Morning visit to AYA Universe immersive light park with tickets and two-way private transfers. Afternoon deluxe desert safari with dune bashing, camel rides, belly dance show, tanoura dance, and BBQ dinner with private transfers.",
      },
      {
        day: 4,
        title: "Dubai Miracle Garden & Global Village",
        transferType: "private",
        description:
          "Visit Dubai Miracle Garden (millions of floral displays) and Global Village (multicultural pavilions, shopping and street food) with included tickets and 3-way private transfers.",
      },
      {
        day: 5,
        title: "Dubai to Abu Dhabi with City Tour En Route",
        transferType: "private",
        description:
          "Check out from Dubai hotel. Private transfer to Abu Dhabi with Abu Dhabi panoramic city tour en route (without Grand Mosque). Check in at your Abu Dhabi hotel.",
      },
      {
        day: 6,
        title: "Yas Island Theme Parks - Day 1",
        transferType: "private",
        description:
          "Access to Yas Island Theme Parks (2-day, 2-park pass). Choose from Ferrari World Abu Dhabi, Warner Bros. World, Yas Waterworld, or SeaWorld Abu Dhabi with two-way transfers from city hotel.",
      },
      {
        day: 7,
        title: "Yas Island Theme Parks - Day 2 & Departure",
        transferType: "private",
        description:
          "Enjoy your second Yas Island theme park experience. Evening private transfer from Abu Dhabi hotel to Abu Dhabi International (AUH) Airport for departure flight.",
      },
    ],
  },
  {
    id: "pattaya-bangkok-5n6d",
    title: "Pattaya & Bangkok Getaway",
    destination: "Thailand (Pattaya & Bangkok)",
    region: "international",
    categories: ["international", "beach", "family"],
    seasons: [11, 12, 1, 2, 3, 4],
    nights: 5,
    days: 6,
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=70",
    highlights: [
      "Alcazar Cabaret Show Normal Seat",
      "Coral Island Speedboat Tour & Lunch",
      "Nong Nooch Tropical Village Show",
      "Ocean Marina Shared Yacht Party",
      "Safari World & Marine Park with Lunch",
      "Private Airport & Intercity Transfers",
    ],
    hotelStarRating: 4,
    mealPlan: "Breakfast in hotel; lunches during Coral Island, Nong Nooch & Safari World",
    transferBasis: "Private airport & intercity transfers; sharing boat tours",
    tiers: [
      {
        id: "deluxe",
        label: "Deluxe",
        hotelLabel: "4★ Deluxe",
        adultPriceINR: 33000,
        childPriceINR: null,
        priceNote:
          "Land package per person based on 4 adults sharing 2 rooms. Flights quoted separately at live fares.",
        hotels: [
          {
            location: "Pattaya",
            nights: 4,
            names: ["Silvertone Hotel", "Sunbeam Hotel"],
            roomType: "Superior Double/Twin Room",
          },
          {
            location: "Bangkok",
            nights: 1,
            names: ["Pannarai Hotel Bangkok"],
            roomType: "Superior Double/Twin Room",
          },
        ],
      },
      {
        id: "superior",
        label: "Superior",
        hotelLabel: "4★ Superior",
        adultPriceINR: 37000,
        childPriceINR: null,
        priceNote:
          "Land package per person based on 4 adults sharing 2 rooms with upgraded superior hotels.",
        hotels: [
          {
            location: "Pattaya",
            nights: 4,
            names: ["LK Miracle Suite Pattaya", "Signature Pattaya"],
            roomType: "Superior Double/Twin Room",
          },
          {
            location: "Bangkok",
            nights: 1,
            names: ["Century Park Bangkok"],
            roomType: "Deluxe Double/Twin Room",
          },
        ],
      },
    ],
    extras: {
      flightFareINR: 39500,
      flightNote:
        "Indicative round trip Raipur–Bangkok (BKK) via Mumbai (IndiGo 6E). Dynamic fare, subject to change.",
      visa: null,
      onArrivalCharges: [
        "Thailand visa exemption currently applicable for Indian passport holders (up to 60 days)",
      ],
    },
    notes: [
      "Quoted per person based on 4 adults in 2 rooms (double/twin sharing).",
      "Ocean Marina Yacht Party includes 2+2 starters, ice, water, soda, soft drinks and 2 hours free flow.",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Bangkok, Transfer to Pattaya & Alcazar Show",
        transferType: "private",
        description:
          "Arrival at Bangkok Suvarnabhumi (BKK) Airport, private transfer to Pattaya hotel. Evening Alcazar Cabaret Show with normal seat tickets and private round-trip transfers.",
      },
      {
        day: 2,
        title: "Half-Day Coral Island Tour with Lunch",
        transferType: "sharing",
        description:
          "Speedboat ride to Coral Island (Koh Larn) on sharing basis. Relax on white sand beaches, swim in clear waters, or try water sports. Indian/local buffet lunch included.",
      },
      {
        day: 3,
        title: "Nong Nooch Tropical Botanical Village & Show",
        transferType: "private",
        description:
          "Visit Nong Nooch Tropical Botanical Garden with private transfers. Enjoy Thai cultural dance performances, elephant shows, dinosaur valley, and buffet lunch included.",
      },
      {
        day: 4,
        title: "Ocean Marina Shared Yacht Party",
        transferType: "sharing",
        description:
          "Ocean Marina shared yacht cruise with pickup and drop on sharing basis. Includes 2+2 starters, ice, water, soda, soft drinks, 2 hours free-flow drinks, Thai dancers and DJ music.",
      },
      {
        day: 5,
        title: "Safari World & Marine Park en Route to Bangkok",
        transferType: "private",
        description:
          "Check out from Pattaya hotel. Private transfer to Bangkok with full-day Safari World and Marine Park tour en route: drive-through open safari, dolphin and stunt shows, and buffet lunch included. Check in at Bangkok hotel.",
      },
      {
        day: 6,
        title: "Bangkok Hotel to Airport Departure",
        transferType: "private",
        description:
          "Breakfast at hotel, check-out, and private one-way transfer from Bangkok hotel to Suvarnabhumi Airport (BKK) for your flight back home.",
      },
    ],
  },
];

// Terms & Policies content approved by the agency. The Payment Policy panel text is
// generated from BUSINESS.paymentPolicy (single source of truth), not stored here.
export const POLICIES = {
  inclusions: [
    "Hotel accommodation as per the hotel section",
    "Meal plan as mentioned",
    "Airport pickup & drop on private basis",
    "Sightseeing & transfers on SIC/private basis as per itinerary",
    "Applicable hotel taxes & service charges",
    "24×7 customer support",
  ],
  // used for region "domestic" (e.g. Kerala)
  inclusionsDomestic: [
    "Hotel accommodation as per the hotel section",
    "Meal plan as mentioned",
    "Airport / railway station / bus stand pick-up & drop",
    "All toll taxes, parking, driver allowance & fuel",
    "Sightseeing on point-to-point basis (vehicle not at disposal)",
    "Applicable hotel taxes & service charges",
    "24×7 customer support",
  ],
  exclusions: [
    "Return airfare / rail / bus tickets unless quoted separately",
    "Personal expenses",
    "GST (currently 5%), TCS as per Govt of India rules for international tours, and other taxes",
    "Travel insurance and visa fee, if not listed",
    "Early check-in / late check-out",
    "Optional tours",
    "Meals not mentioned",
    "Tips, porterage and gratuities",
    "Increases in airfare, visa fees or government taxes",
    "Costs from flight cancellations, roadblocks or natural calamities; peak-season, Christmas, Diwali and New Year supplements",
    "Anything not listed in inclusions",
  ],
  exclusionsSummaryCount: 4, // first N shown in the itinerary modal, with "See all Terms"
  importantTerms: [
    "Booking is confirmed only after payment is received and a confirmation is issued by Travel Guru.",
    "Payment implies acceptance of these terms.",
    "Quoted prices are valid for 24 hours, subject to availability.",
    "Prices are based on the number of travellers (PAX) quoted.",
    "Passports need at least 6 months' validity; visas are issued at the embassy's discretion.",
    "Hotel check-in 3:00 PM (domestic 12:00 PM or 2:00 PM per hotel); check-out 11:00 AM / 12:00 noon.",
    "Transfers are point-to-point; missed sightseeing is not refunded.",
    "No amendments within 72 hours of departure.",
    "Cancellations are governed by supplier policies.",
    "Local mandatory charges (city tax, resort fee, tourism tax, environmental fee, TCS, GST, visa fee) are not included.",
    "Hotel and service confirmations take 48–72 hours; similar-category alternatives may be provided.",
  ],
  cancellation: {
    rules: [
      "Cancellation must be requested in writing by email or WhatsApp by the lead passenger.",
      "Charges apply on the total package cost.",
      "Air tickets, visa, insurance, cruise, event tickets and permits follow the supplier's policy.",
      "Refunds are processed after the supplier refunds Travel Guru; bank, gateway, processing and supplier charges may be deducted.",
    ],
    // Five contiguous bands from 0 days, no gaps or overlaps; the 46+ band is open-ended.
    table: [
      { minDays: 46, maxDays: null, rate: 0.1, label: "46 days or more before departure" },
      { minDays: 31, maxDays: 45, rate: 0.35, label: "31–45 days" },
      { minDays: 16, maxDays: 30, rate: 0.5, label: "16–30 days" },
      { minDays: 8, maxDays: 15, rate: 0.75, label: "8–15 days" },
      { minDays: 0, maxDays: 7, rate: 1, label: "0–7 days / no show" },
    ],
  },
  generalRemarks: [
    "Upgrades and special requests are subject to availability unless confirmed in writing.",
    "No refund for unused services.",
    "Hotels may collect a refundable security deposit at check-in.",
    "Guests are responsible for their personal belongings.",
    "Guests bear the cost of any damage caused to hotel or vehicle property.",
  ],
  disclaimer: [
    "Travel Guru acts only as a booking and tour facilitator and is not liable for any accident, illness, injury, death, loss, delay, natural calamity, civil unrest, service disruption or force majeure event.",
    "Guests are strongly advised to buy comprehensive travel insurance.",
  ],
};

// Popular Destinations, poster order and grouping (6 international, 8 domestic).
// packageId links a tile to a PACKAGES entry ("View Package"); null = quote only.
// image = Unsplash PLACEHOLDER, replace with own photos (tiles fall back to a gradient on error).
export const DESTINATIONS = [
  { id: "thailand", name: "Thailand", tagline: "Beaches | Culture | Nightlife", region: "international", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=70", packageId: "phuket-krabi-5n6d" }, // PLACEHOLDER image
  { id: "singapore", name: "Singapore", tagline: "Modern | Fun | Unforgettable", region: "international", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=70", packageId: "singapore-4n5d" }, // PLACEHOLDER image
  { id: "malaysia", name: "Malaysia", tagline: "City Life | Shopping | Nature", region: "international", image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=70", packageId: "malaysia-6n7d" }, // PLACEHOLDER image
  { id: "europe", name: "Europe", tagline: "History | Culture | Adventure", region: "international", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=70", packageId: null }, // PLACEHOLDER image
  { id: "dubai", name: "Dubai", tagline: "Luxury | Shopping | Modernity", region: "international", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=70", packageId: "dubai-4n5d" }, // PLACEHOLDER image
  { id: "vietnam", name: "Vietnam", tagline: "Nature | Heritage | Food", region: "international", image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=70", packageId: "vietnam-7n8d" }, // PLACEHOLDER image
  { id: "kashmir", name: "Kashmir", tagline: "Heaven on Earth", region: "domestic", image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=800&q=70", packageId: null }, // PLACEHOLDER image
  { id: "shimla-manali", name: "Shimla-Manali", tagline: "Hills & Adventure", region: "domestic", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=70", packageId: null }, // PLACEHOLDER image
  { id: "kerala", name: "Kerala", tagline: "Backwaters & Beaches", region: "domestic", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=70", packageId: "kerala-5n6d" }, // PLACEHOLDER image
  { id: "andaman", name: "Andaman", tagline: "Blue Waters & Islands", region: "domestic", image: "https://images.unsplash.com/photo-1589979481223-deb893043163?auto=format&fit=crop&w=800&q=70", packageId: null }, // PLACEHOLDER image
  { id: "char-dham", name: "Char Dham", tagline: "Spiritual Journey", region: "domestic", image: "https://images.unsplash.com/photo-1612438214708-f428a707dd4e?auto=format&fit=crop&w=800&q=70", packageId: null }, // PLACEHOLDER image
  { id: "vaishno-devi", name: "Vaishno Devi", tagline: "Divine Blessings", region: "domestic", image: "https://images.unsplash.com/photo-1609920658906-8223bd289001?auto=format&fit=crop&w=800&q=70", packageId: null }, // PLACEHOLDER image
  { id: "udaipur-jaisalmer", name: "Udaipur-Jaisalmer", tagline: "Royal Heritage", region: "domestic", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=70", packageId: null }, // PLACEHOLDER image
  // Nepal is listed under Domestic exactly as on the poster; it is geographically
  // international. CONFIRM the grouping with the agency (open item).
  { id: "nepal", name: "Nepal", tagline: "Nature & Culture", region: "domestic", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=70", packageId: null }, // PLACEHOLDER image
];

// Service pre-ticked in the quote form by "Get a Quote" on a destination tile.
export const DESTINATION_QUOTE_SERVICE = "Holidays";
