import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, CalendarPlus } from 'lucide-react'
import CreateSlotForm from '../components/CreateSlotForm'
import MentorSlotCard from '../components/MentorSlotCard'
import { EmptyState, ErrorState, LoadingState } from '../components/StatusMessage'
import { MENTOR } from '../config'
import { api } from '../lib/api'
import { formatDayHeading, formatDayShort, formatTime, groupByDay } from '../lib/dates'

type Tab = 'all' | 'booked' | 'open'

export default function MentorDashboardPage() {
  const [tab, setTab] = useState<Tab>('all')

  const slotsQuery = useQuery({
    queryKey: ['mentor-slots'],
    queryFn: api.getMentorSlots,
    refetchInterval: 15_000, // new bookings show up on their own
  })

  const slots = slotsQuery.data ?? []
  const booked = slots.filter((slot) => slot.booking)
  const open = slots.filter((slot) => !slot.booking)
  const nextSession = booked[0] // slots come sorted by start time

  const visible = tab === 'booked' ? booked : tab === 'open' ? open : slots
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: slots.length },
    { id: 'booked', label: 'Booked', count: booked.length },
    { id: 'open', label: 'Open', count: open.length },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold tracking-tight">Hi {MENTOR.name.split(' ')[0]}</h1>
        <p className="mt-2 text-stone-600">Publish open times and see who’s coming and what they need help with.</p>
      </div>

      <dl className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Open slots" value={open.length} />
        <Stat label="Booked sessions" value={booked.length} />
        <Stat
          label="Next session"
          value={nextSession ? `${formatDayShort(nextSession.startsAt)}, ${formatTime(nextSession.startsAt)}` : '—'}
          detail={nextSession?.booking?.name}
        />
      </dl>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CreateSlotForm />
        </div>

        <section aria-labelledby="schedule-heading" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="schedule-heading" className="font-display text-xl font-bold">
              Upcoming schedule
            </h2>
            <div className="flex gap-1 rounded-xl bg-stone-200/60 p-1" role="tablist">
              {tabs.map(({ id, label, count }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    tab === id ? 'bg-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {label} <span className="text-stone-400">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {slotsQuery.isPending ? (
            <LoadingState label="Loading your schedule…" />
          ) : slotsQuery.isError ? (
            <ErrorState message={slotsQuery.error.message} onRetry={() => slotsQuery.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={tab === 'booked' ? <CalendarClock className="size-8" /> : <CalendarPlus className="size-8" />}
              title={tab === 'booked' ? 'No bookings yet' : 'No slots here'}
            >
              {tab === 'booked'
                ? 'When someone books one of your slots, it shows up here with what they need help with.'
                : 'Use the form to publish your first available time.'}
            </EmptyState>
          ) : (
            <div className="space-y-6">
              {groupByDay(visible).map(({ day, items }) => (
                <div key={day}>
                  <h3 className="mb-2 text-sm font-semibold tracking-wide text-stone-500 uppercase">
                    {formatDayHeading(items[0].startsAt)}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((slot) => (
                      <MentorSlotCard key={slot.id} slot={slot} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <dt className="text-sm text-stone-500">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold">
        {value}
        {detail && <span className="ml-2 font-sans text-sm font-normal text-stone-500">with {detail}</span>}
      </dd>
    </div>
  )
}
