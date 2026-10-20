/**
 * API tests against a real PostgreSQL database (TEST_DATABASE_URL).
 * Every test starts with empty tables.
 */
import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { runMigrations } from '../scripts/migrate';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (!TEST_DATABASE_URL) {
  throw new Error('Set TEST_DATABASE_URL in .env to run the tests (use a separate database: tests delete data).');
}
// Make the app under test use the test database.
process.env.DATABASE_URL = TEST_DATABASE_URL;

const HOUR = 60 * 60 * 1000;
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * HOUR).toISOString();

describe('Unstuck API', () => {
  let app: INestApplication;
  let db: Pool;

  beforeAll(async () => {
    await runMigrations(TEST_DATABASE_URL);
    db = new Pool({ connectionString: TEST_DATABASE_URL });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0); // random free port; a real listening server handles parallel requests cleanly
  });

  beforeEach(async () => {
    await db.query('TRUNCATE bookings, slots');
  });

  afterAll(async () => {
    await app.close();
    await db.end();
  });

  const api = () => request(app.getHttpServer());

  async function createSlot(startsInHours: number, durationMinutes = 30, sessionType = 'code_review') {
    const res = await api()
      .post('/api/mentor/slots')
      .send({ sessionType, startsAt: hoursFromNow(startsInHours), durationMinutes })
      .expect(201);
    return res.body as { id: string };
  }

  const validBooking = (slotId: string) => ({
    slotId,
    name: 'Ana',
    email: 'ana@example.com',
    topic: 'My React useEffect runs twice and I do not understand why.',
  });

  describe('slots', () => {
    it('creates a slot and lists it as available', async () => {
      const slot = await createSlot(24, 45, 'debugging');

      const res = await api().get('/api/slots').expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ id: slot.id, sessionType: 'debugging', durationMinutes: 45 });
    });

    it('filters available slots by session type', async () => {
      await createSlot(24, 30, 'code_review');
      await createSlot(48, 20, 'career_chat');

      const res = await api().get('/api/slots?sessionType=career_chat').expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].sessionType).toBe('career_chat');
    });

    it('rejects a slot in the past', async () => {
      await api()
        .post('/api/mentor/slots')
        .send({ sessionType: 'code_review', startsAt: hoursFromNow(-1), durationMinutes: 30 })
        .expect(400);
    });

    it('rejects invalid input', async () => {
      await api()
        .post('/api/mentor/slots')
        .send({ sessionType: 'yoga', startsAt: 'tomorrow', durationMinutes: 5 })
        .expect(400);
    });

    it('rejects a slot that overlaps an existing one', async () => {
      await createSlot(24, 60); // 24:00 - 25:00 from now
      await api()
        .post('/api/mentor/slots')
        .send({ sessionType: 'debugging', startsAt: hoursFromNow(24.5), durationMinutes: 30 })
        .expect(409);
    });

    it('allows back-to-back slots (end of one = start of next)', async () => {
      await createSlot(24, 60);
      await createSlot(25, 30);
    });

    it('deletes an open slot but not a booked one', async () => {
      const open = await createSlot(24);
      const booked = await createSlot(48);
      await api().post('/api/bookings').send(validBooking(booked.id)).expect(201);

      await api().delete(`/api/mentor/slots/${open.id}`).expect(204);
      await api().delete(`/api/mentor/slots/${booked.id}`).expect(409);
    });
  });

  describe('bookings', () => {
    it('books a slot, hides it from the public list, and shows it to the mentor', async () => {
      const slot = await createSlot(24);

      const booking = await api().post('/api/bookings').send(validBooking(slot.id)).expect(201);
      expect(booking.body).toMatchObject({ name: 'Ana', slot: { id: slot.id } });

      const available = await api().get('/api/slots').expect(200);
      expect(available.body).toHaveLength(0);

      const mentor = await api().get('/api/mentor/slots').expect(200);
      expect(mentor.body[0].booking).toMatchObject({ name: 'Ana', email: 'ana@example.com' });
    });

    it('rejects a second booking for the same slot', async () => {
      const slot = await createSlot(24);
      await api().post('/api/bookings').send(validBooking(slot.id)).expect(201);

      const res = await api()
        .post('/api/bookings')
        .send({ ...validBooking(slot.id), name: 'Bob', email: 'bob@example.com' })
        .expect(409);
      expect(res.body.message).toMatch(/just booked/);
    });

    it('allows exactly ONE booking when 10 people click "Book" at the same time', async () => {
      const slot = await createSlot(24);

      const attempts = Array.from({ length: 10 }, (_, i) =>
        api()
          .post('/api/bookings')
          .send({ ...validBooking(slot.id), email: `person${i}@example.com` }),
      );
      const responses = await Promise.all(attempts);
      const statuses = responses.map((res) => res.status);

      expect(statuses.filter((s) => s === 201)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(9);

      const { rows } = await db.query('SELECT count(*)::int AS count FROM bookings');
      expect(rows[0].count).toBe(1);
    });

    it('validates booking input', async () => {
      const slot = await createSlot(24);
      await api()
        .post('/api/bookings')
        .send({ ...validBooking(slot.id), email: 'not-an-email', topic: 'help' })
        .expect(400);
    });

    it('returns 404 for a slot that does not exist', async () => {
      await api()
        .post('/api/bookings')
        .send(validBooking('00000000-0000-4000-8000-000000000000'))
        .expect(404);
    });

    it('fetches a booking by id for the confirmation page', async () => {
      const slot = await createSlot(24, 45, 'debugging');
      const created = await api().post('/api/bookings').send(validBooking(slot.id)).expect(201);

      const res = await api().get(`/api/bookings/${created.body.id}`).expect(200);
      expect(res.body.slot).toMatchObject({ sessionType: 'debugging', durationMinutes: 45 });
    });
  });
});
