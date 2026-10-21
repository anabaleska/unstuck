import { AiBrief } from '../ai/ai-brief.types';
import { SessionType } from '../common/session-types';

export interface Slot {
  id: string;
  sessionType: SessionType;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
}

/** What the mentor sees: the slot plus who booked it (null if still open). */
export interface MentorSlot extends Slot {
  booking: {
    id: string;
    name: string;
    email: string;
    topic: string;
    resourceUrl: string | null;
    createdAt: string;
    aiBrief: AiBrief | null;
  } | null;
}
