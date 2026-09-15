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

    print("Done.")
    print("Admin login   ->", admin_email, "/", admin_password)
    print("Associate #1 ->", "associate@verdant.example", "/", "Associate@12345")
    print("Associate #2 ->", "associate2@verdant.example", "/", "Associate@12345")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
