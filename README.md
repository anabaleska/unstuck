# Unstuck

🔗 **Live app:** https://unstuck-9yri.vercel.app

**Book 1:1 time with a senior developer. Show up with context, leave unstuck.**

Unstuck is a small scheduling app for developer mentorship. A senior dev (Sam, our fictional mentor) publishes open time slots. Junior developers pick a slot for a **code review**, a **debugging session**, or a **career chat**, and say what they're stuck on when they book.

---

## Why this twist on "a booking app"?

Mentoring sessions often lose their first 10 minutes to *"so… what's the issue?"*. Unstuck moves that context **into the booking step**:

- Each **session type** has its own default length and its own booking questions ("What's broken, and what have you tried?" for debugging; a PR link for code review).
- The mentor's dashboard shows every booking **with the mentee's problem and links**, so they arrive prepared.
- The mentee gets a **"before the session" checklist** for their session type and can add the session to their calendar.
- An **AI session brief** (Gemini) turns the mentee's description into prep notes for the mentor (see below).

## AI session brief

When someone books, Gemini reads what they wrote and produces **one brief, generated once and saved**:

- **For the mentor:** the problem in one sentence, 2–3 questions to open the session with, and a hint when important context is missing (e.g. *"No error message shared, ask for it"*).
- **For the mentee:** a short, friendly confirmation message that mentions their topic.

Design choices:
- **The AI prepares, the human teaches.** The model is explicitly told *not* to solve the problem or give advice. The product is human mentorship.
- **Booking never depends on the AI.** The booking is saved first. The brief is requested afterwards with a 20-second timeout (the free tier often takes 5–10 seconds). If Gemini is down, slow or the key is missing, the app falls back to non-AI text and the mentor can retry with "Prepare session brief".
- **Generated once, then stored** in `bookings.ai_brief`, which saves free-tier quota and keeps pages fast.
- **Structured output:** Gemini must return JSON in a fixed schema, which the backend validates before saving.
- The API key stays on the backend. AI-written text is labelled in the UI.
- Note: on Gemini's free tier, Google may use prompts to improve its products, so mentee topics are sent to Google.

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
| AI | Google Gemini (`gemini-3.5-flash-lite`, free tier) via `@google/genai` |
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
│   │   ├── bookings/            booking endpoints + the AI brief endpoint
│   │   └── ai/                  AiService: calls Gemini and validates its output
│   └── test/                    API tests (incl. the double-booking race test) + AI output tests
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
| `POST` | `/bookings/:id/brief` | **AI endpoint:** generates the session brief once, then returns the saved one (`aiBrief: null` if AI is unavailable) |
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
cp .env.example .env        # fill in DATABASE_URL, TEST_DATABASE_URL, and optionally GEMINI_API_KEY
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

The tests run against `TEST_DATABASE_URL` and **empty its tables**, so never point it at real data. One test fires 10 bookings for the same slot at the same moment and checks that exactly one succeeds. The AI is replaced with a fake in tests, so they never call Gemini.

**Gemini key (optional):** get a free key at [Google AI Studio](https://aistudio.google.com/) → *Get API key*, and set `GEMINI_API_KEY` in `backend/.env`. Without it, everything works except the AI brief.

## Deploy (Vercel + Neon)

1. **Database:** in Neon, copy the connection string. From your machine, point `DATABASE_URL` in `backend/.env` at it and run `npm run db:migrate` (and `npm run db:seed` for demo data).
2. **Backend:** in Vercel → *Add New Project* → import this repo → **Root Directory: `backend`** (Vercel detects NestJS automatically). Add environment variables:
   - `DATABASE_URL`: the Neon connection string (the *pooled* one)
   - `CORS_ORIGIN`: your frontend URL (you can fill this in after step 3)
   - `GEMINI_API_KEY`: your Google AI Studio key (optional)
3. **Frontend:** *Add New Project* again → same repo → **Root Directory: `frontend`** (Vite is detected). Add:
   - `VITE_API_URL`: `https://<your-backend>.vercel.app/api`
4. Set the backend's `CORS_ORIGIN` to `https://<your-frontend>.vercel.app` and **redeploy** the backend.
5. Open `https://<your-backend>.vercel.app/api/health` → `{"status":"ok"}` 🎉

## How I used AI tools

I built Unstuck with **Claude Code** as a pair programmer. Before writing code, I used it to compare ideas (personal trainer, tutoring, dev mentorship, mock interviews) against a few questions: does the theme change the product, or just the colours? Would the people reviewing this relate to it? I chose dev mentorship and the name Unstuck because it gives the booking a real purpose: sharing context before the call.

After that, I used it in three ways:
- **Building, within my decisions:** Claude Code wrote most of the code, but I set the constraints, such as plain SQL instead of an ORM so I can explain every query, and one optional extra done well instead of two. I also pushed back on its first AI plan: the AI now prepares the mentor instead of trying to solve the mentee's problem.
- **Learning:** after each part, I asked for a walkthrough of the code and asked about anything I didn't understand. 
- **Testing and debugging:** it wrote the API tests, including the double-booking race test, and checked the app in a browser. When the AI brief failed locally, we traced it to a timeout that was too short for Gemini's free tier.

## What I'd improve with more time

**Product**

   - Mentor login: all mentor routes already live under /api/mentor, so one NestJS guard would protect them. Right now anyone who finds /mentor can see bookings.
   - Email confirmations and reminders (e.g. with Resend), plus a cancel/reschedule link so a mentee can free up a slot.
   - Recurring availability ("every Tuesday 14:00–17:00 for the next month") instead of publishing slots one by one.
   - Google Calendar sync (the second optional extra): use the Calendar API's free/busy query to mark slots that clash with the mentor's real events as unavailable.
   - Mentee follow-up: after the session, let the mentor add a short note or next steps that the mentee can see.

**Engineering**

   - Frontend tests: React Testing Library for components and one Playwright test for the full booking flow.
   - Shared types: the API types are written twice (backend and frontend). A shared package or generated types would keep them in sync.
   - Rate limiting on the booking and AI endpoints, so nobody can spam bookings or use up the Gemini quota.
   - Faster AI brief: generate it in the background right after booking (e.g. a queue or Vercel's waitUntil), so it's usually ready before anyone opens the page.
