# GroupGo

GroupGo is a trip-planning app that turns messy group chat planning into organized plans with budgets, activities, reservations, responsibilities, and shared status updates.

## Tech Stack

- Frontend: React + TypeScript (Vite)
- Backend: Python + FastAPI
- Database: PostgreSQL (Supabase)
- APIs: Google Places API
- Auth/Security: JWT + password hashing

## Project Structure

```text
groupgo/
├── backend/
├── frontend/
├── database/
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Supabase account

## 1) Clone and Install

```bash
git clone https://github.com/ryangpham/groupgo
cd groupgo
```

## 2) Backend Setup (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` from the example file:

```bash
cp backend/.env.example backend/.env
```

Then update values in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
JWT_SECRET_KEY=replace_me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_PLACES_API_KEY=replace_me
```

Run backend:

```bash
uvicorn app.main:app --reload
```

Backend docs will be at `http://127.0.0.1:8000/docs`.

## 3) Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173` by default.

## 4) Fill in `.env` Values (Supabase + API Keys)

Use `backend/.env.example` as the template and replace placeholders in your local `backend/.env`.

1. In Supabase, create/open the project.
2. In **Project Settings -> Database**, copy the Postgres connection string and set it as `DATABASE_URL`.
3. Set your `GOOGLE_PLACES_API_KEY` from Google Cloud.
4. Set `JWT_SECRET_KEY` to the shared team dev secret.
5. Keep defaults unless needed: `JWT_ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES=60`.

If you are initializing the DB, open Supabase **SQL Editor** and run:
- `database/schema.sql`
- `database/seed.sql` (optional)

## Notes for Team

- Keep secrets in local `.env` files only (do not commit them).
- `schema.sql` should track the canonical DB structure for the class project.
- If Python dependencies change, activate the backend venv and run `pip freeze > requirements.txt`, then commit the updated file.
- If frontend dependencies change, update `frontend/package.json` (and lockfile if present) in the same PR.
