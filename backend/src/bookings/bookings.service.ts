import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AiBrief } from '../ai/ai-brief.types';
import { AiService } from '../ai/ai.service';
import { DatabaseService } from '../database/database.service';
import { hasPgErrorCode, PG_UNIQUE_VIOLATION } from '../database/postgres-errors';
import { Booking } from './booking.types';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly ai: AiService,
  ) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    // Step 1: friendly checks, so the user gets a clear error message.
    const [slot] = await this.db.query<{ hasStarted: boolean }>(
      'SELECT starts_at <= now() AS "hasStarted" FROM slots WHERE id = $1',
      [dto.slotId],
    );
    if (!slot) {
      throw new NotFoundException('This slot no longer exists.');
    }
    if (slot.hasStarted) {
      throw new BadRequestException('This slot has already started.');
    }

    // Step 2: insert. We do NOT check "is it already booked?" in code first, because two
    // requests could both pass that check at the same moment. Instead the UNIQUE(slot_id)
    // constraint lets exactly one INSERT win; the other gets a unique-violation error.
    try {
      const [booking] = await this.db.query<{ id: string }>(
        `INSERT INTO bookings (slot_id, name, email, topic, resource_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [dto.slotId, dto.name, dto.email, dto.topic, dto.resourceUrl ?? null],
      );
      return this.findById(booking.id);
    } catch (error) {
      if (hasPgErrorCode(error, PG_UNIQUE_VIOLATION)) {
        throw new ConflictException('Someone just booked this slot. Please pick another time.');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Booking> {
    const [booking] = await this.db.query<Booking>(
      `SELECT b.id, b.name, b.email, b.topic,
              b.resource_url AS "resourceUrl",
              b.created_at   AS "createdAt",
              b.ai_brief     AS "aiBrief",
              json_build_object(
                'id', s.id,
                'sessionType', s.session_type,
                'startsAt', s.starts_at,
                'endsAt', s.ends_at,
                'durationMinutes', (EXTRACT(EPOCH FROM s.ends_at - s.starts_at) / 60)::int
              ) AS slot
       FROM bookings b
       JOIN slots s ON s.id = b.slot_id
       WHERE b.id = $1`,
      [id],
    );
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }
    return booking;
  }

  /**
   * Returns the AI brief for a booking, generating it the first time.
   * Safe to call many times: after the first success it just returns the saved brief.
   * Returns null if the AI is unavailable. Callers then show their non-AI fallback.
   */
  async getOrCreateBrief(id: string): Promise<AiBrief | null> {
    const booking = await this.findById(id); // 404 if the booking doesn't exist
    if (booking.aiBrief) return booking.aiBrief;

    const brief = await this.ai.generateBrief({
      menteeName: booking.name,
      sessionType: booking.slot.sessionType,
      topic: booking.topic,
      resourceUrl: booking.resourceUrl,
    });
    if (!brief) return null;

    // COALESCE keeps an existing brief: if two requests generated one at the same time,
    // the first one saved wins and both callers get that same brief back.
    const [saved] = await this.db.query<{ aiBrief: AiBrief }>(
      `UPDATE bookings SET ai_brief = COALESCE(ai_brief, $2::jsonb)
       WHERE id = $1
       RETURNING ai_brief AS "aiBrief"`,
      [id, JSON.stringify(brief)],
    );
    return saved.aiBrief;
  }
}
