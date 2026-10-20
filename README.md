# Unstuck

**Book 1:1 time with a senior developer. Show up with context, leave unstuck.**

Unstuck is a small scheduling app for developer mentorship. A senior dev (Sam, our fictional mentor) publishes open time slots. Junior developers pick a slot for a **code review**, a **debugging session**, or a **career chat**, and say what they're stuck on when they book.

> 🔗 **Live app:** _add your Vercel frontend URL here_
> 🔗 **API health check:** _add your Vercel backend URL here_ `/api/health`

---

## Why this twist on "a booking app"?

Mentoring sessions often lose their first 10 minutes to *"so… what's the issue?"*. Unstuck moves that context **into the booking step**:

- Each **session type** has its own default length and its own booking questions ("What's broken, and what have you tried?" for debugging; a PR link for code review).
- The mentor's dashboard shows every booking **with the mentee's problem and links**, so they arrive prepared.
- The mentee gets a **"before the session" checklist** for their session type and can add the session to their calendar.

## Features

**For mentees** (`/`)
- Browse open slots grouped by day, filter by session type (with live counts)
- Book with name, email, topic and an optional link (PR / repo / CV)
- Confirmation page with **Add to Google Calendar** and **.ics download**
- Times are shown in the visitor's own time zone
- The slot list refreshes every 15s, and if someone books your slot while you're filling in the form, you get a friendly message and an up-to-date list instead of an error

**For the mentor** (`/mentor`)
- Publish slots (type → sensible default duration, date, time)
- After publishing, the start time moves to the end of that slot, so adding back-to-back slots is one click each
- See upcoming schedule (All / Booked / Open), with each mentee's topic and links
- Delete open slots (booked ones are protected)

**Rules the system guarantees (enforced by the database, covered by tests)**
- ❌ No double bookings, even when many people click "Book" at the same moment
- ❌ No overlapping slots for the mentor
- ❌ No slots in the past, no booking a slot that has already started
- ❌ A booked slot can't be deleted

## Tech stack

| Part | Choice |
|---|---|
| Frontend | React 19 + TypeScript + Vite, Tailwind CSS, TanStack Query, React Router |
| Backend | NestJS 11 (TypeScript), `class-validator` for input validation |
| Database | PostgreSQL (Neon), using plain SQL through `pg` (no ORM) |
| Tests | Jest + Supertest against a real PostgreSQL database |
| Hosting | Vercel (two projects: `frontend/` and `backend/`) + Neon |

Why these choices: see **[docs/DECISIONS.md](docs/DECISIONS.md)**.

## Project structure

```
unstuck/
├── backend/                     NestJS API
│   ├── db/migrations/           SQL files that create the tables
│   ├── scripts/migrate.ts       runs migrations that haven't run yet
│   ├── scripts/seed.ts          adds demo slots for the next week
│   ├── src/
│   │   ├── main.ts              starts the server (Vercel uses this too)
│   │   ├── app.setup.ts         /api prefix, CORS, validation
│   │   ├── database/            DatabaseService (connection pool) + error codes
│   │   ├── slots/               public + mentor slot endpoints
│   │   └── bookings/            booking endpoints
│   └── test/api.spec.ts         API tests, including the double-booking race test
├── frontend/                    React app
│   └── src/
│       ├── pages/               BookPage, BookingConfirmationPage, MentorDashboardPage
│       ├── components/          BookingDialog, CreateSlotForm, MentorSlotCard, …
│       └── lib/                 api client, types, date + calendar helpers, session types
├── docs/DECISIONS.md            technical decisions, explained
└── docker-compose.yml           optional local PostgreSQL
```

## API

All routes are prefixed with `/api`.

| Method | Route | Description |
|---|---|---|
| `GET` | `/slots?sessionType=` | Future, unbooked slots (optional filter) |
| `POST` | `/bookings` | Book a slot → `201`, or `409` if it was just taken |
| `GET` | `/bookings/:id` | One booking (for the confirmation page) |
| `GET` | `/mentor/slots` | All upcoming slots, with booking details |
| `POST` | `/mentor/slots` | Create a slot → `409` if it overlaps another |
| `DELETE` | `/mentor/slots/:id` | Delete an open slot → `409` if booked |
| `GET` | `/health` | API + database check |

## Run it locally

**Requirements:** Node.js 20+ and a PostgreSQL database. Either:
- **Neon (easiest):** create a free project at [neon.tech](https://neon.tech), and create a second database (or branch) for tests, **or**
- **Docker:** `docker compose up -d` from the repo root (creates `unstuck` and `unstuck_test`).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in DATABASE_URL and TEST_DATABASE_URL
npm run db:migrate          # creates the tables
npm run db:seed             # optional: demo slots for the next week
npm run start:dev           # → http://localhost:3000/api/health
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:3000/api
npm run dev                 # → http://localhost:5173
```

### 3. Tests

```bash
cd backend
npm test
```

The tests run against `TEST_DATABASE_URL` and **empty its tables**, so never point it at real data. One test fires 10 bookings for the same slot at the same moment and checks that exactly one succeeds.

## Deploy (Vercel + Neon)

1. **Database:** in Neon, copy the connection string. From your machine, point `DATABASE_URL` in `backend/.env` at it and run `npm run db:migrate` (and `npm run db:seed` for demo data).
2. **Backend:** in Vercel → *Add New Project* → import this repo → **Root Directory: `backend`** (Vercel detects NestJS automatically). Add environment variables:
   - `DATABASE_URL`: the Neon connection string (the *pooled* one)
   - `CORS_ORIGIN`: your frontend URL (you can fill this in after step 3)
3. **Frontend:** *Add New Project* again → same repo → **Root Directory: `frontend`** (Vite is detected). Add:
   - `VITE_API_URL`: `https://<your-backend>.vercel.app/api`
4. Set the backend's `CORS_ORIGIN` to `https://<your-frontend>.vercel.app` and **redeploy** the backend.
5. Open `https://<your-backend>.vercel.app/api/health` → `{"status":"ok"}` 🎉

## How I used AI tools

_Write this section in your own words. A starting point:_

I built Unstuck with **Claude Code** as a pair programmer. I decided the product direction (dev mentorship, session types, "context before the call"), the stack, and the constraints: plain SQL instead of an ORM so I could explain every query, and no unnecessary abstractions. Claude Code scaffolded the code, which I reviewed step by step. I asked it to explain each important decision (they're collected in `docs/DECISIONS.md`) and to prove the core rule with a test instead of assuming it works. It also tested the UI in a browser, including the "someone booked your slot while you were typing" case.

## What I'd improve with more time

- **AI booking brief** (Gemini): turn the mentee's description into a short brief for the mentor and personalised prep tips for the mentee, with a template fallback if the AI is slow or down
- **Auth for the mentor area:** all mentor routes are under `/api/mentor`, so one NestJS guard would protect them
- **Email confirmations and reminders** (e.g. Resend), plus a **cancel/reschedule link** for mentees
- **Google Calendar sync:** hide slots that clash with the mentor's real events
- **Recurring availability** ("every Tuesday 14:00–17:00") instead of publishing slots one by one
- Frontend tests (React Testing Library / Playwright) for the booking flow
