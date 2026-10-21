import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, FileText, LoaderCircle } from 'lucide-react'
import { api } from '../lib/api'
import type { AiBrief } from '../lib/types'

interface SessionBriefProps {
  bookingId: string
  brief: AiBrief | null
}

/** The mentor's AI prep notes for one booking, or a button to create them if they don't exist yet. */
export default function SessionBrief({ bookingId, brief }: SessionBriefProps) {
  const queryClient = useQueryClient()

  // Usually the brief is created when the mentee sees their confirmation page.
  // This button covers the cases where that didn't happen (page closed early, AI was down).
  const generateMutation = useMutation({
    mutationFn: () => api.getOrCreateBrief(bookingId),
    onSuccess: (result) => {
      if (result.aiBrief) queryClient.invalidateQueries({ queryKey: ['mentor-slots'] })
    },
  })

  if (!brief) {
    const aiUnavailable = generateMutation.isSuccess && !generateMutation.data.aiBrief
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-stone-300 hover:bg-stone-50 disabled:opacity-60"
        >
          {generateMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <FileText className="size-4" aria-hidden />}
          {generateMutation.isPending ? 'Preparing…' : 'Prepare session brief'}
        </button>
        {(aiUnavailable || generateMutation.isError) && (
          <span className="text-sm text-stone-500">The AI isn’t available right now. Try again later.</span>
        )}
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold">Session brief</h4>
        <span className="text-xs text-stone-500">AI-generated</span>
      </div>

      <p className="mt-2 text-sm text-stone-800">{brief.summary}</p>

      {brief.missingInfo && (
        <p className="mt-3 flex gap-2 text-sm text-amber-800">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {brief.missingInfo}
        </p>
      )}

      <p className="mt-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">Questions to open with</p>
      <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-sm text-stone-700">
        {brief.openingQuestions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ol>
    </section>
  )
}
