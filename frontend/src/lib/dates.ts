// All formatting uses the browser's time zone. The API stores times in UTC,
// so every visitor sees slots in their own local time.

const LOCALE = 'en-GB'

export const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`
}

/** "Tuesday 21 October" */
export function formatDayLong(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "Tue 21 Oct" */
export function formatDayShort(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })
}

/** "Today", "Tomorrow", or "Tuesday 21 October" */
export function formatDayHeading(iso: string): string {
  const key = toDateInputValue(new Date(iso))
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  if (key === toDateInputValue(today)) return 'Today'
  if (key === toDateInputValue(tomorrow)) return 'Tomorrow'
  return formatDayLong(iso)
}

/** Local date as "YYYY-MM-DD", the format <input type="date"> uses. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Groups items (already sorted by time) into days: [{ day: "2026-10-21", items: [...] }, ...] */
export function groupByDay<T extends { startsAt: string }>(items: T[]): { day: string; items: T[] }[] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const day = toDateInputValue(new Date(item.startsAt))
    groups.set(day, [...(groups.get(day) ?? []), item])
  }
  return [...groups].map(([day, groupItems]) => ({ day, items: groupItems }))
}
