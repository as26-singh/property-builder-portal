"""
Standalone seed script for the Nirnay Group Real Estate CRM.

Populates MongoDB with:
  - 1 super_admin (from ADMIN_EMAIL / ADMIN_PASSWORD env vars)
  - 2 associates (demo credentials, both idempotent)
  - 3 projects with 4-6 properties each
  - A handful of sample leads assigned to the first associate

Run from the project root:
    python backend/scripts/seed_data.py

Or after cd-ing into /app:
    python -m backend.scripts.seed_data

The script is idempotent — re-running it will not duplicate records.
"""

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def upsert_user(db, *, email: str, name: str, role: str, password: str) -> dict:
    email = email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        return existing
    record = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "role": role,
        "created_at": now_iso(),
    }
    await db.users.insert_one(record)
    print(f"  + user  {email} ({role})")
    return record


async def upsert_project(db, *, slug: str, payload: dict) -> dict:
    existing = await db.projects.find_one({"slug": slug})
    if existing:
        return existing
    project = {"id": str(uuid.uuid4()), "slug": slug, "created_at": now_iso(), **payload}
    await db.projects.insert_one(project)
    print(f"  + project  {slug}")
    return project


async def upsert_property(db, *, project_id: str, number: str, payload: dict) -> None:
    if await db.properties.find_one({"project_id": project_id, "number": number}):
        return
    await db.properties.insert_one(
        {"id": str(uuid.uuid4()), "project_id": project_id, "number": number, "created_at": now_iso(), **payload}
    )
    print(f"    + property  {number}")


async def upsert_lead(db, *, phone: str, payload: dict) -> None:
    if await db.leads.find_one({"phone": phone}):
        return
    await db.leads.insert_one(
        {
            "id": str(uuid.uuid4()),
            "phone": phone,
            "source": "seed",
            "created_at": now_iso(),
            "updated_at": now_iso(),
            **payload,
        }
    )
    print(f"    + lead  {payload.get('name')} ({phone})")


PROJECTS = [
    {
        "slug": "verdant-meadows",
        "name": "Verdant Meadows",
        "location": "Kanpur, Uttar Pradesh",
        "tagline": "A quieter way to come home.",
        "description": "Thoughtfully planned plots surrounded by green corridors, generous roads, and a community designed for long-term living.",
        "price_from": 1850000,
        "area": "18 acres",
        "status": "selling",
        "image": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
        "properties": [
            ("A-101", {"size": "1200 sq.ft", "price": 1850000, "status": "available", "facing": "East"}),
            ("A-102", {"size": "1500 sq.ft", "price": 2250000, "status": "reserved", "facing": "North"}),
            ("B-204", {"size": "1800 sq.ft", "price": 2450000, "status": "available", "facing": "East"}),
            ("C-112", {"size": "2400 sq.ft", "price": 3150000, "status": "booked",    "facing": "West"}),
        ],
    },
    {
        "slug": "nirnay-heights",
        "name": "Nirnay Heights",
        "location": "Lucknow, Uttar Pradesh",
        "tagline": "Rise above the everyday.",
        "description": "Premium apartments with panoramic city views, wellness amenities and considered common spaces built for calm modern living.",
        "price_from": 4200000,
        "area": "3.5 acres",
        "status": "selling",
        "image": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
        "properties": [
            ("T1-501", {"size": "1650 sq.ft", "price": 4200000, "status": "available", "facing": "East"}),
            ("T1-702", {"size": "2100 sq.ft", "price": 5400000, "status": "available", "facing": "North"}),
            ("T2-304", {"size": "1450 sq.ft", "price": 3850000, "status": "reserved",  "facing": "West"}),
            ("T2-901", {"size": "2600 sq.ft", "price": 6650000, "status": "available", "facing": "East"}),
            ("T3-101", {"size": "1200 sq.ft", "price": 3200000, "status": "sold",      "facing": "South"}),
        ],
    },
    {
        "slug": "green-vistas",
        "name": "Green Vistas",
        "location": "Prayagraj, Uttar Pradesh",
        "tagline": "Land, patiently curated.",
        "description": "Farm plots on the outskirts of the city — ideal for weekend homes, orchards or a slower pace close to nature.",
        "price_from": 950000,
        "area": "42 acres",
        "status": "selling",
        "image": "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85",
        "properties": [
            ("F-01", {"size": "5000 sq.ft", "price": 950000,  "status": "available", "facing": "East"}),
            ("F-02", {"size": "6000 sq.ft", "price": 1150000, "status": "available", "facing": "North"}),
            ("F-03", {"size": "8000 sq.ft", "price": 1550000, "status": "available", "facing": "East"}),
            ("F-04", {"size": "10000 sq.ft", "price": 1950000, "status": "reserved",  "facing": "West"}),
            ("F-05", {"size": "12000 sq.ft", "price": 2350000, "status": "available", "facing": "South"}),
            ("F-06", {"size": "5500 sq.ft", "price": 1050000, "status": "booked",    "facing": "East"}),
        ],
    },
]


SAMPLE_LEADS = [
    {"phone": "+91-90000-00001", "name": "Rohan Mehta",    "email": "rohan.mehta@example.com",    "status": "new",              "message": "Interested in Verdant Meadows corner plot."},
    {"phone": "+91-90000-00002", "name": "Ananya Kapoor",  "email": "ananya.kapoor@example.com",  "status": "contacted",        "message": "Wants to schedule a weekend visit."},
    {"phone": "+91-90000-00003", "name": "Vikram Singh",   "email": "vikram.singh@example.com",   "status": "interested",       "message": "Budget around 40L, looking at Nirnay Heights."},
    {"phone": "+91-90000-00004", "name": "Priya Sharma",   "email": None,                          "status": "visit_scheduled", "message": "Visit booked for Saturday morning."},
    {"phone": "+91-90000-00005", "name": "Karan Verma",    "email": "karan.verma@example.com",    "status": "negotiation",      "message": "Discussing final price for F-03."},
]


async def upsert_singleton(db, *, collection: str, doc: dict, id_key: str = "id") -> None:
    if await db[collection].find_one({id_key: doc[id_key]}):
        return
    await db[collection].insert_one({"created_at": now_iso(), **doc})
    print(f"  + {collection}  {doc[id_key]}")


async def upsert_content_many(db, *, collection: str, docs: list, key: str) -> None:
    for doc in docs:
        if await db[collection].find_one({key: doc[key]}):
            continue
        await db[collection].insert_one({"id": str(uuid.uuid4()), "created_at": now_iso(), **doc})
        print(f"    + {collection}  {doc[key]}")


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


async def main() -> None:
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        print("MONGO_URL and DB_NAME must be set in backend/.env", file=sys.stderr)
        sys.exit(1)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@verdant.example")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@12345")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print(f"Seeding database: {db_name}")

    # Indexes
    await db.users.create_index("email", unique=True)

    # Users
    print("Users:")
    await upsert_user(db, email=admin_email, name="Company Owner", role="super_admin", password=admin_password)
    associate_a = await upsert_user(db, email="associate@verdant.example", name="Amit Sharma", role="associate", password="Associate@12345")
    associate_b = await upsert_user(db, email="associate2@verdant.example", name="Neha Gupta", role="associate", password="Associate@12345")

    # Projects & properties
    print("Projects & properties:")
    project_ids: dict[str, str] = {}
    for spec in PROJECTS:
        properties = spec.pop("properties", [])
        project = await upsert_project(db, slug=spec["slug"], payload=spec)
        project_ids[spec["slug"]] = project["id"]
        for number, payload in properties:
            await upsert_property(db, project_id=project["id"], number=number, payload=payload)

    # Sample leads (assigned round-robin between two associates)
    print("Sample leads:")
    associates = [associate_a["id"], associate_b["id"]]
    projects_by_slug = list(project_ids.values())
    for i, lead in enumerate(SAMPLE_LEADS):
        await upsert_lead(
            db,
            phone=lead["phone"],
            payload={
                "name": lead["name"],
                "email": lead["email"],
                "status": lead["status"],
                "message": lead["message"],
                "project_id": projects_by_slug[i % len(projects_by_slug)],
                "assigned_associate_id": associates[i % len(associates)],
            },
        )

    # Site content (settings singleton + editable collections)
    print("Site content:")
    await upsert_singleton(db, collection="settings", doc=DEFAULT_SETTINGS)
    await upsert_content_many(db, collection="heroSlides", docs=DEFAULT_HERO_SLIDES, key="title")
    await upsert_content_many(db, collection="testimonials", docs=DEFAULT_TESTIMONIALS, key="name")
    await upsert_content_many(db, collection="trustPillars", docs=DEFAULT_TRUST_PILLARS, key="title")
    await upsert_content_many(db, collection="propertyTypes", docs=DEFAULT_PROPERTY_TYPES, key="name")

    print("Done.")
    print("Admin login   ->", admin_email, "/", admin_password)
    print("Associate #1 ->", "associate@verdant.example", "/", "Associate@12345")
    print("Associate #2 ->", "associate2@verdant.example", "/", "Associate@12345")

    client.close()

if __name__ == "__main__":
    asyncio.run(main())
