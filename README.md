# Nirnay Group — Real Estate CRM (MERN stack)

A three-in-one real-estate platform:

- **Public Website** — projects, properties, gallery, hero carousel, enquiries, site-visit bookings
- **Associate Portal** — assigned leads, follow-ups, site visits, reservations
- **Admin Portal** — full oversight, associate management, lead assignment, reservation & booking approvals, live Content Studio

**Stack:**
- **M**ongoDB (data)
- **E**xpress (Node.js API)
- **R**eact + CRA/Craco (SPA)
- **N**ode.js (v20+)
- Python is used ONLY for the one-time metadata seed script

---

## Project Layout

```
/
├── backend/                    # Node.js / Express API
│   ├── server.js               # Main entry point (Express app + routes)
│   ├── db.js                   # Mongoose connection + schemas
│   ├── auth.js                 # JWT + cookie middleware
│   ├── seed.js                 # Startup defaults (idempotent)
│   ├── uploads/                # Local disk storage for gallery / brochures
│   ├── package.json
│   ├── .env                    # MONGO_URL, DB_NAME, JWT_SECRET, ADMIN_*, FRONTEND_URL
│   ├── requirements.txt        # Python deps for seed script only
│   └── scripts/
│       └── seed_data.py        # Python metadata seed (projects, associates, sample leads)
└── frontend/                   # React app
    ├── src/
    │   ├── App.js              # Router
    │   ├── api.js              # axios instance
    │   ├── auth.js             # AuthProvider
    │   ├── content.js          # SiteContentProvider (fetches /api/public/site-content)
    │   ├── components/         # PublicLayout, PortalLayout, HeroCarousel, EnquireRibbon, TableToolbar, UploadField…
    │   └── pages/              # HomePage, ProjectsPage, ProjectDetail, LeadsPage, admin/ContentStudio…
    ├── package.json
    └── .env                    # REACT_APP_BACKEND_URL
```

---

## Prerequisites

- **Node.js 18+** and **Yarn** — install yarn once with `npm install -g yarn`
- **Python 3.11+** with `pip` (only for the seed script)
- **MongoDB** running locally (default `mongodb://localhost:27017`)
  - Windows: install MongoDB Community, or run in Docker: `docker run -d -p 27017:27017 mongo`
  - macOS: `brew install mongodb-community && brew services start mongodb-community`

---

## Fresh-Clone Setup

```bash
# 1. Backend Node deps
cd backend
yarn install

# 2. Frontend deps
cd ../frontend
yarn install

# 3. (Optional) Python deps for the seed script
cd ../backend
pip install -r requirements.txt
```

### Environment files

**`backend/.env`**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=nirnay_crm
JWT_SECRET=change-me-to-a-random-64-char-string
ADMIN_EMAIL=admin@nirnay.example
ADMIN_PASSWORD=Admin@12345
FRONTEND_URL=http://localhost:3000
PORT=8001
```

**`frontend/.env`**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

---

## Populate MongoDB (one-time metadata seed)

The Node server always creates a minimal safety-net seed on startup (admin + 1 associate + 1 project). Run the Python script for a richer dataset (2 associates + 3 projects + 15 properties + 5 sample leads + full site content).

```bash
# from the project root
python backend/scripts/seed_data.py
```

Idempotent — safe to re-run any time.

---

## Run the app

Two terminals side-by-side:

**Terminal 1 — Backend (port 8001):**
```bash
cd backend
yarn start          # or: node server.js
```

**Terminal 2 — Frontend (port 3000):**
```bash
cd frontend
yarn start
```

Open **http://localhost:3000**.

---

## Login credentials

| Role        | Email                          | Password         |
|-------------|--------------------------------|------------------|
| Super admin | `ADMIN_EMAIL`                  | `ADMIN_PASSWORD` |
| Associate 1 | `associate@verdant.example`    | `Associate@12345`|
| Associate 2 | `associate2@verdant.example`   | `Associate@12345` (only after Python seed script) |

Once logged in as admin, go to **Content Studio** in the sidebar to edit every home-page section, project, gallery image and site setting — live.

---

## Key API endpoints (all under `/api/`)

| Purpose | Endpoint |
|---|---|
| Login / me / logout | `POST /auth/login` · `GET /auth/me` · `POST /auth/logout` |
| Public website | `GET /public/projects` · `GET /public/projects/:slug` · `GET /public/properties` · `GET /public/gallery` · `GET /public/site-content` |
| Inquiries / visits | `POST /public/inquiries` · `POST /public/site-visits` |
| Admin dashboards | `GET /admin/dashboard` · `GET /admin/reports` |
| Lead pipeline | `GET /admin/leads` · `PATCH /admin/leads/:id/assign` · `GET /associate/leads` · `PATCH /associate/leads/:id/status` |
| Reservation & booking | `GET /admin/reservations` · `PATCH /admin/reservations/:id` · `GET /admin/bookings` · `PATCH /admin/bookings/:id` |
| Content Studio | `GET/PUT /admin/settings` · `GET/POST/PATCH/DELETE /admin/content/:collection` (hero-slides, testimonials, trust-pillars, property-types) |
| Projects CRUD | `GET/POST /admin/projects` · `PATCH/DELETE /admin/projects/:id` |
| Uploads / media | `POST /admin/uploads` · `GET /media/:filename` · `DELETE /admin/gallery/:id` |

---

## Note about `backend/server.py`

This project ships one Python file at `backend/server.py`. It is a **thin proxy shim used only by the Emergent preview environment**, which expects a Python `server:app` entry point — the shim spawns `node server.js` on port 8002 and forwards HTTP.

**For local development you can delete `backend/server.py` and the FastAPI/uvicorn/httpx lines from `requirements.txt`.** The Node backend runs cleanly on its own with `node server.js`.

---

## Troubleshooting

- **`ERESOLVE` on `npm install`** — this repo uses **yarn**, not npm. Run `yarn install` instead. If you must use npm, add `--legacy-peer-deps`.
- **MongoDB connection refused** — make sure MongoDB is running (`brew services start mongodb-community` / `net start MongoDB` / Docker).
- **Cookies not sticking between frontend and backend** — set `FRONTEND_URL` in `backend/.env` to exactly match where the React app is served, including protocol.
