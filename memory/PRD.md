# Nirnay Group — Real Estate CRM (PRD)

## Original problem statement
Analyse code → build a functional three-portal real estate CRM (Public Website, Associate Portal, Admin Portal) for Nirnay Group with lead → assignment → follow-up → visit → reservation → booking flow. Then: clean unused code, add table filters/pagination, modularise App.js, and provide a metadata seed script so a fresh clone + seed run + start = fully populated app.

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB) + JWT cookies + Emergent object storage
- **Frontend**: React + React Router + Tailwind + custom CSS
- **DB**: MongoDB (collections: users, projects, properties, leads, siteVisits, reservations, bookings, documents, gallery)

## Personas
- Public visitor — browses projects, submits inquiries / site-visit requests
- Associate — follows up on assigned leads, schedules visits, proposes reservations
- Super admin — assigns leads, approves reservations and bookings, manages associates

## Implemented (as of Feb 2026)
- JWT auth with role-based redirects (admin ↔ associate)
- Public website (Home, Projects, Project detail, Properties, Gallery, About, Contact, Book-visit)
- Associate portal (Dashboard, Leads, Site visits, Properties)
- Admin portal (Dashboard, Leads + assign, Reservations approve/reject)
- Emergent object storage integration for uploads
- Nirnay Group branding + logo
- Cross-portal redirect guard (no 403 overlay)
- Repo cleanup: removed unused shadcn/ui, hooks, lib, constants, build artifacts, stale reports
- **Table filters + pagination** (reusable `TableToolbar` + `useFilteredList`) on Leads (admin & associate) and Properties (public + associate)
- **Modular frontend**: App.js split into `src/pages/*` + `src/components/*`; ProjectDetail now uses `useParams` correctly
- **Standalone seed script**: `backend/scripts/seed_data.py` — idempotent, seeds admin + 2 associates + 3 projects + 15 properties + 5 sample leads
- **README** rewritten with clone → install → seed → run instructions
- Bug fix: `/admin/reservations` now loads real component (was previously loading site-visits by accident)

## Backlog
- P1: Reports & Analytics (lead conversion, associate performance, revenue) — admin `/admin/reports` endpoint exists, no UI yet
- P1: In-app notifications & activity logs
- P2: Server-side pagination (currently client-side is fine at current volumes)
- P2: Associate reservations UI (create reservation from lead)

## Credentials (post-seed)
- Admin: `admin@verdant.example` / `Admin@12345`
- Associate 1: `associate@verdant.example` / `Associate@12345`
- Associate 2: `associate2@verdant.example` / `Associate@12345`
