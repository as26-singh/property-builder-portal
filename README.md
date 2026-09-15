# Nirnay Group — Real Estate CRM

A three-in-one real-estate platform:

- **Public Website** — projects, properties, gallery, enquiries, site-visit bookings
- **Associate Portal** — assigned leads, follow-ups, site visits, reservations, bookings
- **Admin Portal** — full oversight, associate management, lead assignment, reservation & booking approvals

**Stack:** React (CRA + Craco) · FastAPI · MongoDB · JWT cookies · Emergent object storage

---

## Project Layout

```
/app
├── backend/
│   ├── server.py              # FastAPI app + all /api endpoints
│   ├── scripts/
│   │   └── seed_data.py       # Standalone metadata seed script
│   ├── tests/                 # pytest workflow tests
│   ├── requirements.txt
│   └── .env                   # MONGO_URL, DB_NAME, JWT_SECRET, ADMIN_*, etc.
├── frontend/
│   ├── src/
│   │   ├── App.js             # Router
│   │   ├── api.js             # axios instance
│   │   ├── auth.js            # AuthProvider + useAuth
│   │   ├── components/        # Layouts + shared UI (Brand, Buttons, TableToolbar)
│   │   └── pages/             # One page per file
│   ├── package.json
│   └── .env                   # REACT_APP_BACKEND_URL
└── memory/test_credentials.md
```

---

## Prerequisites

- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB running locally (default `mongodb://localhost:27017`)

---

## Fresh-Clone Setup

```bash
# 1. Backend deps
cd backend
pip install -r requirements.txt

# 2. Frontend deps
cd ../frontend
yarn install
```

### Environment files

Create/edit the two `.env` files:

**`backend/.env`**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=nirnay_crm
CORS_ORIGINS=*
JWT_SECRET=<generate-a-64-char-random-string>
ADMIN_EMAIL=admin@nirnay.example
ADMIN_PASSWORD=Admin@12345
FRONTEND_URL=http://localhost:3000
EMERGENT_LLM_KEY=<optional-for-file-uploads>
```

**`frontend/.env`**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

---

## Populate MongoDB (metadata seed)

Run this once after cloning to fill MongoDB with the admin, two associates, three projects with properties, and sample leads.
The script is **idempotent** — safe to re-run any time.

```bash
cd /app
python backend/scripts/seed_data.py
```

Expected output:
```
Seeding database: nirnay_crm
Users:
  + user  admin@nirnay.example (super_admin)
  + user  associate@verdant.example (associate)
  + user  associate2@verdant.example (associate)
Projects & properties:
  + project  verdant-meadows
    + property  A-101
    ...
Sample leads:
    + lead  Rohan Mehta (+91-90000-00001)
    ...
Done.
Admin login   -> admin@nirnay.example / Admin@12345
Associate #1 -> associate@verdant.example / Associate@12345
Associate #2 -> associate2@verdant.example / Associate@12345
```

> The FastAPI app also runs a tiny bootstrap seed on every startup as a safety net (creates the admin + one associate + one project if missing), so the app never boots empty.

---

## Run the app

**Backend** (port 8001)
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend** (port 3000)
```bash
cd frontend
yarn start
```

Open http://localhost:3000

- Public site: `/`
- Admin login: `/admin/login`
- Associate login: `/associate/login`

---

## Login credentials (after seeding)

| Role        | Email                          | Password         |
|-------------|--------------------------------|------------------|
| Super admin | value of `ADMIN_EMAIL`         | `ADMIN_PASSWORD` |
| Associate 1 | `associate@verdant.example`    | `Associate@12345`|
| Associate 2 | `associate2@verdant.example`   | `Associate@12345`|

---

## Data flow — every screen fetches from MongoDB

| Screen                                    | Backend endpoint                       |
|-------------------------------------------|----------------------------------------|
| Public projects list                      | `GET /api/public/projects`             |
| Public project detail + properties        | `GET /api/public/projects/{slug}`      |
| Public properties list                    | `GET /api/public/properties`           |
| Public gallery                            | `GET /api/public/gallery`              |
| Public inquiry / site-visit form          | `POST /api/public/inquiries|site-visits` |
| Admin dashboard counters                  | `GET /api/admin/dashboard`             |
| Admin leads + assignment                  | `GET /api/admin/leads` · `PATCH /api/admin/leads/{id}/assign` |
| Admin reservations approval               | `GET /api/admin/reservations` · `PATCH /api/admin/reservations/{id}` |
| Associate dashboard counters              | `GET /api/associate/dashboard`         |
| Associate leads + status updates          | `GET /api/associate/leads` · `PATCH /api/associate/leads/{id}/status` |
| Associate site visits                     | `GET /api/associate/site-visits`       |
| Associate properties                      | `GET /api/associate/properties`        |

No data is hard-coded on the frontend — every table and metric card is populated from MongoDB via the endpoints above.

---

## Testing

```bash
cd backend
pytest
```

The pytest suite in `backend/tests/` exercises the full public inquiry → lead assignment → site visit → reservation → booking workflow.
