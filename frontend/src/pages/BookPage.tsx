import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarX2, Clock, Info } from 'lucide-react'
import BookingDialog from '../components/BookingDialog'
import MentorCard from '../components/MentorCard'
import { EmptyState, ErrorState, LoadingState } from '../components/StatusMessage'
import { api } from '../lib/api'
import { formatDayHeading, formatTime, groupByDay, userTimeZone } from '../lib/dates'
import { SESSION_TYPE_KEYS, SESSION_TYPES } from '../lib/session-types'
import type { SessionType, Slot } from '../lib/types'

type Filter = SessionType | 'all'

export default function BookPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // refetchInterval: re-check every 15s so slots booked by others disappear without a page reload.
  const slotsQuery = useQuery({
    queryKey: ['slots'],
    queryFn: api.getAvailableSlots,
    refetchInterval: 15_000,
  })

  const allSlots = slotsQuery.data ?? []
  // We filter in the browser (not via ?sessionType=) so the filter buttons can show a count for every type.
  const visibleSlots = filter === 'all' ? allSlots : allSlots.filter((slot) => slot.sessionType === filter)
  const days = groupByDay(visibleSlots)

  function openSlot(slot: Slot) {
    setNotice(null)
    setSelectedSlot(slot)
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Stuck? Book 1:1 time with a senior dev.
          </h1>
          <p className="mt-3 text-stone-600">
            Pick a slot, tell Sam what you’re working on, and show up to a session that starts with answers, not
            “so… what’s the issue?”
          </p>
        </div>
        <MentorCard />
      </aside>

      <section aria-labelledby="slots-heading" className="min-w-0">
        <h2 id="slots-heading" className="font-display text-2xl font-bold">
          1. Choose a session type
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {SESSION_TYPE_KEYS.map((type) => (
            <SessionTypeCard
              key={type}
              type={type}
              count={allSlots.filter((slot) => slot.sessionType === type).length}
              selected={filter === type}
              onClick={() => setFilter(filter === type ? 'all' : type)}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">2. Pick a time</h2>
          <p className="text-xs text-stone-500">Times shown in your time zone ({userTimeZone})</p>
        </div>

        {notice && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {notice}
          </div>
        )}

        <div className="mt-4">
          {slotsQuery.isPending ? (
            <LoadingState label="Loading available times…" />
          ) : slotsQuery.isError ? (
            <ErrorState message={slotsQuery.error.message} onRetry={() => slotsQuery.refetch()} />
          ) : days.length === 0 ? (
            <EmptyState icon={<CalendarX2 className="size-8" />} title="No open slots right now">
              {filter === 'all'
                ? 'Sam hasn’t published new times yet. Check back soon!'
                : `No ${SESSION_TYPES[filter].label.toLowerCase()} slots at the moment. Try another session type.`}
            </EmptyState>
          ) : (
            <div className="space-y-8">
              {days.map(({ day, items }) => (
                <div key={day}>
                  <h3 className="mb-3 text-sm font-semibold tracking-wide text-stone-500 uppercase">
                    {formatDayHeading(items[0].startsAt)}
                  </h3>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                    {items.map((slot) => (
                      <li key={slot.id}>
                        <SlotButton slot={slot} onClick={() => openSlot(slot)} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedSlot && (
        <BookingDialog
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSlotTaken={(message) => {
            setSelectedSlot(null)
            setNotice(`${message} The list below is now up to date.`)
          }}
        />
      )}
    </div>
  )
}

interface SessionTypeCardProps {
  type: SessionType
  count: number
  selected: boolean
  onClick: () => void
}

function SessionTypeCard({ type, count, selected, onClick }: SessionTypeCardProps) {
  const info = SESSION_TYPES[type]
  const Icon = info.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex h-full flex-col items-start gap-3 rounded-2xl border bg-white p-4 text-left transition ${
        selected
          ? 'border-indigo-500 ring-4 ring-indigo-500/15'
          : 'border-stone-200 shadow-sm hover:border-stone-300 hover:shadow'
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className={`grid size-9 place-items-center rounded-xl ${info.styles.icon}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="text-xs text-stone-500">{count} open</span>
      </div>
      <div>
        <p className="font-semibold">{info.label}</p>
        <p className="mt-1 text-sm text-stone-500">{info.description}</p>
      </div>
      <p className="mt-auto flex items-center gap-1 text-xs font-medium text-stone-500">
        <Clock className="size-3.5" aria-hidden /> ~{info.defaultDuration} min
      </p>
    </button>
  )
}

function SlotButton({ slot, onClick }: { slot: Slot; onClick: () => void }) {
  const info = SESSION_TYPES[slot.sessionType]
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md focus-visible:ring-4 focus-visible:ring-indigo-500/20 focus-visible:outline-none"
    >
      <span className="block text-lg font-semibold tabular-nums group-hover:text-indigo-700">
        {formatTime(slot.startsAt)}
      </span>
      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
        <span className={`size-2 rounded-full ${info.styles.dot}`} aria-hidden />
        {info.label} · {slot.durationMinutes} min
      </span>
    </button>
  )
}
