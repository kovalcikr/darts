import prisma from '@/app/lib/db'
import { formatTournamentEventDate } from '@/app/lib/tournament-metadata'
import { isAdminAuthenticated } from '../auth'
import { restoreTournamentAction } from '../actions'
import { ActionButton, ActionLink, EmptyState, MessageBanner, SectionShell } from '../ui'

export const dynamic = 'force-dynamic'

export default async function DeletedTournamentsPage() {
  if (!(await isAdminAuthenticated())) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-400">Please log in.</p>
        </div>
      </main>
    )
  }

  const returnTo = '/admin/deleted'
  const deletedTournaments = await prisma.tournamentAudit.findMany({
    orderBy: [{ deletedAt: 'desc' }, { tournamentId: 'asc' }],
  })

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.94))] p-8 shadow-2xl shadow-slate-950/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
                Admin
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                Deleted Tournaments
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Tournaments that have been soft-deleted. Use restore to recover them.
              </p>
            </div>

            <ActionLink href="/admin">Back to Tournaments</ActionLink>
          </div>
        </section>

        <SectionShell
          count={deletedTournaments.length}
          description="These tournaments were deleted but can be restored. Restoration recreates all matches and throws."
          title="Deleted Tournaments"
        >
          {deletedTournaments.length === 0 ? (
            <EmptyState>No deleted tournaments found.</EmptyState>
          ) : null}

          {deletedTournaments.map((tournament) => (
            <article
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5"
              key={tournament.tournamentId}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{tournament.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">ID: {tournament.tournamentId}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span>Season: {tournament.season ?? 'unknown'}</span>
                    <span>Date: {formatTournamentEventDate(tournament.eventDate) ?? 'unknown'}</span>
                    <span>
                      {tournament.includeInGlobalStats ? 'Included in global stats' : 'Excluded from global stats'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Deleted: {tournament.deletedAt.toISOString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <form action={restoreTournamentAction}>
                    <input name="returnTo" type="hidden" value={returnTo} />
                    <input name="tournamentId" type="hidden" value={tournament.tournamentId} />
                    <ActionButton tone="success">Restore Tournament</ActionButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </SectionShell>
      </div>
    </main>
  )
}