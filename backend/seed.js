const { randomUUID } = require("crypto");
const {
  User, Project, Property, Settings, HeroSlide, Testimonial, TrustPillar, PropertyType,
} = require("./db");
const { hashPassword } = require("./auth");

const DEFAULT_SETTINGS = {
  id: "site-settings",
  phone: "+91 98765 43210",
  email: "hello@nirnaygroup.com",
  address: "Shubharambh Building 13D, Shyam Nagar, Kanpur 208013",
  tagline_en: "Places that feel like yours",
  tagline_hi: "हमारा प्रयास, बेहतर आवास",
  intro_title: "Not just a plot. A place to belong.",
  intro_copy: "We create considered spaces that give you more than an address — a setting for your next chapter, with nature, community and everyday ease built in.",
  phone_band_title: "Talk to a Nirnay advisor",
  phone_band_copy: "Call for personal guidance, project walkthroughs or availability updates.",
  footer_copy: "Places with room to become your own.",
  office_hours: "Monday|10:00 am – 6:00 pm\nTuesday|Closed\nWednesday|10:00 am – 6:00 pm\nThursday|10:00 am – 6:00 pm\nFriday|10:00 am – 6:00 pm\nSaturday|10:00 am – 6:00 pm\nSunday|By appointment",
  about_links: "About Company|/about\nLegal Documents|/about",
  quick_links: "Terms of Use|/about\nPrivacy Policy|/about\nContact Support|/contact\nCareers|/contact",
  terms_url: "/about",
  privacy_url: "/about",
  copyright_text: "© 2026 Nirnay Group. All rights reserved.",
  instagram: "",
  facebook: "",
  linkedin: "",
};

const DEFAULT_HERO_SLIDES = [
  { image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85", kicker: "Places that feel like yours", title: "Make room for what matters.", subtitle: "Thoughtfully planned homes and plots for people who want a little more life around them.", cta_label: "Explore projects", cta_link: "/projects", order: 0 },
  { image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=85", kicker: "Neighbourhoods, considered", title: "Land, patiently curated.", subtitle: "Ready plots in green pockets, road-connected and community-designed for the long haul.", cta_label: "See our projects", cta_link: "/projects", order: 1 },
  { image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85", kicker: "Rise above the everyday", title: "Homes with a view.", subtitle: "Premium apartments with wellness amenities, quiet corners and open skies.", cta_label: "Book a private visit", cta_link: "/book-site-visit", order: 2 },
];

const DEFAULT_TESTIMONIALS = [
  { quote: "Nirnay didn't just sell us a plot — they gave us a plan. Two years in, our home fits our life better than we imagined.", name: "Priya Sharma", role: "Homeowner, Verdant Meadows", order: 0 },
  { quote: "Straightforward pricing, honest advice, and every promise kept. That is rare in Kanpur real estate.", name: "Rohan Mehta", role: "Investor, Nirnay Heights", order: 1 },
  { quote: "Their team walked us through everything, right down to loan paperwork. It felt like family, not a sales pitch.", name: "Ananya Kapoor", role: "First-time buyer", order: 2 },
];

const DEFAULT_TRUST_PILLARS = [
  { icon: "MapPin", title: "Curated locations", description: "Every project sits on land we picked for its long-term value — connectivity, green cover and community.", order: 0 },
  { icon: "ShieldCheck", title: "Transparent pricing", description: "No hidden fees, no last-minute surprises. What you're quoted is what you sign.", order: 1 },
  { icon: "Users", title: "End-to-end guidance", description: "From your first visit to key handover — one team, one point of contact.", order: 2 },
];

const DEFAULT_PROPERTY_TYPES = [
  { icon: "MapPin", name: "Residential plots", description: "Ready-to-build plots in gated communities.", order: 0 },
  { icon: "Home", name: "Apartments", description: "Premium homes with wellness amenities.", order: 1 },
  { icon: "TreePine", name: "Farm plots", description: "Weekend homes and orchards close to nature.", order: 2 },
  { icon: "Building2", name: "Commercial", description: "Shops, offices and retail plots.", order: 3 },
];

async function seedMany(Model, docs, keyField) {
  for (const doc of docs) {
    const existing = await Model.findOne({ [keyField]: doc[keyField] });
    if (existing) continue;
    await Model.create({ id: randomUUID(), ...doc });
  }
}

async function seedDefaults() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@verdant.example").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

  // Users
  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({ id: randomUUID(), name: "Company Owner", email: adminEmail, password_hash: hashPassword(adminPassword), role: "super_admin" });
    console.log(`[seed] created admin ${adminEmail}`);
  }
  if (!(await User.findOne({ email: "associate@verdant.example" }))) {
    await User.create({ id: randomUUID(), name: "Amit Sharma", email: "associate@verdant.example", password_hash: hashPassword("Associate@12345"), role: "associate" });
    console.log("[seed] created associate@verdant.example");
  }

  // First project (safety net)
  if (!(await Project.findOne({ slug: "verdant-meadows" }))) {
    const projectId = randomUUID();
    await Project.create({
      id: projectId, slug: "verdant-meadows", name: "Verdant Meadows",
      location: "Kanpur, Uttar Pradesh", tagline: "A quieter way to come home.",
      description: "Thoughtfully planned plots surrounded by green corridors, generous roads, and a community designed for long-term living.",
      price_from: 1850000, area: "18 acres", status: "selling",
      image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
    });
    const seedProps = [
      ["A-101", "1200 sq.ft", "available", 1850000],
      ["A-102", "1500 sq.ft", "reserved", 2250000],
      ["B-204", "1800 sq.ft", "available", 2450000],
      ["C-112", "2400 sq.ft", "booked", 3150000],
    ];
    for (const [number, size, status, price] of seedProps) {
      await Property.create({ id: randomUUID(), project_id: projectId, number, size, status, price, facing: "East" });
    }
    console.log("[seed] created Verdant Meadows + 4 properties");
  }

  // Site content
  if (!(await Settings.findOne({ id: "site-settings" }))) {
    await Settings.create(DEFAULT_SETTINGS);
    console.log("[seed] created settings singleton");
  }
  await seedMany(HeroSlide, DEFAULT_HERO_SLIDES, "title");
  await seedMany(Testimonial, DEFAULT_TESTIMONIALS, "name");
  await seedMany(TrustPillar, DEFAULT_TRUST_PILLARS, "title");
  await seedMany(PropertyType, DEFAULT_PROPERTY_TYPES, "name");
}

module.exports = { seedDefaults };
