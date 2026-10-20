import type { ReactNode } from 'react'

// Shared styling for every input, so forms look the same everywhere.
export const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-[15px] shadow-sm outline-none transition placeholder:text-stone-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15'

interface FormFieldProps {
  label: string
  htmlFor: string
  hint?: ReactNode
  optional?: boolean
  children: ReactNode
}

export default function FormField({ label, htmlFor, hint, optional, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-sm font-medium text-stone-800">
        {label}
        {optional && <span className="text-xs font-normal text-stone-400">Optional</span>}
      </label>
      {children}
      {hint && <div className="text-xs text-stone-500">{hint}</div>}
    </div>
  )
}
