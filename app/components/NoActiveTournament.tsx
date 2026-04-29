'use client'

import { useEffect } from 'react'

export default function NoActiveTournament({
  title = 'No active tournament',
}: {
  title?: string
}) {
  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      window.location.reload()
    }, 5_000)

    return () => window.clearInterval(refreshInterval)
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
      </section>
    </main>
  )
}
