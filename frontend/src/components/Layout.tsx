import type { ReactNode } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="font-display text-xl font-bold tracking-tight">Unstuck</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavItem to="/" end>
              Book a session
            </NavItem>
            <NavItem to="/mentor">Mentor</NavItem>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
        Unstuck · 1:1 help from a senior developer
      </footer>
    </div>
  )
}

function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 transition-colors ${
          isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
