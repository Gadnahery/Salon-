import type { Category, Service, Stylist, TeamMember } from "./types";

export const TEST_PRICE_TSH = 500;

export function applyTestPrices<T extends { priceMin: number; priceMax?: number; depositPercent: number }>(
  list: T[],
): T[] {
  return list.map((s) => ({
    ...s,
    priceMin: TEST_PRICE_TSH,
    priceMax: TEST_PRICE_TSH,
    depositPercent: 100,
  }));
}

export const SALON = {
  name: "Salon",
  short: "Salon",
  tagline: "Your beauty. Your time.",
  phone: "+255 754 221 088",
  phoneHref: "tel:+255754221088",
  whatsapp: "https://wa.me/255754221088",
  instagram: "https://instagram.com/salon",
  facebook: "https://facebook.com/salon",
  tiktok: "https://tiktok.com/@salon",
  addressLine1: "Ali Hassan Mwinyi Rd",
  addressLine2: "Dar es Salaam",
  hours: "Mon – Sat · 9:00 AM – 7:00 PM",
  hoursShort: "9:00 AM – 7:00 PM",
  rating: 4.9,
  reviewCount: 214,
  mapEmbed:
    "https://www.openstreetmap.org/export/embed.html?bbox=39.255%2C-6.790%2C39.285%2C-6.760&layer=mapnik&marker=-6.7765%2C39.2705",
  mapsLink: "https://www.openstreetmap.org/?mlat=-6.7765&mlon=39.2705#map=16/-6.7765/39.2705",
  mapsApp: "https://maps.google.com/?q=Ali+Hassan+Mwinyi+Rd+Dar+es+Salaam",
  cancellationPolicy:
    "Free cancellation up to 24 hours before your appointment. Within 24 hours, the deposit may be retained according to salon policy.",
  depositPolicy: "A 50% deposit holds your chair. The remaining balance is paid at the salon after your service.",
  whatToBring: "Come with clean, detangled hair for braiding. For makeup, arrive with a clean face.",
};

export const services: Service[] = [
  {
    id: "hair-braiding",
    name: "Hair Braiding",
    category: "hair",
    description:
      "A personalized braiding experience designed around your preferred style, length and finish.",
    priceMin: 30000,
    priceMax: 60000,
    durationMin: 45,
    durationMax: 90,
    rating: 4.9,
    reviewCount: 214,
    image: "/images/braiding.jpg",
    gallery: ["/images/braiding.jpg", "/images/gallery-braids.jpg", "/images/gallery-work.jpg", "/images/sig-braiding.jpg"],
    includes: ["Consultation", "Styling", "Finishing", "Final adjustments"],
    popular: true,
    signature: true,
    acceptsReference: true,
    depositPercent: 50,
    nextAvailable: "Today 2:00 PM",
    featuredReview: { quote: "I loved the result. The whole appointment felt so easy.", name: "Rehema K." },
  },
  {
    id: "box-braids",
    name: "Box Braids",
    category: "hair",
    description:
      "Neat, lasting box braids in the length and size you want. Comfortable tension, clean parts, a finish that holds.",
    priceMin: 45000,
    priceMax: 80000,
    durationMin: 90,
    durationMax: 180,
    rating: 4.9,
    reviewCount: 128,
    image: "/images/gallery-braids.jpg",
    imagePosition: "center 20%",
    gallery: ["/images/gallery-braids.jpg", "/images/braiding.jpg", "/images/gallery-work.jpg"],
    includes: ["Consultation", "Parting", "Braiding", "Finishing"],
    popular: true,
    acceptsReference: true,
    depositPercent: 50,
    nextAvailable: "Tomorrow 10:00 AM",
    featuredReview: { quote: "Amina's braids lasted eight weeks. I have never had that before.", name: "Joyce N." },
  },
  {
    id: "silk-press",
    name: "Silk Press",
    category: "hair",
    description: "A smooth, glossy press that still respects your hair. Light oil, careful heat, and a style that moves.",
    priceMin: 25000,
    priceMax: 40000,
    durationMin: 60,
    rating: 4.8,
    reviewCount: 86,
    image: "/images/sig-braiding.jpg",
    imagePosition: "center 30%",
    gallery: ["/images/sig-braiding.jpg", "/images/treatment.jpg"],
    includes: ["Wash", "Blow dry", "Press", "Finish"],
    depositPercent: 50,
    nextAvailable: "Friday 11:30 AM",
    featuredReview: { quote: "Soft, shiny, and it still felt like my hair.", name: "Zainab L." },
  },
  {
    id: "locs",
    name: "Locs Maintenance",
    category: "hair",
    description:
      "Retwist, clean-up, and styling for healthy locs. Unhurried hands, even tension, a look that lasts until your next visit.",
    priceMin: 35000,
    priceMax: 55000,
    durationMin: 75,
    durationMax: 120,
    rating: 4.8,
    reviewCount: 64,
    image: "/images/treatment.jpg",
    imagePosition: "center 40%",
    gallery: ["/images/treatment.jpg", "/images/sig-braiding.jpg"],
    includes: ["Clean-up", "Retwist", "Style"],
    depositPercent: 50,
    nextAvailable: "Saturday 9:00 AM",
    featuredReview: { quote: "Even tension, no rush. My locs look healthy again.", name: "Baraka T." },
  },
  {
    id: "gel-manicure",
    name: "Manicure & Nails",
    category: "nails",
    description: "Clean. Detailed. Beautiful. A precise gel set in nudes, terracotta, or the colour you bring in.",
    priceMin: 25000,
    durationMin: 60,
    rating: 4.8,
    reviewCount: 176,
    image: "/images/nails.jpg",
    gallery: ["/images/nails.jpg", "/images/gallery-nails.jpg", "/images/sig-nails.jpg"],
    includes: ["Shape", "Cuticle care", "Gel colour", "Finish"],
    popular: true,
    signature: true,
    acceptsReference: true,
    depositPercent: 50,
    nextAvailable: "Today 4:30 PM",
    featuredReview: { quote: "The most considered manicure I have had in Dar.", name: "Farida M." },
  },
  {
    id: "acrylic-set",
    name: "Acrylic Set",
    category: "nails",
    description: "Sculpted length with a soft, wearable shape. Built to last, finished like jewellery.",
    priceMin: 40000,
    priceMax: 60000,
    durationMin: 90,
    rating: 4.8,
    reviewCount: 91,
    image: "/images/gallery-nails.jpg",
    imagePosition: "center 70%",
    gallery: ["/images/gallery-nails.jpg", "/images/nails.jpg"],
    includes: ["Sculpt", "Shape", "Colour", "Finish"],
    acceptsReference: true,
    depositPercent: 50,
    nextAvailable: "Tomorrow 1:00 PM",
    featuredReview: { quote: "Built to last, still elegant two weeks later.", name: "Asha P." },
  },
  {
    id: "pedicure",
    name: "Pedicure",
    category: "nails",
    description: "A thorough, quiet pedicure. Soak, shape, care, and a polish that looks considered.",
    priceMin: 20000,
    priceMax: 30000,
    durationMin: 50,
    rating: 4.8,
    reviewCount: 72,
    image: "/images/sig-nails.jpg",
    imagePosition: "center 55%",
    gallery: ["/images/sig-nails.jpg", "/images/gallery-nails.jpg"],
    includes: ["Soak", "Care", "Shape", "Polish"],
    depositPercent: 50,
    nextAvailable: "Today 3:00 PM",
    featuredReview: { quote: "Quiet, thorough, exactly what I needed.", name: "Halima S." },
  },
  {
    id: "everyday-glam",
    name: "Makeup",
    category: "makeup",
    description: "Makeup for your everyday moments. Skin that looks like skin, just more rested.",
    priceMin: 50000,
    durationMin: 60,
    rating: 4.9,
    reviewCount: 143,
    image: "/images/makeup.jpg",
    gallery: ["/images/makeup.jpg", "/images/gallery-makeup.jpg", "/images/sig-makeup.jpg"],
    includes: ["Prep", "Skin", "Colour", "Setting"],
    popular: true,
    signature: true,
    acceptsReference: true,
    depositPercent: 50,
    nextAvailable: "Tomorrow 11:00 AM",
    featuredReview: { quote: "Looked like me, just more rested. Perfect.", name: "Neema A." },
  },
  {
    id: "occasion-makeup",
    name: "Occasion Makeup",
    category: "makeup",
    description: "For dinners, photos, and the days that ask a little more. Long-wear, still you.",
    priceMin: 45000,
    durationMin: 60,
    rating: 4.9,
    reviewCount: 58,
    image: "/images/sig-makeup.jpg",
    imagePosition: "center 25%",
    gallery: ["/images/sig-makeup.jpg", "/images/gallery-makeup.jpg"],
    includes: ["Prep", "Full glam", "Lashes", "Setting"],
    acceptsReference: true,
    depositPercent: 50,
    nextAvailable: "Saturday 2:00 PM",
    featuredReview: { quote: "Long-wear that still looked like me in photographs.", name: "Lulu D." },
  },
  {
    id: "bridal-makeup",
    name: "Bridal Makeup",
    category: "makeup",
    description: "A calm, private bridal sitting. We build the look with you, then stay for the photographs.",
    priceMin: 80000,
    priceMax: 120000,
    durationMin: 90,
    rating: 5,
    reviewCount: 24,
    image: "/images/gallery-makeup.jpg",
    imagePosition: "center 15%",
    gallery: ["/images/gallery-makeup.jpg", "/images/makeup.jpg", "/images/sig-makeup.jpg"],
    includes: ["Trial option", "Prep", "Bridal look", "Touch-ups"],
    acceptsReference: true,
    depositPercent: 50,
    nextAvailable: "Next week",
    featuredReview: { quote: "Makeup for my sister's wedding was exact. They even stayed for the photos.", name: "Neema A." },
  },
  {
    id: "deep-conditioning",
    name: "Hair Treatment",
    category: "treatments",
    description: "A restorative mask and steam for hair that has been through heat, colour, or a long week.",
    priceMin: 40000,
    durationMin: 75,
    rating: 5,
    reviewCount: 47,
    image: "/images/treatment.jpg",
    gallery: ["/images/treatment.jpg", "/images/waiting.jpg"],
    includes: ["Consult", "Mask", "Steam", "Finish"],
    depositPercent: 50,
    nextAvailable: "Thursday 10:00 AM",
    featuredReview: { quote: "My hair felt like itself again.", name: "Fatma S." },
  },
  {
    id: "haircut",
    name: "Haircut",
    category: "hair",
    description: "A precise cut shaped around your face and how you actually wear your hair.",
    priceMin: 15000,
    priceMax: 25000,
    durationMin: 30,
    durationMax: 45,
    rating: 4.8,
    reviewCount: 102,
    image: "/images/sig-braiding.jpg",
    gallery: ["/images/sig-braiding.jpg", "/images/gallery-work.jpg"],
    includes: ["Consult", "Cut", "Finish"],
    depositPercent: 50,
    nextAvailable: "Today 11:00 AM",
    featuredReview: { quote: "Clean, considered, and done in thirty minutes.", name: "James P." },
  },
  {
    id: "facial",
    name: "Signature Facial",
    category: "treatments",
    description: "A quiet hour for your skin. Cleanse, treat, and finish so you leave looking like yourself, rested.",
    priceMin: 40000,
    durationMin: 60,
    rating: 4.9,
    reviewCount: 39,
    image: "/images/waiting.jpg",
    imagePosition: "center 80%",
    gallery: ["/images/waiting.jpg", "/images/treatment.jpg"],
    includes: ["Cleanse", "Treat", "Massage", "Finish"],
    depositPercent: 50,
    nextAvailable: "Friday 3:30 PM",
    featuredReview: { quote: "It feels like a private studio, not a busy salon.", name: "Fatma S." },
  },
];

export const stylists: Stylist[] = [
  {
    id: "sarah",
    name: "Sarah",
    title: "Senior Stylist",
    bio: "Fifteen years in the chair. Hair, makeup, and the kind of calm that makes the whole visit feel easy.",
    specialties: ["hair", "makeup"],
    image: "/images/sarah.jpg",
    initials: "S",
    rating: 4.9,
  },
  {
    id: "amina",
    name: "Amina",
    title: "Braiding Specialist",
    bio: "Protective styles that last. Precise parts, comfortable tension, and a finish people notice.",
    specialties: ["hair"],
    image: "/images/amina.jpg",
    initials: "A",
    rating: 5,
  },
  {
    id: "grace",
    name: "Grace",
    title: "Nail Artist",
    bio: "Clean lines, thoughtful colour, and hands that never rush a set.",
    specialties: ["nails"],
    image: "/images/grace.jpg",
    initials: "G",
    rating: 4.8,
  },
];

export const reviews = [
  {
    id: "r1",
    quote: "The service was amazing and the whole experience felt so easy from booking to the appointment.",
    name: "Rehema K.",
    service: "Hair Braiding",
    featured: true,
  },
  {
    id: "r2",
    quote: "I booked in two minutes and was in the chair on time.",
    name: "Farida M.",
    service: "Manicure & Nails",
  },
  {
    id: "r3",
    quote: "Amina's braids lasted eight weeks. I have never had that before.",
    name: "Joyce N.",
    service: "Box Braids",
  },
  {
    id: "r4",
    quote: "It feels like a private studio, not a busy salon.",
    name: "Fatma S.",
    service: "Signature Facial",
  },
  {
    id: "r5",
    quote: "Makeup for my sister's wedding was exact. They even stayed for the photos.",
    name: "Neema A.",
    service: "Bridal Makeup",
  },
];

export const gallery = [
  { src: "/images/gallery-braids.jpg", alt: "Finished knotless braids", category: "Hair" as const },
  { src: "/images/gallery-interior.jpg", alt: "The salon floor in afternoon light", category: "Salon" as const },
  { src: "/images/gallery-nails.jpg", alt: "Terracotta gel manicure", category: "Nails" as const },
  { src: "/images/gallery-makeup.jpg", alt: "Everyday glam makeup", category: "Makeup" as const },
  { src: "/images/gallery-work.jpg", alt: "Braiding in progress", category: "Hair" as const },
  { src: "/images/hero.jpg", alt: "Salon at golden hour", category: "Salon" as const },
  { src: "/images/sig-braiding.jpg", alt: "Braiding in the sunlit salon", category: "Hair" as const },
  { src: "/images/waiting.jpg", alt: "The waiting room", category: "Salon" as const },
  { src: "/images/cta.jpg", alt: "Evening light through the salon windows", category: "Salon" as const },
  { src: "/images/amina.jpg", alt: "Amina, braiding specialist", category: "Team" as const },
  { src: "/images/sarah.jpg", alt: "Sarah, senior stylist", category: "Team" as const },
  { src: "/images/grace.jpg", alt: "Grace, nail artist", category: "Team" as const },
];

export const signatures = [
  { id: "hair-braiding", title: "Braiding", copy: "Beautiful styles designed around you.", image: "/images/sig-braiding.jpg" },
  { id: "gel-manicure", title: "Nails", copy: "Clean. Detailed. Beautiful.", image: "/images/sig-nails.jpg" },
  { id: "everyday-glam", title: "Makeup", copy: "For your everyday moments and special occasions.", image: "/images/sig-makeup.jpg" },
];

export const offer = {
  label: "This month",
  title: "10% off Hair Braiding",
  copy: "For selected weekday appointments.",
  serviceId: "hair-braiding",
  image: "/images/gallery-braids.jpg",
};

const WEEKDAY_HOURS = [1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  start: "09:00",
  end: "19:00",
}));
const SUNDAY_OFF = [{ day: 0, start: "00:00", end: "00:00", off: true as const }];

export const team: TeamMember[] = [
  {
    ...stylists[0],
    role: "stylist",
    phone: "+255 754 221 101",
    email: "sarah@salon.co.tz",
    serviceIds: ["hair-braiding", "box-braids", "silk-press", "locs", "haircut", "everyday-glam", "occasion-makeup", "bridal-makeup", "deep-conditioning"],
    hours: [...WEEKDAY_HOURS, ...SUNDAY_OFF],
    breakStart: "12:00",
    breakEnd: "13:00",
    active: true,
  },
  {
    ...stylists[1],
    role: "stylist",
    phone: "+255 754 221 102",
    email: "amina@salon.co.tz",
    serviceIds: ["hair-braiding", "box-braids", "silk-press", "locs", "haircut", "deep-conditioning"],
    hours: [...WEEKDAY_HOURS, ...SUNDAY_OFF],
    breakStart: "12:00",
    breakEnd: "13:00",
    active: true,
  },
  {
    ...stylists[2],
    role: "stylist",
    phone: "+255 754 221 103",
    email: "grace@salon.co.tz",
    serviceIds: ["gel-manicure", "acrylic-set", "pedicure"],
    hours: [...WEEKDAY_HOURS, ...SUNDAY_OFF],
    breakStart: "12:00",
    breakEnd: "13:00",
    active: true,
  },
  {
    id: "zahra",
    name: "Zahra",
    title: "Reception",
    bio: "The floor, the phone, the queue. Zahra keeps the day moving.",
    specialties: ["hair", "nails", "makeup", "treatments"],
    initials: "Z",
    rating: 5,
    role: "receptionist",
    phone: "+255 754 221 104",
    email: "zahra@salon.co.tz",
    serviceIds: [],
    hours: [...WEEKDAY_HOURS, ...SUNDAY_OFF],
    active: true,
  },
  {
    id: "lewis",
    name: "Lewis",
    title: "Owner",
    bio: "Salon. The salon is named for him, and he still knows every regular by name.",
    specialties: ["hair", "nails", "makeup", "treatments"],
    initials: "L",
    rating: 5,
    role: "admin",
    phone: "+255 754 221 088",
    email: "gadnahery7@gmail.com",
    serviceIds: services.map((s) => s.id),
    hours: [...WEEKDAY_HOURS, ...SUNDAY_OFF],
    active: true,
  },
];

let liveServices: Service[] = services;
let liveTeam: TeamMember[] = team;

export function setLiveServices(next: Service[]) {
  liveServices = next;
}

export function setLiveTeam(next: TeamMember[]) {
  liveTeam = next;
}

export function getService(id: string) {
  return liveServices.find((s) => s.id === id) ?? services.find((s) => s.id === id);
}

export function getStylist(id: string) {
  const member = liveTeam.find((t) => t.id === id);
  if (member) return member;
  return stylists.find((s) => s.id === id);
}

export function stylistsFor(category: Category) {
  return liveTeam.filter((s) => s.role === "stylist" && s.specialties.includes(category) && s.active !== false);
}

export function getTeamMember(id: string) {
  return liveTeam.find((t) => t.id === id) ?? team.find((t) => t.id === id);
}

export function stylistsOnTeam() {
  return liveTeam.filter((t) => t.role === "stylist" && t.active !== false);
}

export function allTeam() {
  return liveTeam;
}
