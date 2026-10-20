import { IsIn, IsInt, IsISO8601, Max, Min } from 'class-validator';
import { SESSION_TYPES, SessionType } from '../../common/session-types';

export class CreateSlotDto {
  @IsIn(SESSION_TYPES)
  sessionType: SessionType;

  // Full ISO timestamp, e.g. "2026-10-21T14:00:00.000Z".
  // The browser converts the mentor's local date + time into this, so the server never guesses time zones.
  @IsISO8601({ strict: true })
  startsAt: string;

  @IsInt()
  @Min(10)
  @Max(180)
  durationMinutes: number;
}
