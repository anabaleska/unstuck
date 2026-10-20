import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, LoaderCircle, Mail, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { formatTimeRange } from '../lib/dates'
import type { MentorSlot } from '../lib/types'
import SessionTypeBadge from './SessionTypeBadge'

export default function MentorSlotCard({ slot }: { slot: MentorSlot }) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteSlot(slot.id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-slots'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })

  function handleDelete() {
    if (window.confirm('Delete this open slot?')) deleteMutation.mutate()
  }

  const { booking } = slot

  return (
    <li className={`rounded-2xl border bg-white p-4 shadow-sm ${booking ? 'border-indigo-200' : 'border-stone-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold tabular-nums">{formatTimeRange(slot.startsAt, slot.endsAt)}</span>
          <SessionTypeBadge type={slot.sessionType} />
        </div>

        {booking ? (
          <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">Booked</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">Open</span>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Delete slot"
            >
              {deleteMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </button>
          </div>
        )}
      </div>

      {deleteMutation.isError && <p className="mt-2 text-sm text-rose-700">{deleteMutation.error.message}</p>}

      {booking && (
        <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium">{booking.name}</span>
            <a href={`mailto:${booking.email}`} className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:underline">
              <Mail className="size-3.5" aria-hidden /> {booking.email}
            </a>
          </div>
          <p className="rounded-xl bg-stone-50 px-4 py-3 text-sm whitespace-pre-line text-stone-700">{booking.topic}</p>
          {booking.resourceUrl && (
            <a
              href={booking.resourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium break-all text-indigo-700 hover:underline"
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden /> {booking.resourceUrl}
            </a>
          )}
        </div>
      )}
    </li>
  )
}
