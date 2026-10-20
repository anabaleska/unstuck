import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, LoaderCircle, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { formatDayShort, formatTime, formatTimeRange, toDateInputValue } from '../lib/dates'
import { SESSION_TYPE_KEYS, SESSION_TYPES } from '../lib/session-types'
import type { SessionType } from '../lib/types'
import FormField, { inputClass } from './FormField'

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120]

function tomorrow(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return toDateInputValue(date)
}

export default function CreateSlotForm() {
  const queryClient = useQueryClient()

  const [sessionType, setSessionType] = useState<SessionType>('code_review')
  const [date, setDate] = useState(tomorrow)
  const [time, setTime] = useState('10:00')
  const [duration, setDuration] = useState(SESSION_TYPES.code_review.defaultDuration)
  const [success, setSuccess] = useState<string | null>(null)
  // Snapshot of "now" for the instant past-time warning. The API re-checks on submit, so it can't be bypassed.
  const [now] = useState(() => new Date())

  // "2026-10-21" + "10:00" is read as the mentor's LOCAL time; toISOString() then converts it to UTC for the API.
  const startsAt = date && time ? new Date(`${date}T${time}`) : null
  const endsAt = startsAt ? new Date(startsAt.getTime() + duration * 60_000) : null
  const isInPast = startsAt !== null && startsAt.getTime() <= now.getTime()

  const createMutation = useMutation({
    mutationFn: api.createSlot,
    onSuccess: (slot) => {
      setSuccess(`Published ${formatDayShort(slot.startsAt)}, ${formatTimeRange(slot.startsAt, slot.endsAt)}`)
      // Jump the start time to the end of this slot, so adding back-to-back slots is one click each.
      setTime(formatTime(slot.endsAt))
      setDate(toDateInputValue(new Date(slot.endsAt)))
      queryClient.invalidateQueries({ queryKey: ['mentor-slots'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })

  function changeSessionType(type: SessionType) {
    setSessionType(type)
    setDuration(SESSION_TYPES[type].defaultDuration)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!startsAt || isInPast) return
    setSuccess(null)
    createMutation.mutate({ sessionType, startsAt: startsAt.toISOString(), durationMinutes: duration })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-display text-xl font-bold">Publish a slot</h2>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-stone-800">Session type</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1">
          {SESSION_TYPE_KEYS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => changeSessionType(type)}
              aria-pressed={sessionType === type}
              className={`rounded-lg px-2 py-2 text-xs font-medium transition sm:text-sm ${
                sessionType === type ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {SESSION_TYPES[type].label}
            </button>
          ))}
        </div>
      </fieldset>

      <FormField label="Date" htmlFor="slot-date">
        <input id="slot-date" type="date" className={inputClass} value={date} min={toDateInputValue(now)}
          onChange={(e) => setDate(e.target.value)} required />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start time" htmlFor="slot-time">
          <input id="slot-time" type="time" step={300} className={inputClass} value={time}
            onChange={(e) => setTime(e.target.value)} required />
        </FormField>
        <FormField label="Duration" htmlFor="slot-duration">
          <select id="slot-duration" className={inputClass} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {startsAt && endsAt && !Number.isNaN(startsAt.getTime()) && (
        <p className={`rounded-xl px-4 py-3 text-sm ${isInPast ? 'bg-amber-50 text-amber-900' : 'bg-stone-50 text-stone-600'}`}>
          {isInPast
            ? 'That time has already passed. Pick a time in the future.'
            : `${formatDayShort(startsAt.toISOString())}, ${formatTimeRange(startsAt.toISOString(), endsAt.toISOString())}`}
        </p>
      )}

      {createMutation.isError && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {createMutation.error.message}
        </p>
      )}
      {success && !createMutation.isError && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CircleCheck className="size-4 shrink-0" aria-hidden /> {success}
        </p>
      )}

      <button
        type="submit"
        disabled={createMutation.isPending || isInPast}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {createMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
        Publish slot
      </button>
    </form>
  )
}
