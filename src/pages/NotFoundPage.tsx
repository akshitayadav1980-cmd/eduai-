import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
      <h1 className="text-6xl font-bold text-slate-600">404</h1>
      <p className="text-lg text-slate-400">Page not found.</p>
      <Link
        to="/"
        className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Go Home
      </Link>
    </div>
  )
}
