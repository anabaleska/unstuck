// These mirror what the API returns. Dates arrive as ISO strings in JSON.

export type SessionType = 'code_review' | 'debugging' | 'career_chat'

export interface Slot {
  id: string
  sessionType: SessionType
  startsAt: string
  endsAt: string
  durationMinutes: number
}

/** Written by AI (Gemini) once per booking. null = not generated yet, or the AI was unavailable. */
export interface AiBrief {
  summary: string
  openingQuestions: string[]
  missingInfo: string | null
  confirmationMessage: string
}

export interface Booking {
  id: string
  name: string
  email: string
  topic: string
  resourceUrl: string | null
  createdAt: string
  aiBrief: AiBrief | null
  slot: Slot
}

/** A slot as the mentor sees it: with the booking attached, or null if still open. */
export interface MentorSlot extends Slot {
  booking: Omit<Booking, 'slot'> | null
}

export interface NewSlot {
  sessionType: SessionType
  startsAt: string
  durationMinutes: number
}

export interface NewBooking {
  slotId: string
  name: string
  email: string
  topic: string
  resourceUrl?: string
}
