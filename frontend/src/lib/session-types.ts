import { Bug, GitPullRequest, MessagesSquare, type LucideIcon } from 'lucide-react'
import type { SessionType } from './types'

interface SessionTypeInfo {
  label: string
  description: string
  icon: LucideIcon
  defaultDuration: number
  // Booking form copy, tailored to each type of session
  topicLabel: string
  topicPlaceholder: string
  linkPlaceholder: string
  // Shown on the confirmation page
  prepTips: string[]
  // Full class names written out so Tailwind can find them when it scans the code
  styles: { badge: string; dot: string; icon: string }
}

export const SESSION_TYPES: Record<SessionType, SessionTypeInfo> = {
  code_review: {
    label: 'Code review',
    description: 'Feedback on a PR or a piece of code before you ship it.',
    icon: GitPullRequest,
    defaultDuration: 30,
    topicLabel: 'What should we review?',
    topicPlaceholder: 'e.g. My first PR adding auth to our Express app. I’m unsure about how I handle errors and tokens.',
    linkPlaceholder: 'https://github.com/you/repo/pull/12',
    prepTips: [
      'Make sure the PR or repo link is accessible (public, or Sam has been invited).',
      'Write down the 1–2 parts you’re least confident about.',
      'Have the project running locally in case we want to try changes.',
    ],
    styles: {
      badge: 'bg-violet-50 text-violet-700 ring-violet-200',
      dot: 'bg-violet-500',
      icon: 'bg-violet-100 text-violet-700',
    },
  },
  debugging: {
    label: 'Debugging',
    description: 'Stuck on an error? We’ll track it down together.',
    icon: Bug,
    defaultDuration: 45,
    topicLabel: 'What’s broken, and what have you tried?',
    topicPlaceholder: 'e.g. My useEffect fetches data twice and the list flickers. I tried adding an empty dependency array but…',
    linkPlaceholder: 'https://github.com/you/repo (optional)',
    prepTips: [
      'Copy the full error message and stack trace somewhere handy.',
      'Note the exact steps that make the bug happen.',
      'List what you already tried, so we don’t repeat it.',
    ],
    styles: {
      badge: 'bg-rose-50 text-rose-700 ring-rose-200',
      dot: 'bg-rose-500',
      icon: 'bg-rose-100 text-rose-700',
    },
  },
  career_chat: {
    label: 'Career chat',
    description: 'Interviews, learning paths, or landing your first role.',
    icon: MessagesSquare,
    defaultDuration: 20,
    topicLabel: 'What would you like to talk about?',
    topicPlaceholder: 'e.g. I’m preparing for my first frontend internship interviews and don’t know what to focus on.',
    linkPlaceholder: 'Your CV, portfolio or LinkedIn (optional)',
    prepTips: [
      'Write down your top 3 questions.',
      'Share your CV or portfolio link if you’d like feedback on it.',
      'Think about where you’d like to be in a year.',
    ],
    styles: {
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      dot: 'bg-emerald-500',
      icon: 'bg-emerald-100 text-emerald-700',
    },
  },
}

export const SESSION_TYPE_KEYS = Object.keys(SESSION_TYPES) as SessionType[]
