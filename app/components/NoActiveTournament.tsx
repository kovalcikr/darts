import Link from 'next/link'

export default function NoActiveTournament({
  title = 'No active tournament',
  message = 'Set an active tournament in admin before opening this page.',
}: {
  title?: string
  message?: string
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
        <div className="mt-6">
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
            href="/admin"
          >
            Open Admin
          </Link>
        </div>
      </section>
    </main>
  )
}
