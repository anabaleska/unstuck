import { AiBrief } from '../ai/ai-brief.types';
import { Slot } from '../slots/slot.types';

export interface Booking {
  id: string;
  name: string;
  email: string;
  topic: string;
  resourceUrl: string | null;
  createdAt: Date;
  aiBrief: AiBrief | null;
  slot: Slot;
}
