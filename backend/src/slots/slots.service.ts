import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { hasPgErrorCode, PG_EXCLUSION_VIOLATION } from '../database/postgres-errors';
import { SessionType } from '../common/session-types';
import { CreateSlotDto } from './dto/create-slot.dto';
import { MentorSlot, Slot } from './slot.types';

// Columns shared by every slot query. `AS "camelCase"` turns DB names into the names the API returns.
const SLOT_COLUMNS = `
  s.id,
  s.session_type AS "sessionType",
  s.starts_at    AS "startsAt",
  s.ends_at      AS "endsAt",
  (EXTRACT(EPOCH FROM s.ends_at - s.starts_at) / 60)::int AS "durationMinutes"
`;

@Injectable()
export class SlotsService {
  constructor(private readonly db: DatabaseService) {}

  /** Public list: future slots that nobody has booked yet. */
  findAvailable(sessionType?: SessionType): Promise<Slot[]> {
    return this.db.query<Slot>(
      `SELECT ${SLOT_COLUMNS}
       FROM slots s
       LEFT JOIN bookings b ON b.slot_id = s.id
       WHERE b.id IS NULL
         AND s.starts_at > now()
         AND ($1::text IS NULL OR s.session_type = $1)
       ORDER BY s.starts_at`,
      [sessionType ?? null],
    );
  }

  /** Mentor view: every upcoming slot, with its booking (or null). */
  findUpcomingForMentor(): Promise<MentorSlot[]> {
    return this.db.query<MentorSlot>(
      `SELECT ${SLOT_COLUMNS},
         (SELECT json_build_object(
                   'id', b.id,
                   'name', b.name,
                   'email', b.email,
                   'topic', b.topic,
                   'resourceUrl', b.resource_url,
                   'createdAt', b.created_at)
          FROM bookings b
          WHERE b.slot_id = s.id) AS booking
       FROM slots s
       WHERE s.ends_at > now()
       ORDER BY s.starts_at`,
    );
  }

  async create(dto: CreateSlotDto): Promise<Slot> {
    const startsAt = new Date(dto.startsAt);
    if (startsAt.getTime() <= Date.now()) {
      throw new BadRequestException('A slot must start in the future.');
    }
    const endsAt = new Date(startsAt.getTime() + dto.durationMinutes * 60_000);

    try {
      const [slot] = await this.db.query<Slot>(
        `INSERT INTO slots AS s (session_type, starts_at, ends_at)
         VALUES ($1, $2, $3)
         RETURNING ${SLOT_COLUMNS}`,
        [dto.sessionType, startsAt, endsAt],
      );
      return slot;
    } catch (error) {
      // The "slots_no_overlap" constraint in the database rejected it.
      if (hasPgErrorCode(error, PG_EXCLUSION_VIOLATION)) {
        throw new ConflictException('This time overlaps with one of your existing slots.');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const [slot] = await this.db.query<{ isBooked: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM bookings WHERE slot_id = $1) AS "isBooked"
       FROM slots WHERE id = $1`,
      [id],
    );
    if (!slot) {
      throw new NotFoundException('Slot not found.');
    }
    if (slot.isBooked) {
      throw new ConflictException('This slot is already booked, so it can’t be deleted.');
    }
    await this.db.query('DELETE FROM slots WHERE id = $1', [id]);
  }
}
