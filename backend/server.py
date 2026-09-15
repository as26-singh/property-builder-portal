from fastapi import FastAPI, APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import requests


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
APP_NAME = "verdant-estates"
storage_key = None
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def public_doc(doc):
    if not doc:
        return None
    doc = {k: v for k, v in doc.items() if k != "_id" and k != "password_hash"}
    return doc

def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def init_storage(force=False):
    global storage_key
    if storage_key and not force:
        return storage_key
    response = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ["EMERGENT_LLM_KEY"]}, timeout=30)
    response.raise_for_status()
    storage_key = response.json()["storage_key"]
    return storage_key

def put_object(path, data, content_type):
    response = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(), "Content-Type": content_type}, data=data, timeout=120)
    response.raise_for_status()
    return response.json()

def token(user_id, email, role):
    return jwt.encode({"sub": user_id, "email": email, "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=8)}, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

async def current_user(request: Request):
    value = request.cookies.get("access_token")
    if not value:
        auth = request.headers.get("Authorization", "")
        value = auth[7:] if auth.startswith("Bearer ") else None
    if not value:
        raise HTTPException(401, "Authentication required")
    try:
        payload = jwt.decode(value, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except (jwt.InvalidTokenError, KeyError):
        raise HTTPException(401, "Invalid or expired session")

async def admin_user(user=Depends(current_user)):
    if user["role"] != "super_admin":
        raise HTTPException(403, "Admin access required")
    return user

async def associate_user(user=Depends(current_user)):
    if user["role"] != "associate":
        raise HTTPException(403, "Associate access required")
    return user

DEFAULT_SETTINGS = {
    "id": "site-settings",
    "phone": "+91 98765 43210",
    "email": "hello@nirnaygroup.com",
    "address": "Kanpur, Uttar Pradesh, India",
    "tagline_en": "Places that feel like yours",
    "tagline_hi": "हमारा प्रयास, बेहतर आवास",
    "intro_title": "Not just a plot. A place to belong.",
    "intro_copy": "We create considered spaces that give you more than an address — a setting for your next chapter, with nature, community and everyday ease built in.",
    "phone_band_title": "Talk to a Nirnay advisor",
    "phone_band_copy": "Call for personal guidance, project walkthroughs or availability updates.",
    "footer_copy": "Places with room to become your own.",
    "office_hours": "Monday|10:00 am – 6:00 pm\nTuesday|Closed\nWednesday|10:00 am – 6:00 pm\nThursday|10:00 am – 6:00 pm\nFriday|10:00 am – 6:00 pm\nSaturday|10:00 am – 6:00 pm\nSunday|By appointment",
    "about_links": "About Company|/about\nLegal Documents|/about",
    "quick_links": "Terms of Use|/about\nPrivacy Policy|/about\nContact Support|/contact\nCareers|/contact",
    "terms_url": "/about",
    "privacy_url": "/about",
    "copyright_text": "© 2026 Nirnay Group. All rights reserved.",
    "instagram": "",
    "facebook": "",
    "linkedin": "",
}

DEFAULT_HERO_SLIDES = [
    {"image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85", "kicker": "Places that feel like yours", "title": "Make room for what matters.", "subtitle": "Thoughtfully planned homes and plots for people who want a little more life around them.", "cta_label": "Explore projects", "cta_link": "/projects", "order": 0},
    {"image": "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=85", "kicker": "Neighbourhoods, considered", "title": "Land, patiently curated.", "subtitle": "Ready plots in green pockets, road-connected and community-designed for the long haul.", "cta_label": "See our projects", "cta_link": "/projects", "order": 1},
    {"image": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85", "kicker": "Rise above the everyday", "title": "Homes with a view.", "subtitle": "Premium apartments with wellness amenities, quiet corners and open skies.", "cta_label": "Book a private visit", "cta_link": "/book-site-visit", "order": 2},
]

DEFAULT_TESTIMONIALS = [
    {"quote": "Nirnay didn't just sell us a plot — they gave us a plan. Two years in, our home fits our life better than we imagined.", "name": "Priya Sharma", "role": "Homeowner, Verdant Meadows", "order": 0},
    {"quote": "Straightforward pricing, honest advice, and every promise kept. That is rare in Kanpur real estate.", "name": "Rohan Mehta", "role": "Investor, Nirnay Heights", "order": 1},
    {"quote": "Their team walked us through everything, right down to loan paperwork. It felt like family, not a sales pitch.", "name": "Ananya Kapoor", "role": "First-time buyer", "order": 2},
]

DEFAULT_TRUST_PILLARS = [
    {"icon": "MapPin", "title": "Curated locations", "description": "Every project sits on land we picked for its long-term value — connectivity, green cover and community.", "order": 0},
    {"icon": "ShieldCheck", "title": "Transparent pricing", "description": "No hidden fees, no last-minute surprises. What you're quoted is what you sign.", "order": 1},
    {"icon": "Users", "title": "End-to-end guidance", "description": "From your first visit to key handover — one team, one point of contact.", "order": 2},
]

DEFAULT_PROPERTY_TYPES = [
    {"icon": "MapPin", "name": "Residential plots", "description": "Ready-to-build plots in gated communities.", "order": 0},
    {"icon": "Home", "name": "Apartments", "description": "Premium homes with wellness amenities.", "order": 1},
    {"icon": "TreePine", "name": "Farm plots", "description": "Weekend homes and orchards close to nature.", "order": 2},
    {"icon": "Building2", "name": "Commercial", "description": "Shops, offices and retail plots.", "order": 3},
]


async def seed_defaults(collection: str, docs: list):
    for doc in docs:
        key = {"title": doc.get("title")} if "title" in doc and collection == "trustPillars" else \
              {"name": doc.get("name")} if collection in {"testimonials", "propertyTypes"} else \
              {"title": doc.get("title")} if collection == "heroSlides" else None
        if key and await db[collection].find_one(key):
            continue
        if not key and await db[collection].count_documents({}) > 0:
            continue
        await db[collection].insert_one({"id": str(uuid.uuid4()), "created_at": now_iso(), **doc})


async def seed_data():
    await db.users.create_index("email", unique=True)
    if not await db.users.find_one({"email": os.environ["ADMIN_EMAIL"].lower()}):
        await db.users.insert_one({"id": str(uuid.uuid4()), "name": "Company Owner", "email": os.environ["ADMIN_EMAIL"].lower(), "password_hash": hash_password(os.environ["ADMIN_PASSWORD"]), "role": "super_admin", "created_at": now_iso()})
    if not await db.users.find_one({"email": "associate@verdant.example"}):
        await db.users.insert_one({"id": str(uuid.uuid4()), "name": "Amit Sharma", "email": "associate@verdant.example", "password_hash": hash_password("Associate@12345"), "role": "associate", "created_at": now_iso()})
    if not await db.projects.find_one({"slug": "verdant-meadows"}):
        project_id = str(uuid.uuid4())
        await db.projects.insert_one({"id": project_id, "slug": "verdant-meadows", "name": "Verdant Meadows", "location": "Kanpur, Uttar Pradesh", "tagline": "A quieter way to come home.", "description": "Thoughtfully planned plots surrounded by green corridors, generous roads, and a community designed for long-term living.", "price_from": 1850000, "area": "18 acres", "status": "selling", "image": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85", "created_at": now_iso()})
        for number, size, status in [("A-101", "1200 sq.ft", "available"), ("A-102", "1500 sq.ft", "reserved"), ("B-204", "1800 sq.ft", "available"), ("C-112", "2400 sq.ft", "booked")]:
            await db.properties.insert_one({"id": str(uuid.uuid4()), "project_id": project_id, "number": number, "size": size, "price": 1850000 if size == "1200 sq.ft" else 2450000, "status": status, "facing": "East", "created_at": now_iso()})
    # Content collections
    if not await db.settings.find_one({"id": "site-settings"}):
        await db.settings.insert_one({**DEFAULT_SETTINGS, "created_at": now_iso(), "updated_at": now_iso()})
    if not await db.heroSlides.find_one({}):
        for slide in DEFAULT_HERO_SLIDES:
            await db.heroSlides.insert_one({"id": str(uuid.uuid4()), "created_at": now_iso(), **slide})
    if not await db.testimonials.find_one({}):
        for item in DEFAULT_TESTIMONIALS:
            await db.testimonials.insert_one({"id": str(uuid.uuid4()), "created_at": now_iso(), **item})
    if not await db.trustPillars.find_one({}):
        for item in DEFAULT_TRUST_PILLARS:
            await db.trustPillars.insert_one({"id": str(uuid.uuid4()), "created_at": now_iso(), **item})
    if not await db.propertyTypes.find_one({}):
        for item in DEFAULT_PROPERTY_TYPES:
            await db.propertyTypes.insert_one({"id": str(uuid.uuid4()), "created_at": now_iso(), **item})

@app.on_event("startup")
async def startup():
    await seed_data()


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Verdant Estates API", "status": "ready"}

class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class InquiryInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    email: Optional[EmailStr] = None
    project_id: Optional[str] = None
    message: Optional[str] = Field(default="", max_length=1000)

class VisitInput(InquiryInput):
    preferred_date: str
    preferred_time: str = "Morning"

class LeadStatusInput(BaseModel):
    status: str
    note: Optional[str] = ""

class AssignmentInput(BaseModel):
    associate_id: str

class DecisionInput(BaseModel):
    decision: str

class AssociateInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)

@api_router.post("/auth/login")
async def login(input: LoginInput, response: Response):
    user = await db.users.find_one({"email": input.email.lower()})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(401, "Incorrect email or password")
    response.set_cookie("access_token", token(user["id"], user["email"], user["role"]), httponly=True, secure=True, samesite="none", max_age=28800)
    return public_doc(user)

@api_router.get("/auth/me")
async def me(user=Depends(current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}

@api_router.get("/public/projects")
async def public_projects():
    return [public_doc(x) for x in await db.projects.find({}, {"_id": 0}).to_list(100)]

@api_router.get("/public/projects/{slug}")
async def public_project(slug: str):
    project = public_doc(await db.projects.find_one({"slug": slug}, {"_id": 0}))
    if not project: raise HTTPException(404, "Project not found")
    project["properties"] = [public_doc(x) for x in await db.properties.find({"project_id": project["id"]}, {"_id": 0}).to_list(100)]
    return project

@api_router.get("/public/properties")
async def public_properties():
    return [public_doc(x) for x in await db.properties.find({}, {"_id": 0}).to_list(500)]

@api_router.post("/public/inquiries")
async def create_inquiry(input: InquiryInput):
    lead = {"id": str(uuid.uuid4()), "name": input.name, "phone": input.phone, "email": input.email, "project_id": input.project_id, "message": input.message, "status": "new", "assigned_associate_id": None, "source": "website", "created_at": now_iso(), "updated_at": now_iso()}
    await db.leads.insert_one(lead)
    await db.inquiries.insert_one({"id": str(uuid.uuid4()), "lead_id": lead["id"], "type": "inquiry", "created_at": now_iso()})
    return {"message": "Thanks — our team will be in touch shortly.", "lead_id": lead["id"]}

@api_router.post("/public/site-visits")
async def public_visit(input: VisitInput):
    lead_result = await create_inquiry(InquiryInput(name=input.name, phone=input.phone, email=input.email, project_id=input.project_id, message=input.message))
    visit = {"id": str(uuid.uuid4()), "lead_id": lead_result["lead_id"], "project_id": input.project_id, "visit_date": input.preferred_date, "preferred_time": input.preferred_time, "status": "requested", "associate_id": None, "notes": "", "created_at": now_iso()}
    await db.siteVisits.insert_one(visit)
    return {"message": "Your site visit request is on its way.", "visit_id": visit["id"]}

@api_router.get("/admin/dashboard")
async def admin_dashboard(user=Depends(admin_user)):
    counts = {name: await db[name].count_documents({}) for name in ["projects", "properties", "leads", "siteVisits", "reservations", "bookings", "users"]}
    counts["available"] = await db.properties.count_documents({"status": "available"})
    counts["associates"] = await db.users.count_documents({"role": "associate"})
    counts["pending_leads"] = await db.leads.count_documents({"assigned_associate_id": None})
    return counts

@api_router.get("/admin/leads")
async def admin_leads(user=Depends(admin_user)):
    return [public_doc(x) for x in await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)]

@api_router.get("/admin/associates")
async def admin_associates(user=Depends(admin_user)):
    return [public_doc(x) for x in await db.users.find({"role": "associate"}, {"_id": 0, "password_hash": 0}).to_list(100)]

@api_router.post("/admin/associates")
async def create_associate(input: AssociateInput, user=Depends(admin_user)):
    email = input.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "A user with this email already exists")
    record = {"id": str(uuid.uuid4()), "name": input.name, "email": email, "password_hash": hash_password(input.password), "role": "associate", "created_at": now_iso()}
    await db.users.insert_one(record)
    return public_doc(record)

@api_router.post("/admin/uploads")
async def admin_upload(file: UploadFile = File(...), category: str = Form("documents"), project_id: Optional[str] = Form(None), user=Depends(admin_user)):
    allowed = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Only JPG, PNG, WEBP and PDF files are supported")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "Files must be smaller than 10MB")
    extension = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin").lower()
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{extension}"
    try:
        result = put_object(path, data, file.content_type)
    except requests.RequestException as exc:
        logger.error("Object storage upload failed: %s", exc)
        raise HTTPException(502, "Upload service is temporarily unavailable")
    record = {"id": str(uuid.uuid4()), "storage_path": result["path"], "url": f"/api/media/{result['path']}", "original_filename": file.filename, "content_type": file.content_type, "size": result.get("size", len(data)), "category": category, "project_id": project_id, "is_deleted": False, "created_at": now_iso()}
    collection = "gallery" if category == "gallery" else "documents"
    await db[collection].insert_one(record)
    return public_doc(record)

@api_router.patch("/admin/leads/{lead_id}/assign")
async def assign_lead(lead_id: str, input: AssignmentInput, user=Depends(admin_user)):
    await db.leads.update_one({"id": lead_id}, {"$set": {"assigned_associate_id": input.associate_id, "updated_at": now_iso()}})
    return {"message": "Lead assigned"}

@api_router.get("/associate/dashboard")
async def associate_dashboard(user=Depends(associate_user)):
    query = {"assigned_associate_id": user["id"]}
    return {"leads": await db.leads.count_documents(query), "follow_ups": await db.leads.count_documents({**query, "status": {"$in": ["new", "contacted", "interested"]}}), "visits": await db.siteVisits.count_documents({"associate_id": user["id"]}), "reservations": await db.reservations.count_documents({"associate_id": user["id"]}), "bookings": await db.bookings.count_documents({"associate_id": user["id"]})}

@api_router.get("/associate/leads")
async def associate_leads(user=Depends(associate_user)):
    return [public_doc(x) for x in await db.leads.find({"assigned_associate_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)]

@api_router.patch("/associate/leads/{lead_id}/status")
async def update_lead(lead_id: str, input: LeadStatusInput, user=Depends(associate_user)):
    lead = await db.leads.find_one({"id": lead_id, "assigned_associate_id": user["id"]}, {"_id": 0})
    if not lead: raise HTTPException(404, "Assigned lead not found")
    await db.leads.update_one({"id": lead_id}, {"$set": {"status": input.status, "updated_at": now_iso()}})
    await db.leadActivities.insert_one({"id": str(uuid.uuid4()), "lead_id": lead_id, "associate_id": user["id"], "type": "status_change", "note": input.note, "status": input.status, "created_at": now_iso()})
    return {"message": "Lead updated"}

@api_router.get("/associate/site-visits")
async def associate_visits(user=Depends(associate_user)):
    return [public_doc(x) for x in await db.siteVisits.find({"associate_id": user["id"]}, {"_id": 0}).sort("visit_date", 1).to_list(200)]

@api_router.get("/associate/reservations")
async def associate_reservations(user=Depends(associate_user)):
    return [public_doc(x) for x in await db.reservations.find({"associate_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)]

@api_router.get("/associate/bookings")
async def associate_bookings(user=Depends(associate_user)):
    return [public_doc(x) for x in await db.bookings.find({"associate_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)]

@api_router.get("/associate/properties")
async def associate_properties(user=Depends(associate_user)):
    return [public_doc(x) for x in await db.properties.find({}, {"_id": 0}).to_list(500)]

@api_router.post("/associate/reservations")
async def reserve_property(property_id: str = Form(...), lead_id: str = Form(...), user=Depends(associate_user)):
    prop = await db.properties.find_one({"id": property_id, "status": "available"}, {"_id": 0})
    if not prop: raise HTTPException(409, "This property is no longer available")
    reservation = {"id": str(uuid.uuid4()), "property_id": property_id, "lead_id": lead_id, "associate_id": user["id"], "status": "pending", "created_at": now_iso()}
    await db.reservations.insert_one(reservation)
    await db.properties.update_one({"id": property_id}, {"$set": {"status": "reserved"}})
    return {"message": "Reservation submitted for approval"}

@api_router.post("/associate/bookings")
async def request_booking(reservation_id: str = Form(...), user=Depends(associate_user)):
    reservation = await db.reservations.find_one({"id": reservation_id, "associate_id": user["id"], "status": "approved"}, {"_id": 0})
    if not reservation: raise HTTPException(409, "Only approved reservations can become booking requests")
    existing = await db.bookings.find_one({"reservation_id": reservation_id})
    if existing: return public_doc(existing)
    booking = {"id": str(uuid.uuid4()), "reservation_id": reservation_id, "property_id": reservation["property_id"], "lead_id": reservation["lead_id"], "associate_id": user["id"], "status": "pending", "created_at": now_iso()}
    await db.bookings.insert_one(booking)
    return public_doc(booking)

@api_router.get("/admin/reservations")
async def admin_reservations(user=Depends(admin_user)):
    return [public_doc(x) for x in await db.reservations.find({}, {"_id": 0}).sort("created_at", -1).to_list(300)]

@api_router.patch("/admin/reservations/{reservation_id}")
async def decide_reservation(reservation_id: str, input: DecisionInput, user=Depends(admin_user)):
    reservation = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
    if not reservation: raise HTTPException(404, "Reservation not found")
    status = "approved" if input.decision == "approve" else "rejected"
    await db.reservations.update_one({"id": reservation_id}, {"$set": {"status": status, "reviewed_at": now_iso()}})
    if status == "rejected": await db.properties.update_one({"id": reservation["property_id"]}, {"$set": {"status": "available"}})
    return {"message": f"Reservation {status}"}

@api_router.get("/admin/bookings")
async def admin_bookings(user=Depends(admin_user)):
    return [public_doc(x) for x in await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(300)]

@api_router.patch("/admin/bookings/{booking_id}")
async def decide_booking(booking_id: str, input: DecisionInput, user=Depends(admin_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking: raise HTTPException(404, "Booking not found")
    status = "approved" if input.decision == "approve" else "rejected"
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": status, "reviewed_at": now_iso()}})
    if status == "approved": await db.properties.update_one({"id": booking["property_id"]}, {"$set": {"status": "booked"}})
    return {"message": f"Booking {status}"}

@api_router.get("/admin/reports")
async def admin_reports(user=Depends(admin_user)):
    return {"lead_status": {status: await db.leads.count_documents({"status": status}) for status in ["new", "contacted", "interested", "visit_scheduled", "visited", "negotiation", "reserved", "booked", "sold"]}, "property_status": {status: await db.properties.count_documents({"status": status}) for status in ["available", "reserved", "negotiation", "booked", "sold", "blocked"]}}

@api_router.get("/admin/documents")
async def admin_documents(user=Depends(admin_user)):
    return [public_doc(x) for x in await db.documents.find({"is_deleted": False}, {"_id": 0}).to_list(500)]

@api_router.get("/admin/gallery")
async def admin_gallery(user=Depends(admin_user)):
    return [public_doc(x) for x in await db.gallery.find({"is_deleted": False}, {"_id": 0}).to_list(500)]

@api_router.get("/public/gallery")
async def public_gallery():
    return [public_doc(x) for x in await db.gallery.find({"is_deleted": False}, {"_id": 0}).to_list(100)]

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# ---------- Content management (site-wide, super-admin editable) ----------

class SettingsInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    tagline_en: Optional[str] = None
    tagline_hi: Optional[str] = None
    intro_title: Optional[str] = None
    intro_copy: Optional[str] = None
    phone_band_title: Optional[str] = None
    phone_band_copy: Optional[str] = None
    footer_copy: Optional[str] = None
    office_hours: Optional[str] = None
    about_links: Optional[str] = None
    quick_links: Optional[str] = None
    terms_url: Optional[str] = None
    privacy_url: Optional[str] = None
    copyright_text: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None

class HeroSlideInput(BaseModel):
    image: str
    kicker: Optional[str] = ""
    title: str
    subtitle: Optional[str] = ""
    cta_label: Optional[str] = "Explore projects"
    cta_link: Optional[str] = "/projects"
    order: int = 0

class TestimonialInput(BaseModel):
    quote: str
    name: str
    role: Optional[str] = ""
    order: int = 0

class TrustPillarInput(BaseModel):
    icon: str
    title: str
    description: str
    order: int = 0

class PropertyTypeInput(BaseModel):
    icon: str
    name: str
    description: Optional[str] = ""
    order: int = 0

CONTENT_COLLECTIONS = {
    "hero-slides": ("heroSlides", HeroSlideInput),
    "testimonials": ("testimonials", TestimonialInput),
    "trust-pillars": ("trustPillars", TrustPillarInput),
    "property-types": ("propertyTypes", PropertyTypeInput),
}

@api_router.get("/public/site-content")
async def public_site_content():
    settings = await db.settings.find_one({"id": "site-settings"}, {"_id": 0}) or {}
    return {
        "settings": public_doc(settings) or {},
        "heroSlides": [public_doc(x) for x in await db.heroSlides.find({}, {"_id": 0}).sort("order", 1).to_list(50)],
        "testimonials": [public_doc(x) for x in await db.testimonials.find({}, {"_id": 0}).sort("order", 1).to_list(50)],
        "trustPillars": [public_doc(x) for x in await db.trustPillars.find({}, {"_id": 0}).sort("order", 1).to_list(50)],
        "propertyTypes": [public_doc(x) for x in await db.propertyTypes.find({}, {"_id": 0}).sort("order", 1).to_list(50)],
    }

@api_router.get("/admin/settings")
async def get_settings(user=Depends(admin_user)):
    settings = await db.settings.find_one({"id": "site-settings"}, {"_id": 0})
    return public_doc(settings) or {}

@api_router.put("/admin/settings")
async def put_settings(input: SettingsInput, user=Depends(admin_user)):
    update = {k: v for k, v in input.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.settings.update_one({"id": "site-settings"}, {"$set": update, "$setOnInsert": {"id": "site-settings", "created_at": now_iso()}}, upsert=True)
    return await get_settings(user)

def _resolve_collection(name: str):
    if name not in CONTENT_COLLECTIONS:
        raise HTTPException(404, "Unknown content collection")
    return CONTENT_COLLECTIONS[name]

@api_router.get("/admin/content/{collection}")
async def content_list(collection: str, user=Depends(admin_user)):
    coll, _ = _resolve_collection(collection)
    return [public_doc(x) for x in await db[coll].find({}, {"_id": 0}).sort("order", 1).to_list(200)]

@api_router.post("/admin/content/{collection}")
async def content_create(collection: str, payload: dict, user=Depends(admin_user)):
    coll, Model = _resolve_collection(collection)
    data = Model(**payload).model_dump()
    data.update({"id": str(uuid.uuid4()), "created_at": now_iso()})
    await db[coll].insert_one(data)
    return public_doc(data)

@api_router.patch("/admin/content/{collection}/{item_id}")
async def content_update(collection: str, item_id: str, payload: dict, user=Depends(admin_user)):
    coll, Model = _resolve_collection(collection)
    data = Model(**payload).model_dump()
    data["updated_at"] = now_iso()
    result = await db[coll].update_one({"id": item_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(404, "Item not found")
    updated = await db[coll].find_one({"id": item_id}, {"_id": 0})
    return public_doc(updated)

@api_router.delete("/admin/content/{collection}/{item_id}")
async def content_delete(collection: str, item_id: str, user=Depends(admin_user)):
    coll, _ = _resolve_collection(collection)
    result = await db[coll].delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Item not found")
    return {"message": "Deleted"}


# ---------- Media proxy, project & gallery admin CRUD ----------

def get_object(path: str):
    r = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage()}, timeout=30)
    r.raise_for_status()
    return r.content, r.headers.get("content-type", "application/octet-stream")

@api_router.get("/media/{path:path}")
async def serve_media(path: str):
    if not path.startswith(f"{APP_NAME}/"):
        raise HTTPException(404, "Not found")
    try:
        content, content_type = get_object(path)
    except requests.RequestException:
        raise HTTPException(404, "File not found")
    return Response(content=content, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})

class ProjectInput(BaseModel):
    slug: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=120)
    location: Optional[str] = ""
    tagline: Optional[str] = ""
    description: Optional[str] = ""
    price_from: Optional[int] = 0
    area: Optional[str] = ""
    status: Optional[str] = "selling"
    image: Optional[str] = ""
    master_plan_url: Optional[str] = ""
    brochure_url: Optional[str] = ""

@api_router.get("/admin/projects")
async def admin_projects(user=Depends(admin_user)):
    return [public_doc(x) for x in await db.projects.find({}, {"_id": 0}).sort("created_at", 1).to_list(200)]

@api_router.post("/admin/projects")
async def admin_project_create(input: ProjectInput, user=Depends(admin_user)):
    slug = input.slug.strip().lower()
    if await db.projects.find_one({"slug": slug}):
        raise HTTPException(409, "A project with this slug already exists")
    doc = {"id": str(uuid.uuid4()), "created_at": now_iso(), **input.model_dump()}
    doc["slug"] = slug
    await db.projects.insert_one(doc)
    return public_doc(doc)

@api_router.patch("/admin/projects/{project_id}")
async def admin_project_update(project_id: str, input: ProjectInput, user=Depends(admin_user)):
    slug = input.slug.strip().lower()
    conflict = await db.projects.find_one({"slug": slug, "id": {"$ne": project_id}})
    if conflict:
        raise HTTPException(409, "Another project already uses this slug")
    update = {**input.model_dump(), "slug": slug, "updated_at": now_iso()}
    result = await db.projects.update_one({"id": project_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Project not found")
    return public_doc(await db.projects.find_one({"id": project_id}, {"_id": 0}))

@api_router.delete("/admin/projects/{project_id}")
async def admin_project_delete(project_id: str, user=Depends(admin_user)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Project not found")
    await db.properties.delete_many({"project_id": project_id})
    return {"message": "Project and its properties deleted"}

@api_router.delete("/admin/gallery/{item_id}")
async def admin_gallery_delete(item_id: str, user=Depends(admin_user)):
    result = await db.gallery.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Image not found")
    return {"message": "Deleted"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get('FRONTEND_URL', 'http://localhost:3000')],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()