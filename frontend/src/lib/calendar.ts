import { MENTOR } from '../config'
import { SESSION_TYPES } from './session-types'
import type { Booking } from './types'

// Calendar apps want times like 20261021T140000Z (UTC, no dashes/colons/milliseconds).
function toCalendarTime(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function eventDetails(booking: Booking) {
  const title = `${SESSION_TYPES[booking.slot.sessionType].label} with ${MENTOR.name}`
  const description = `Booked via Unstuck.\n\nTopic: ${booking.topic}${
    booking.resourceUrl ? `\nLink: ${booking.resourceUrl}` : ''
  }`
  return { title, description }
}

/** A link that opens Google Calendar with the event pre-filled. */
export function googleCalendarUrl(booking: Booking): string {
  const { title, description } = eventDetails(booking)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toCalendarTime(booking.slot.startsAt)}/${toCalendarTime(booking.slot.endsAt)}`,
    details: description,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

// In .ics files, commas, semicolons, backslashes and newlines must be escaped.
function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n')
}

/** Downloads an .ics file, which Apple Calendar, Outlook, etc. can open. */
export function downloadIcsFile(booking: Booking): void {
  const { title, description } = eventDetails(booking)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Unstuck//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@unstuck`,
    `DTSTAMP:${toCalendarTime(new Date().toISOString())}`,
    `DTSTART:${toCalendarTime(booking.slot.startsAt)}`,
    `DTEND:${toCalendarTime(booking.slot.endsAt)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const file = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = 'unstuck-session.ics'
  link.click()
  URL.revokeObjectURL(link.href)
}
