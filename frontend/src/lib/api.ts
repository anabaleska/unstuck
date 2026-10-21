import { API_URL } from '../config'
import type { AiBrief, Booking, MentorSlot, NewBooking, NewSlot, Slot } from './types'

/** An error from the API, with its HTTP status (e.g. 409 = slot already taken). */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    throw new ApiError('Can’t reach the server. Check your connection and try again.', 0)
  }

  if (!response.ok) {
    // NestJS errors look like { message: string | string[] }. Validation errors are an array.
    const body = await response.json().catch(() => null)
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message
    throw new ApiError(message ?? 'Something went wrong. Please try again.', response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

export const api = {
  getAvailableSlots: () => request<Slot[]>('/slots'),

  getBooking: (id: string) => request<Booking>(`/bookings/${id}`),

  createBooking: (booking: NewBooking) =>
    request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(booking) }),

  // Generates the AI brief the first time, then returns the saved one. aiBrief is null if the AI is unavailable.
  getOrCreateBrief: (bookingId: string) =>
    request<{ aiBrief: AiBrief | null }>(`/bookings/${bookingId}/brief`, { method: 'POST' }),

  getMentorSlots: () => request<MentorSlot[]>('/mentor/slots'),

  createSlot: (slot: NewSlot) =>
    request<Slot>('/mentor/slots', { method: 'POST', body: JSON.stringify(slot) }),

  deleteSlot: (id: string) => request<void>(`/mentor/slots/${id}`, { method: 'DELETE' }),
}
