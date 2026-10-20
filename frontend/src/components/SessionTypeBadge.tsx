import { SESSION_TYPES } from '../lib/session-types'
import type { SessionType } from '../lib/types'

export default function SessionTypeBadge({ type }: { type: SessionType }) {
  const info = SESSION_TYPES[type]
  const Icon = info.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${info.styles.badge}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {info.label}
    </span>
  )
}
