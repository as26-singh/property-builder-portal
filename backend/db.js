const mongoose = require("mongoose");

async function connect() {
  const uri = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;
  if (!uri || !dbName) throw new Error("MONGO_URL and DB_NAME must be set in backend/.env");
  await mongoose.connect(uri, { dbName });
  console.log(`[db] connected → ${dbName}`);
}

// ---------- Schemas ----------
// All documents use a string `id` (uuid) as the business identifier.
// Mongoose's default _id is ignored in responses.

const baseOpts = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  toJSON: { versionKey: false, transform: (_d, r) => { delete r._id; delete r.password_hash; return r; } },
};

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: String,
  role: { type: String, enum: ["super_admin", "associate"], required: true },
}, baseOpts);

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  name: String,
  location: String,
  tagline: String,
  description: String,
  price_from: Number,
  area: String,
  status: String,
  image: String,
  master_plan_url: String,
  brochure_url: String,
}, baseOpts);

const propertySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  project_id: String,
  number: String,
  size: String,
  price: Number,
  status: String,
  facing: String,
}, baseOpts);

const leadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  email: String,
  project_id: String,
  message: String,
  status: { type: String, default: "new" },
  assigned_associate_id: String,
  source: String,
}, baseOpts);

const siteVisitSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  lead_id: String,
  associate_id: String,
  project_id: String,
  visit_date: String,
  preferred_time: String,
  status: { type: String, default: "requested" },
  notes: String,
}, baseOpts);

const reservationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  property_id: String,
  lead_id: String,
  associate_id: String,
  status: { type: String, default: "pending" },
  reviewed_at: String,
}, baseOpts);

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reservation_id: String,
  property_id: String,
  lead_id: String,
  associate_id: String,
  status: { type: String, default: "pending" },
  reviewed_at: String,
}, baseOpts);

const uploadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  storage_path: String,
  url: String,
  original_filename: String,
  content_type: String,
  size: Number,
  category: String,
  project_id: String,
  is_deleted: { type: Boolean, default: false },
}, baseOpts);

const settingsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: "site-settings" },
  phone: String, email: String, address: String,
  tagline_en: String, tagline_hi: String,
  intro_title: String, intro_copy: String,
  phone_band_title: String, phone_band_copy: String,
  footer_copy: String,
  office_hours: String, about_links: String, quick_links: String,
  terms_url: String, privacy_url: String, copyright_text: String,
  instagram: String, facebook: String, linkedin: String,
}, { ...baseOpts, strict: false });

const heroSlideSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  image: String, kicker: String, title: String, subtitle: String,
  cta_label: String, cta_link: String, order: { type: Number, default: 0 },
}, baseOpts);

const testimonialSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  quote: String, name: String, role: String, order: { type: Number, default: 0 },
}, baseOpts);

const trustPillarSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  icon: String, title: String, description: String, order: { type: Number, default: 0 },
}, baseOpts);

const propertyTypeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  icon: String, name: String, description: String, order: { type: Number, default: 0 },
}, baseOpts);

const leadActivitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  lead_id: String, associate_id: String, type: String, note: String, status: String,
}, baseOpts);

const inquirySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  lead_id: String, type: String,
}, baseOpts);

module.exports = {
  connect,
  User: mongoose.model("User", userSchema, "users"),
  Project: mongoose.model("Project", projectSchema, "projects"),
  Property: mongoose.model("Property", propertySchema, "properties"),
  Lead: mongoose.model("Lead", leadSchema, "leads"),
  SiteVisit: mongoose.model("SiteVisit", siteVisitSchema, "siteVisits"),
  Reservation: mongoose.model("Reservation", reservationSchema, "reservations"),
  Booking: mongoose.model("Booking", bookingSchema, "bookings"),
  Gallery: mongoose.model("Gallery", uploadSchema, "gallery"),
  Document: mongoose.model("Document", uploadSchema, "documents"),
  Settings: mongoose.model("Settings", settingsSchema, "settings"),
  HeroSlide: mongoose.model("HeroSlide", heroSlideSchema, "heroSlides"),
  Testimonial: mongoose.model("Testimonial", testimonialSchema, "testimonials"),
  TrustPillar: mongoose.model("TrustPillar", trustPillarSchema, "trustPillars"),
  PropertyType: mongoose.model("PropertyType", propertyTypeSchema, "propertyTypes"),
  LeadActivity: mongoose.model("LeadActivity", leadActivitySchema, "leadActivities"),
  Inquiry: mongoose.model("Inquiry", inquirySchema, "inquiries"),
};
