require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");

const models = require("./db");
const {
  User, Project, Property, Lead, SiteVisit, Reservation, Booking,
  Gallery, Document, Settings, HeroSlide, Testimonial, TrustPillar, PropertyType,
  LeadActivity, Inquiry,
} = models;
const { hashPassword, verifyPassword, issueToken, cookieOptions, currentUser, requireRole } = require("./auth");
const { seedDefaults } = require("./seed");

const app = express();
const api = express.Router();

// ---------- Middleware ----------
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(cookieParser());
// FRONTEND_URL may be a comma-separated list (local dev + deployed preview + production).
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

// ---------- Multer (local disk) ----------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = (file.originalname.split(".").pop() || "bin").toLowerCase();
    cb(null, `${randomUUID()}.${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ok.includes(file.mimetype)) return cb(new Error("Only JPG, PNG, WEBP and PDF are supported"));
    cb(null, true);
  },
});

// ---------- Helpers ----------
const requireAdmin = [currentUser, requireRole("super_admin")];
const requireAssociate = [currentUser, requireRole("associate")];

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function toPublic(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  delete o._id;
  delete o.__v;
  delete o.password_hash;
  return o;
}

function listPublic(docs) {
  return docs.map(toPublic);
}

// Clients echo back full documents when saving; strip identity/timestamp fields
// so `$set` never collides with `$setOnInsert` or Mongoose-managed timestamps.
const READ_ONLY_FIELDS = ["_id", "__v", "id", "created_at", "updated_at", "createdAt", "updatedAt", "properties", "password_hash"];
function sanitizeBody(body, numericFields = []) {
  const out = { ...(body || {}) };
  for (const f of READ_ONLY_FIELDS) delete out[f];
  for (const f of numericFields) {
    if (out[f] === "" || out[f] === null || out[f] === undefined) delete out[f];
    else out[f] = Number(out[f]) || 0;
  }
  return out;
}

// ---------- Root ----------
api.get("/", (_req, res) => res.json({ message: "Nirnay Group API", status: "ready" }));

// ---------- Auth ----------
api.post("/auth/login", asyncH(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ detail: "Email and password required" });
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ detail: "Incorrect email or password" });
  }
  res.cookie("access_token", issueToken(user), cookieOptions());
  res.json(toPublic(user));
}));

api.get("/auth/me", currentUser, (req, res) => res.json(req.user));

api.post("/auth/logout", (_req, res) => {
  res.clearCookie("access_token", { ...cookieOptions(), maxAge: 0 });
  res.json({ message: "Logged out" });
});

// ---------- Public ----------
api.get("/public/projects", asyncH(async (_req, res) => {
  const docs = await Project.find({}).sort({ created_at: 1 }).limit(200);
  res.json(listPublic(docs));
}));

api.get("/public/projects/:slug", asyncH(async (req, res) => {
  const project = await Project.findOne({ slug: req.params.slug });
  if (!project) return res.status(404).json({ detail: "Project not found" });
  const properties = await Property.find({ project_id: project.id }).limit(200);
  res.json({ ...toPublic(project), properties: listPublic(properties) });
}));

api.get("/public/properties", asyncH(async (_req, res) => {
  const docs = await Property.find({}).limit(500);
  res.json(listPublic(docs));
}));

api.get("/public/gallery", asyncH(async (_req, res) => {
  const docs = await Gallery.find({ is_deleted: false }).limit(200);
  res.json(listPublic(docs));
}));

api.post("/public/inquiries", asyncH(async (req, res) => {
  const { name, phone, email, project_id, message } = req.body || {};
  if (!name || !phone) return res.status(400).json({ detail: "Name and phone are required" });
  const lead = await Lead.create({
    id: randomUUID(), name, phone, email, project_id, message,
    status: "new", source: "website",
  });
  await Inquiry.create({ id: randomUUID(), lead_id: lead.id, type: "inquiry" });
  res.json({ message: "Thanks — our team will be in touch shortly.", lead_id: lead.id });
}));

api.post("/public/site-visits", asyncH(async (req, res) => {
  const { name, phone, email, project_id, message, preferred_date, preferred_time = "Morning" } = req.body || {};
  if (!name || !phone || !preferred_date) return res.status(400).json({ detail: "Missing required fields" });
  const lead = await Lead.create({
    id: randomUUID(), name, phone, email, project_id, message,
    status: "new", source: "website",
  });
  const visit = await SiteVisit.create({
    id: randomUUID(), lead_id: lead.id, project_id, visit_date: preferred_date,
    preferred_time, status: "requested",
  });
  res.json({ message: "Your site visit request is on its way.", visit_id: visit.id });
}));

api.get("/public/site-content", asyncH(async (_req, res) => {
  const [settings, heroSlides, testimonials, trustPillars, propertyTypes] = await Promise.all([
    Settings.findOne({ id: "site-settings" }),
    HeroSlide.find({}).sort({ order: 1 }).limit(50),
    Testimonial.find({}).sort({ order: 1 }).limit(50),
    TrustPillar.find({}).sort({ order: 1 }).limit(50),
    PropertyType.find({}).sort({ order: 1 }).limit(50),
  ]);
  res.json({
    settings: toPublic(settings) || {},
    heroSlides: listPublic(heroSlides),
    testimonials: listPublic(testimonials),
    trustPillars: listPublic(trustPillars),
    propertyTypes: listPublic(propertyTypes),
  });
}));

// ---------- Media ----------
api.get("/media/:filename", (req, res) => {
  const safe = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, safe);
  if (!fs.existsSync(filePath)) return res.status(404).json({ detail: "File not found" });
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.sendFile(filePath);
});

// ---------- Admin: dashboard, leads, associates ----------
api.get("/admin/dashboard", requireAdmin, asyncH(async (_req, res) => {
  const [projects, properties, leads, siteVisits, reservations, bookings, users, available, associates, pending_leads] = await Promise.all([
    Project.countDocuments(), Property.countDocuments(), Lead.countDocuments(),
    SiteVisit.countDocuments(), Reservation.countDocuments(), Booking.countDocuments(),
    User.countDocuments(), Property.countDocuments({ status: "available" }),
    User.countDocuments({ role: "associate" }),
    Lead.countDocuments({ assigned_associate_id: { $in: [null, ""] } }),
  ]);
  res.json({ projects, properties, leads, siteVisits, reservations, bookings, users, available, associates, pending_leads });
}));

api.get("/admin/leads", requireAdmin, asyncH(async (_req, res) => {
  const docs = await Lead.find({}).sort({ created_at: -1 }).limit(500);
  res.json(listPublic(docs));
}));

api.patch("/admin/leads/:id/assign", requireAdmin, asyncH(async (req, res) => {
  const { associate_id } = req.body || {};
  await Lead.updateOne({ id: req.params.id }, { $set: { assigned_associate_id: associate_id } });
  res.json({ message: "Lead assigned" });
}));

api.get("/admin/associates", requireAdmin, asyncH(async (_req, res) => {
  const docs = await User.find({ role: "associate" }).limit(200);
  res.json(listPublic(docs));
}));

api.post("/admin/associates", requireAdmin, asyncH(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ detail: "name/email/password required" });
  const em = String(email).toLowerCase();
  if (await User.findOne({ email: em })) return res.status(409).json({ detail: "A user with this email already exists" });
  const user = await User.create({ id: randomUUID(), name, email: em, password_hash: hashPassword(password), role: "associate" });
  res.json(toPublic(user));
}));

api.delete("/admin/associates/:id", requireAdmin, asyncH(async (req, res) => {
  const user = await User.findOne({ id: req.params.id, role: "associate" });
  if (!user) return res.status(404).json({ detail: "Associate not found" });
  await User.deleteOne({ id: user.id });
  await Lead.updateMany({ assigned_associate_id: user.id }, { $set: { assigned_associate_id: null } });
  res.json({ message: "Associate removed" });
}));

// ---------- Admin: properties CRUD ----------
api.get("/admin/properties", requireAdmin, asyncH(async (req, res) => {
  const filter = req.query.project_id ? { project_id: req.query.project_id } : {};
  const docs = await Property.find(filter).sort({ created_at: 1 }).limit(500);
  res.json(listPublic(docs));
}));

api.post("/admin/properties", requireAdmin, asyncH(async (req, res) => {
  const { project_id, number, size, price, status = "available", facing = "East" } = req.body || {};
  if (!project_id || !number) return res.status(400).json({ detail: "project_id and number are required" });
  if (!(await Project.findOne({ id: project_id }))) return res.status(404).json({ detail: "Project not found" });
  const doc = await Property.create({
    id: randomUUID(), project_id, number: String(number), size: size || "",
    price: Number(price) || 0, status, facing,
  });
  res.json(toPublic(doc));
}));

api.patch("/admin/properties/:id", requireAdmin, asyncH(async (req, res) => {
  const body = sanitizeBody(req.body, ["price"]);
  if (body.number !== undefined) body.number = String(body.number);
  if (body.project_id && !(await Project.findOne({ id: body.project_id }))) {
    return res.status(404).json({ detail: "Project not found" });
  }
  const r = await Property.updateOne({ id: req.params.id }, { $set: body });
  if (r.matchedCount === 0) return res.status(404).json({ detail: "Property not found" });
  const doc = await Property.findOne({ id: req.params.id });
  res.json(toPublic(doc));
}));

api.delete("/admin/properties/:id", requireAdmin, asyncH(async (req, res) => {
  const r = await Property.deleteOne({ id: req.params.id });
  if (r.deletedCount === 0) return res.status(404).json({ detail: "Property not found" });
  res.json({ message: "Property deleted" });
}));

// ---------- Admin: uploads ----------
api.post("/admin/uploads", requireAdmin, upload.single("file"), asyncH(async (req, res) => {
  if (!req.file) return res.status(400).json({ detail: "No file uploaded" });
  const category = (req.body.category || "documents").toString();
  const project_id = req.body.project_id || null;
  const storage_path = req.file.filename;
  const url = `/api/media/${storage_path}`;
  const record = {
    id: randomUUID(), storage_path, url,
    original_filename: req.file.originalname, content_type: req.file.mimetype,
    size: req.file.size, category, project_id, is_deleted: false,
  };
  const Model = category === "gallery" ? Gallery : Document;
  const doc = await Model.create(record);
  res.json(toPublic(doc));
}));

// ---------- Admin: reservations / bookings ----------
api.get("/admin/reservations", requireAdmin, asyncH(async (_req, res) => {
  const docs = await Reservation.find({}).sort({ created_at: -1 }).limit(500);
  res.json(listPublic(docs));
}));

api.patch("/admin/reservations/:id", requireAdmin, asyncH(async (req, res) => {
  const reservation = await Reservation.findOne({ id: req.params.id });
  if (!reservation) return res.status(404).json({ detail: "Reservation not found" });
  const status = req.body?.decision === "approve" ? "approved" : "rejected";
  const reviewed_at = new Date().toISOString();
  await Reservation.updateOne({ id: reservation.id }, { $set: { status, reviewed_at } });
  if (status === "rejected") {
    await Property.updateOne({ id: reservation.property_id }, { $set: { status: "available" } });
  }
  res.json({ message: `Reservation ${status}` });
}));

api.get("/admin/bookings", requireAdmin, asyncH(async (_req, res) => {
  const docs = await Booking.find({}).sort({ created_at: -1 }).limit(500);
  res.json(listPublic(docs));
}));

api.patch("/admin/bookings/:id", requireAdmin, asyncH(async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return res.status(404).json({ detail: "Booking not found" });
  const status = req.body?.decision === "approve" ? "approved" : "rejected";
  const reviewed_at = new Date().toISOString();
  await Booking.updateOne({ id: booking.id }, { $set: { status, reviewed_at } });
  if (status === "approved") {
    await Property.updateOne({ id: booking.property_id }, { $set: { status: "booked" } });
  }
  res.json({ message: `Booking ${status}` });
}));

const LEAD_STATUSES = ["new", "contacted", "interested", "visit_scheduled", "visited", "negotiation", "reserved", "booked", "sold"];
const PROPERTY_STATUSES = ["available", "reserved", "negotiation", "booked", "sold", "blocked"];

api.get("/admin/reports", requireAdmin, asyncH(async (_req, res) => {
  const [leadCounts, propCounts] = await Promise.all([
    Lead.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Property.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const lead_status = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0]));
  const property_status = Object.fromEntries(PROPERTY_STATUSES.map((s) => [s, 0]));
  for (const c of leadCounts) if (c._id in lead_status) lead_status[c._id] = c.n;
  for (const c of propCounts) if (c._id in property_status) property_status[c._id] = c.n;
  res.json({ lead_status, property_status });
}));

api.get("/admin/documents", requireAdmin, asyncH(async (_req, res) => {
  const docs = await Document.find({ is_deleted: false }).limit(500);
  res.json(listPublic(docs));
}));

api.get("/admin/gallery", requireAdmin, asyncH(async (_req, res) => {
  const docs = await Gallery.find({ is_deleted: false }).limit(500);
  res.json(listPublic(docs));
}));

api.delete("/admin/gallery/:id", requireAdmin, asyncH(async (req, res) => {
  const r = await Gallery.deleteOne({ id: req.params.id });
  if (r.deletedCount === 0) return res.status(404).json({ detail: "Image not found" });
  res.json({ message: "Deleted" });
}));

// ---------- Admin: settings + content collections ----------
api.get("/admin/settings", requireAdmin, asyncH(async (_req, res) => {
  const s = await Settings.findOne({ id: "site-settings" });
  res.json(toPublic(s) || {});
}));

api.put("/admin/settings", requireAdmin, asyncH(async (req, res) => {
  const body = sanitizeBody(req.body);
  await Settings.updateOne({ id: "site-settings" }, { $set: body, $setOnInsert: { id: "site-settings" } }, { upsert: true });
  const s = await Settings.findOne({ id: "site-settings" });
  res.json(toPublic(s));
}));

const CONTENT_MODELS = {
  "hero-slides": HeroSlide,
  "testimonials": Testimonial,
  "trust-pillars": TrustPillar,
  "property-types": PropertyType,
};

api.get("/admin/content/:collection", requireAdmin, asyncH(async (req, res) => {
  const Model = CONTENT_MODELS[req.params.collection];
  if (!Model) return res.status(404).json({ detail: "Unknown content collection" });
  const docs = await Model.find({}).sort({ order: 1 }).limit(200);
  res.json(listPublic(docs));
}));

api.post("/admin/content/:collection", requireAdmin, asyncH(async (req, res) => {
  const Model = CONTENT_MODELS[req.params.collection];
  if (!Model) return res.status(404).json({ detail: "Unknown content collection" });
  const payload = { ...sanitizeBody(req.body, ["order"]), id: randomUUID() };
  const doc = await Model.create(payload);
  res.json(toPublic(doc));
}));

api.patch("/admin/content/:collection/:id", requireAdmin, asyncH(async (req, res) => {
  const Model = CONTENT_MODELS[req.params.collection];
  if (!Model) return res.status(404).json({ detail: "Unknown content collection" });
  const body = sanitizeBody(req.body, ["order"]);
  const r = await Model.updateOne({ id: req.params.id }, { $set: body });
  if (r.matchedCount === 0) return res.status(404).json({ detail: "Item not found" });
  const doc = await Model.findOne({ id: req.params.id });
  res.json(toPublic(doc));
}));

api.delete("/admin/content/:collection/:id", requireAdmin, asyncH(async (req, res) => {
  const Model = CONTENT_MODELS[req.params.collection];
  if (!Model) return res.status(404).json({ detail: "Unknown content collection" });
  const r = await Model.deleteOne({ id: req.params.id });
  if (r.deletedCount === 0) return res.status(404).json({ detail: "Item not found" });
  res.json({ message: "Deleted" });
}));

// ---------- Admin: projects CRUD ----------
api.get("/admin/projects", requireAdmin, asyncH(async (_req, res) => {
  const docs = await Project.find({}).sort({ created_at: 1 }).limit(200);
  res.json(listPublic(docs));
}));

api.post("/admin/projects", requireAdmin, asyncH(async (req, res) => {
  const body = sanitizeBody(req.body, ["price_from"]);
  const slug = String(body.slug || "").trim().toLowerCase();
  if (!slug || !body.name) return res.status(400).json({ detail: "Slug and name are required" });
  if (await Project.findOne({ slug })) return res.status(409).json({ detail: "A project with this slug already exists" });
  const doc = await Project.create({ ...body, slug, id: randomUUID() });
  res.json(toPublic(doc));
}));

api.patch("/admin/projects/:id", requireAdmin, asyncH(async (req, res) => {
  const body = sanitizeBody(req.body, ["price_from"]);
  if (body.slug) body.slug = String(body.slug).trim().toLowerCase();
  if (body.slug) {
    const conflict = await Project.findOne({ slug: body.slug, id: { $ne: req.params.id } });
    if (conflict) return res.status(409).json({ detail: "Another project already uses this slug" });
  }
  const r = await Project.updateOne({ id: req.params.id }, { $set: body });
  if (r.matchedCount === 0) return res.status(404).json({ detail: "Project not found" });
  const doc = await Project.findOne({ id: req.params.id });
  res.json(toPublic(doc));
}));

api.delete("/admin/projects/:id", requireAdmin, asyncH(async (req, res) => {
  const r = await Project.deleteOne({ id: req.params.id });
  if (r.deletedCount === 0) return res.status(404).json({ detail: "Project not found" });
  await Property.deleteMany({ project_id: req.params.id });
  res.json({ message: "Project and its properties deleted" });
}));

// ---------- Associate ----------
api.get("/associate/dashboard", requireAssociate, asyncH(async (req, res) => {
  const uid = req.user.id;
  const [leads, follow_ups, visits, reservations, bookings] = await Promise.all([
    Lead.countDocuments({ assigned_associate_id: uid }),
    Lead.countDocuments({ assigned_associate_id: uid, status: { $in: ["new", "contacted", "interested"] } }),
    SiteVisit.countDocuments({ associate_id: uid }),
    Reservation.countDocuments({ associate_id: uid }),
    Booking.countDocuments({ associate_id: uid }),
  ]);
  res.json({ leads, follow_ups, visits, reservations, bookings });
}));

api.get("/associate/leads", requireAssociate, asyncH(async (req, res) => {
  const docs = await Lead.find({ assigned_associate_id: req.user.id }).sort({ created_at: -1 }).limit(500);
  res.json(listPublic(docs));
}));

api.patch("/associate/leads/:id/status", requireAssociate, asyncH(async (req, res) => {
  const lead = await Lead.findOne({ id: req.params.id, assigned_associate_id: req.user.id });
  if (!lead) return res.status(404).json({ detail: "Assigned lead not found" });
  const { status, note = "" } = req.body || {};
  if (!LEAD_STATUSES.includes(status)) return res.status(400).json({ detail: "Invalid lead status" });
  await Lead.updateOne({ id: lead.id }, { $set: { status } });
  await LeadActivity.create({ id: randomUUID(), lead_id: lead.id, associate_id: req.user.id, type: "status_change", note, status });
  res.json({ message: "Lead updated" });
}));

api.get("/associate/site-visits", requireAssociate, asyncH(async (req, res) => {
  const docs = await SiteVisit.find({ associate_id: req.user.id }).sort({ visit_date: 1 }).limit(200);
  res.json(listPublic(docs));
}));

api.post("/associate/site-visits", requireAssociate, asyncH(async (req, res) => {
  const { lead_id, project_id, visit_date, preferred_time = "Morning", notes = "" } = req.body || {};
  if (!lead_id || !visit_date) return res.status(400).json({ detail: "lead_id and visit_date are required" });
  const lead = await Lead.findOne({ id: lead_id, assigned_associate_id: req.user.id });
  if (!lead) return res.status(404).json({ detail: "Assigned lead not found" });
  const visit = await SiteVisit.create({
    id: randomUUID(), lead_id, associate_id: req.user.id, project_id: project_id || lead.project_id,
    visit_date, preferred_time, notes, status: "scheduled",
  });
  await Lead.updateOne({ id: lead_id }, { $set: { status: "visit_scheduled" } });
  res.json(toPublic(visit));
}));

api.get("/associate/reservations", requireAssociate, asyncH(async (req, res) => {
  const docs = await Reservation.find({ associate_id: req.user.id }).sort({ created_at: -1 }).limit(200);
  res.json(listPublic(docs));
}));

api.get("/associate/bookings", requireAssociate, asyncH(async (req, res) => {
  const docs = await Booking.find({ associate_id: req.user.id }).sort({ created_at: -1 }).limit(200);
  res.json(listPublic(docs));
}));

api.get("/associate/properties", requireAssociate, asyncH(async (_req, res) => {
  const docs = await Property.find({}).limit(500);
  res.json(listPublic(docs));
}));

api.post("/associate/reservations", requireAssociate, asyncH(async (req, res) => {
  const { property_id, lead_id } = req.body || {};
  if (!property_id || !lead_id) return res.status(400).json({ detail: "property_id and lead_id required" });
  const prop = await Property.findOne({ id: property_id, status: "available" });
  if (!prop) return res.status(409).json({ detail: "This property is no longer available" });
  const lead = await Lead.findOne({ id: lead_id, assigned_associate_id: req.user.id });
  if (!lead) return res.status(404).json({ detail: "Assigned lead not found" });
  await Reservation.create({ id: randomUUID(), property_id, lead_id, associate_id: req.user.id, status: "pending" });
  await Property.updateOne({ id: property_id }, { $set: { status: "reserved" } });
  await Lead.updateOne({ id: lead_id }, { $set: { status: "reserved" } });
  res.json({ message: "Reservation submitted for approval" });
}));

api.post("/associate/bookings", requireAssociate, express.urlencoded({ extended: true }), asyncH(async (req, res) => {
  const { reservation_id } = req.body || {};
  const reservation = await Reservation.findOne({ id: reservation_id, associate_id: req.user.id, status: "approved" });
  if (!reservation) return res.status(409).json({ detail: "Only approved reservations can become booking requests" });
  const existing = await Booking.findOne({ reservation_id });
  if (existing) return res.json(toPublic(existing));
  const booking = await Booking.create({
    id: randomUUID(), reservation_id, property_id: reservation.property_id,
    lead_id: reservation.lead_id, associate_id: req.user.id, status: "pending",
  });
  res.json(toPublic(booking));
}));

// ---------- Mount ----------
app.use("/api", api);

// Error handler
app.use((err, _req, res, _next) => {
  console.error("[error]", err.message);
  let status = err.status || 500;
  let detail = err.message || "Server error";
  if (err.name === "ValidationError" || err.name === "CastError") {
    status = 400;
    detail = Object.values(err.errors || {}).map((e) => e.message).join(", ") || err.message;
  } else if (err.code === 11000) {
    status = 409;
    detail = `Duplicate value for ${Object.keys(err.keyValue || {}).join(", ") || "a unique field"}`;
  } else if (err.code === "LIMIT_FILE_SIZE") {
    status = 400;
    detail = "File is larger than 10 MB";
  } else if (err.message?.includes("supported") || err.message?.includes("CORS")) {
    status = err.message.includes("CORS") ? 403 : 400;
  }
  res.status(status).json({ detail });
});

// ---------- Start ----------
const PORT = parseInt(process.env.PORT || "8001", 10);
const HOST = process.env.HOST || "0.0.0.0";

(async () => {
  try {
    await models.connect();
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await seedDefaults();
    app.listen(PORT, HOST, () => console.log(`[server] listening on http://${HOST}:${PORT}`));
  } catch (e) {
    console.error("[fatal] startup failed:", e);
    process.exit(1);
  }
})();
