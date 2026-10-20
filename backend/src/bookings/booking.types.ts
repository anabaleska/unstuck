import { Slot } from '../slots/slot.types';

export interface Booking {
  id: string;
  name: string;
  email: string;
  topic: string;
  resourceUrl: string | null;
  createdAt: Date;
  slot: Slot;
}
