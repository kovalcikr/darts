import Link from 'next/link'

export default function TableRemoved({ slot }: { slot?: number }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
        <h1 className="text-2xl font-semibold text-white">
          {slot === undefined ? 'Table removed' : `Table ${slot} removed`}
        </h1>
        <Link
          className="mt-4 inline-block text-sm font-semibold text-sky-300 hover:text-sky-200"
          href="/tables"
        >
          Tables
        </Link>
      </section>
    </main>
  )
}
