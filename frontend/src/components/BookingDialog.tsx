import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, LoaderCircle, X } from 'lucide-react'
import { MENTOR } from '../config'
import { api, ApiError } from '../lib/api'
import { formatDayLong, formatTimeRange } from '../lib/dates'
import { SESSION_TYPES } from '../lib/session-types'
import type { Slot } from '../lib/types'
import FormField, { inputClass } from './FormField'
import SessionTypeBadge from './SessionTypeBadge'

const MIN_TOPIC_LENGTH = 10

interface BookingDialogProps {
  slot: Slot
  onClose: () => void
  /** Called when someone else booked this slot first (HTTP 409). */
  onSlotTaken: (message: string) => void
}

export default function BookingDialog({ slot, onClose, onSlotTaken }: BookingDialogProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const info = SESSION_TYPES[slot.sessionType]

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')

  const bookMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: (booking) => {
      // Put the new booking in the cache so the confirmation page shows instantly, without another request.
      queryClient.setQueryData(['booking', booking.id], booking)
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      navigate(`/booking/${booking.id}`)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        queryClient.invalidateQueries({ queryKey: ['slots'] })
        onSlotTaken(error.message)
      }
    },
  })

  // Close on Escape, and stop the page behind the dialog from scrolling.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    bookMutation.mutate({ slotId: slot.id, name, email, topic, resourceUrl: resourceUrl || undefined })
  }

  const topicLength = topic.trim().length
  const isSubmitting = bookMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-stone-900/50" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-100 bg-white px-6 pt-6 pb-4">
          <div className="space-y-2">
            <SessionTypeBadge type={slot.sessionType} />
            <h2 id="booking-title" className="font-display text-2xl font-bold">
              Book with {MENTOR.name.split(' ')[0]}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-stone-600">
              <CalendarDays className="size-4" aria-hidden />
              {formatDayLong(slot.startsAt)}, {formatTimeRange(slot.startsAt, slot.endsAt)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Your name" htmlFor="name">
              <input id="name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)}
                required maxLength={100} autoComplete="name" autoFocus />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <input id="email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)}
                required maxLength={254} autoComplete="email" />
            </FormField>
          </div>

          <FormField
            label={info.topicLabel}
            htmlFor="topic"
            hint={
              <span className={topicLength > 0 && topicLength < MIN_TOPIC_LENGTH ? 'text-amber-700' : ''}>
                The more context you share, the more useful the session. ({topicLength}/1000)
              </span>
            }
          >
            <textarea id="topic" rows={4} className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder={info.topicPlaceholder} required minLength={MIN_TOPIC_LENGTH} maxLength={1000} />
          </FormField>

          <FormField label="Link" htmlFor="resourceUrl" optional>
            <input id="resourceUrl" type="url" className={inputClass} value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)} placeholder={info.linkPlaceholder} maxLength={500} />
          </FormField>

          {bookMutation.isError && !(bookMutation.error instanceof ApiError && bookMutation.error.status === 409) && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {bookMutation.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {isSubmitting ? 'Booking…' : `Confirm ${slot.durationMinutes}-minute session`}
          </button>
        </form>
      </div>
    </div>
  )
}
