import type { ReactNode } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'

/** Loading / error / empty states, so every list looks consistent while it isn't "normal". */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-stone-500" role="status">
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      {label}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
      <CircleAlert className="size-6 text-rose-600" aria-hidden />
      <p className="text-rose-800">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium ring-1 ring-rose-200 hover:bg-rose-100">
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 px-6 py-14 text-center">
      <div className="mb-1 text-stone-400">{icon}</div>
      <p className="font-medium text-stone-800">{title}</p>
      {children && <div className="max-w-sm text-sm text-stone-500">{children}</div>}
    </div>
  )
}
