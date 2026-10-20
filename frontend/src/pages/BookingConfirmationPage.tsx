import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarPlus, CircleCheck, Clock, Download, ExternalLink, ListChecks } from 'lucide-react'
import SessionTypeBadge from '../components/SessionTypeBadge'
import { ErrorState, LoadingState } from '../components/StatusMessage'
import { MENTOR } from '../config'
import { api } from '../lib/api'
import { downloadIcsFile, googleCalendarUrl } from '../lib/calendar'
import { formatDayLong, formatTimeRange } from '../lib/dates'
import { SESSION_TYPES } from '../lib/session-types'

export default function BookingConfirmationPage() {
  const { id = '' } = useParams()
  const bookingQuery = useQuery({ queryKey: ['booking', id], queryFn: () => api.getBooking(id) })

  if (bookingQuery.isPending) return <LoadingState label="Loading your booking…" />
  if (bookingQuery.isError) return <ErrorState message={bookingQuery.error.message} />

  const booking = bookingQuery.data
  const { slot } = booking
  const info = SESSION_TYPES[slot.sessionType]
  const firstName = booking.name.split(' ')[0]

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CircleCheck className="size-9" aria-hidden />
        </div>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight">You’re booked, {firstName}!</h1>
        <p className="mt-2 text-stone-600">
          {MENTOR.name} will send a video link to <span className="font-medium text-stone-900">{booking.email}</span>{' '}
          before the session.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="space-y-3 p-6">
          <SessionTypeBadge type={slot.sessionType} />
          <p className="font-display text-2xl font-bold">{formatDayLong(slot.startsAt)}</p>
          <p className="flex items-center gap-2 text-stone-600">
            <Clock className="size-4" aria-hidden />
            {formatTimeRange(slot.startsAt, slot.endsAt)} · {slot.durationMinutes} min with {MENTOR.name}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={googleCalendarUrl(booking)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <CalendarPlus className="size-4" aria-hidden /> Add to Google Calendar
            </a>
            <button
              onClick={() => downloadIcsFile(booking)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-stone-300 hover:bg-stone-50"
            >
              <Download className="size-4" aria-hidden /> Download .ics
            </button>
          </div>
        </div>

        <div className="border-t border-stone-100 bg-stone-50/70 p-6">
          <h2 className="text-sm font-semibold text-stone-500">What you shared</h2>
          <p className="mt-2 whitespace-pre-line text-stone-800">{booking.topic}</p>
          {booking.resourceUrl && (
            <a
              href={booking.resourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium break-all text-indigo-700 hover:underline"
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden /> {booking.resourceUrl}
            </a>
          )}
        </div>

        <div className="border-t border-stone-100 p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <ListChecks className="size-5 text-indigo-600" aria-hidden /> Before the session
          </h2>
          <ul className="mt-3 space-y-2">
            {info.prepTips.map((tip) => (
              <li key={tip} className="flex gap-3 text-sm text-stone-700">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900">
          <ArrowLeft className="size-4" aria-hidden /> Book another session
        </Link>
      </div>
    </div>
  )
}
