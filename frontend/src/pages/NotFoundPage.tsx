import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-6xl font-bold text-stone-300">404</p>
      <h1 className="mt-4 text-xl font-semibold">This page got a little too unstuck.</h1>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">
        Back to booking
      </Link>
    </div>
  )
}
