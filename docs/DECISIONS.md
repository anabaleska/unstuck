# Technical decisions

Short explanations of the important choices in Unstuck: what was decided, why, and what the alternative was. Written so each one can be explained in a couple of sentences.

---

## 1. Double bookings are prevented by the database, not by the code

**The problem:** two people open the same slot and click "Book" at almost the same moment.

A natural first idea is to check in the code first:

```ts
const existing = await findBookingForSlot(slotId)   // request A: none ✅  request B: none ✅
if (!existing) await insertBooking(...)              // both insert → double booking ❌
```

Both requests can pass the check before either one inserts. This is called a **race condition**.

**What we do instead:** the `bookings` table has `slot_id UUID NOT NULL UNIQUE`. PostgreSQL guarantees that only one row per `slot_id` can ever exist. When two INSERTs race, one succeeds and the other fails with error code `23505` (unique violation). `BookingsService` catches that code and returns **HTTP 409 Conflict** with a friendly message.

**Proof:** `test/api.spec.ts` fires 10 bookings for the same slot at once and checks that exactly **1** gets `201` and **9** get `409`.

> We still check "does the slot exist / has it started?" first, but only to return clearer error messages. The UNIQUE constraint is the real guarantee.

## 2. Overlapping slots are also blocked by the database

The mentor can't be in two sessions at once. The `slots` table has an **exclusion constraint**:

```sql
CONSTRAINT slots_no_overlap EXCLUDE USING gist (tstzrange(starts_at, ends_at) WITH &&)
```

In plain words: "no two rows may have time ranges that overlap (`&&`)". `tstzrange` is a built-in PostgreSQL range type, and `[start, end)` ranges mean back-to-back slots (10:00–10:30 and 10:30–11:00) are allowed. A violation gives error `23P01`, which we turn into **409**.

Same idea as #1: the rule lives in one place, and no code path can get around it.

## 3. Plain SQL with `pg` instead of an ORM (Prisma / TypeORM)

- Every query is readable SQL in the service that uses it, with nothing generated or hidden.
- The most important rules (#1, #2) are PostgreSQL features, so the schema is easiest to show as SQL.
- Fewer tools to learn and configure for a small app.

**Safety:** all user input goes in as parameters (`$1, $2…`), never by gluing strings together. `pg` sends values separately from the SQL text, which prevents **SQL injection**.

**Mapping:** `starts_at AS "startsAt"` turns database names (snake_case) into API names (camelCase) right in the query, so there's no mapping layer.

**Trade-off:** no automatic TypeScript types from the schema. The interfaces in `slot.types.ts` / `booking.types.ts` are written by hand and must be kept in sync.

## 4. Migrations: numbered SQL files + a tiny runner

`db/migrations/001_….sql` creates the tables. `scripts/migrate.ts` (~60 lines) runs every file that hasn't been run yet, each in a **transaction** (it either fully applies or not at all), and records it in `schema_migrations`. To change the schema later, add `002_….sql`. Never edit a migration that already ran in production.

## 5. Time zones: store UTC, convert in the browser

- The database stores `TIMESTAMPTZ` (an exact moment in time).
- When the mentor picks "21 Oct, 10:00", the **browser** reads it as local time and sends an ISO string in UTC (`toISOString()`).
- Every visitor sees times converted to **their own** time zone, which is shown on the page.

The server never has to guess anyone's time zone. (The brief allowed one time zone. This handles more for free.)

## 6. Validation at the edge with DTOs

Each request body has a DTO class (`CreateSlotDto`, `CreateBookingDto`) with `class-validator` decorators (`@IsEmail`, `@Length`…). A global `ValidationPipe` rejects bad input with **400** before it reaches the service. With `whitelist: true`, unknown fields are stripped. Inputs are trimmed, and emails are lower-cased.

The frontend also validates (`required`, `type="email"`, `minLength`) for instant feedback, but **the server is the source of truth**, because anyone can call an API directly.

## 7. Public vs. mentor routes

`/api/slots` and `/api/bookings` are public. Everything the mentor does is under `/api/mentor/*`, in its own controller. The brief says no login, but this split means adding auth later is a single NestJS guard on one controller.

## 8. HTTP status codes tell the frontend what happened

| Code | Meaning in Unstuck | What the UI does |
|---|---|---|
| 201 | Booked / created | Go to confirmation / show success |
| 400 | Invalid input or a time in the past | Show the message in the form |
| 404 | Slot/booking doesn't exist | Show the message |
| 409 | Slot just taken / overlapping slot / deleting a booked slot | Booking: close the form, refresh the list, explain. Mentor: show inline |

## 9. Frontend data: TanStack Query

Instead of hand-written `useEffect` + `useState` for every request, React Query handles **loading/error states, caching, and refetching**:
- The slot list refetches every 15 seconds and when you return to the tab, so slots others booked disappear on their own.
- After a booking or a new slot, we **invalidate** the related queries so every list updates.
- After booking, the new booking is put into the cache (`setQueryData`), so the confirmation page appears instantly.

## 10. Session types live in one config object

`frontend/src/lib/session-types.ts` holds everything about a type: label, icon, colours, default duration, form copy and prep tips. Adding a new type touches one object in the UI (plus the CHECK constraint and `SESSION_TYPES` list in the backend).

## 11. Deployment: two Vercel projects + Neon

- Vercel supports NestJS with **zero configuration**: it finds `src/main.ts` and runs the app as a serverless function, so the backend needs no special code for Vercel.
- The frontend is a static Vite build. `vercel.json` sends every path to `index.html` so routes like `/mentor` work on refresh.
- **Neon** is serverless PostgreSQL. Use its **pooled** connection string in production, because serverless functions can open many short-lived connections and the pooler shares them.
- **CORS:** the API only accepts browser requests from the origins in `CORS_ORIGIN`.

## 12. Testing strategy

API tests run against a **real PostgreSQL** database, not mocks. Most of the important behaviour lives in the database (constraints), so a mock would test nothing meaningful. Each test starts from empty tables (`TRUNCATE`). They use the same `configureApp()` as production, so validation and the `/api` prefix behave identically.

The one thing we *do* fake is the AI: `overrideProvider(AiService).useValue(fakeAi)` swaps the real Gemini service for a fake one. Dependency injection makes this a one-line change, and tests stay free, fast and offline.

## 13. The AI session brief

**What it's for:** saving the *mentor's* prep time. The mentee's free-text problem becomes a one-line summary, opening questions, and a "missing info" hint. The mentee only gets a friendly confirmation message.

**Why the AI doesn't help the mentee solve the problem:** people book Unstuck to get help from a human. An AI that tries to solve the problem competes with the mentor and makes the booking feel pointless. The prompt explicitly says *"Do NOT try to solve the problem."*

**How it's built (`src/ai/`, `POST /api/bookings/:id/brief`):**
- **Separate from booking.** `POST /bookings` never calls the AI, so a slow or failing AI can't break or delay booking. The confirmation page asks for the brief afterwards, and the mentor has a "Prepare session brief" button as a backup.
- **Get-or-create.** The first successful call saves the brief in `bookings.ai_brief` (JSONB). Later calls return the saved brief without calling Gemini. `COALESCE(ai_brief, $2)` means that if two requests generate at the same moment, the first save wins and both get the same brief.
- **Failure = `null`, not an error.** No key, a 20-second timeout, a Gemini error, or unusable output all return `{ aiBrief: null }`, and the UI shows non-AI text.
- **Structured output, then validated.** Gemini gets a JSON schema (`responseJsonSchema`). We still check the shape and trim lengths in `parseBrief()` before saving, because model output is never trusted blindly.
- **Prompt injection.** The mentee's text is placed between markers and the instructions say to ignore commands inside it. React escapes all output, so the worst case is an odd brief for the person who wrote the text.
- **Key and model on the server.** `GEMINI_API_KEY` never reaches the browser. `GEMINI_MODEL` can switch models without code changes.

**Why a POST:** the first call creates data and costs an API call, so it isn't a pure read. It's safe to repeat (idempotent) because later calls return the saved result.

