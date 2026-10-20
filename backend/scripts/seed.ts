/**
 * Fills the database with demo slots for the next 7 days (weekdays only),
 * so the booking page isn't empty on first visit.
 *
 * Usage: npm run db:seed   (safe to run more than once)
 */
import 'dotenv/config';
import { Client } from 'pg';

// [hour, minute, session type, duration in minutes], in the time zone of the machine running the script.
const DAILY_SCHEDULE = [
  [10, 0, 'code_review', 30],
  [11, 0, 'debugging', 45],
  [14, 0, 'career_chat', 20],
  [16, 30, 'code_review', 30],
] as const;

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let created = 0;
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const day = new Date();
    day.setDate(day.getDate() + dayOffset);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    if (isWeekend) continue;

    for (const [hour, minute, sessionType, duration] of DAILY_SCHEDULE) {
      const startsAt = new Date(day);
      startsAt.setHours(hour, minute, 0, 0);
      const endsAt = new Date(startsAt.getTime() + duration * 60_000);

      // ON CONFLICT DO NOTHING: skip slots that would overlap existing ones (e.g. on a second run).
      const result = await client.query(
        `INSERT INTO slots (session_type, starts_at, ends_at)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [sessionType, startsAt, endsAt],
      );
      created += result.rowCount ?? 0;
    }
  }

  await client.end();
  console.log(`Created ${created} demo slots.`);
}

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
