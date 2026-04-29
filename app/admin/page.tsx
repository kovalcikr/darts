import prisma from '@/app/lib/db'
import { getActiveTournament } from '@/app/lib/active-tournament'
import { formatTournamentEventDate } from '@/app/lib/tournament-metadata'
import type { PageSearchParams } from '@/app/lib/next-types'
import {
  clearActiveTournamentAction,
  createActiveTournamentAction,
  deleteTournamentAction,
  loginAdminAction,
  logoutAdminAction,
  setActiveTournamentAction,
  toggleTournamentGlobalStatsAction,
  updateTournamentAction,
} from './actions'
import {
  ADMIN_PASSWORD_ENV,
  ADMIN_USERNAME_ENV,
  isAdminAuthenticated,
  isAdminConfigured,
} from './auth'
import ConfirmSubmitButton from './ConfirmSubmitButton'
import {
  ActionButton,
  ActionLink,
  CheckboxField,
  EditDisclosure,
  EmptyState,
  MessageBanner,
  SectionShell,
  TextField,
} from './ui'

export const dynamic = 'force-dynamic'

type AdminSearchParams = {
  q?: string | string[]
  notice?: string | string[]
  error?: string | string[]
}

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function createReturnTo(pathname: string, query: string) {
  return query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname
}

function formatDateInputValue(value: Date | null) {
  if (!value) {
    return ''
  }

  return value.toISOString().slice(0, 10)
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: PageSearchParams<AdminSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const query = readSearchParam(resolvedSearchParams.q).trim()
  const notice = readSearchParam(resolvedSearchParams.notice).trim()
  const error = readSearchParam(resolvedSearchParams.error).trim()
  const returnTo = createReturnTo('/admin', query)
  const adminConfigured = isAdminConfigured()
  const authenticated = await isAdminAuthenticated()

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <div className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.94))] p-8 shadow-2xl shadow-slate-950/40">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Admin</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Darts control room</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Manage tournaments from the secured admin area. Matches and throws are available on
              their own drill-down screens after login.
            </p>
          </div>

          {notice ? <MessageBanner message={notice} tone="notice" /> : null}
          {error ? <MessageBanner message={error} tone="error" /> : null}

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-xl font-semibold text-white">Login</h2>
              <p className="mt-2 text-sm text-slate-400">
                Use the credentials stored in <code>{ADMIN_USERNAME_ENV}</code> and{' '}
                <code>{ADMIN_PASSWORD_ENV}</code>.
              </p>
              <form action={loginAdminAction} className="mt-6 grid gap-4">
                <input name="returnTo" type="hidden" value={returnTo} />
                <TextField label="Username" name="username" required />
                <TextField label="Password" name="password" required type="password" />
                <div className="pt-2">
                  <ActionButton>Open Admin</ActionButton>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-xl font-semibold text-white">Configuration</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>
                  Status:{' '}
                  <span className={adminConfigured ? 'text-emerald-300' : 'text-rose-300'}>
                    {adminConfigured ? 'ready' : 'missing credentials'}
                  </span>
                </p>
                <p>
                  Required env vars: <code>{ADMIN_USERNAME_ENV}</code>,{' '}
                  <code>{ADMIN_PASSWORD_ENV}</code>
                </p>
                <p className="text-slate-400">
                  Credentials are checked server-side and stored in an HTTP-only session cookie
                  after login.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    )
  }

  const tournamentWhere = query
    ? {
        OR: [
          { id: { contains: query, mode: 'insensitive' as const } },
          { name: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  const [tournaments, throwCountsByTournament, activeTournament] = await Promise.all([
    prisma.tournament.findMany({
      where: tournamentWhere,
      include: {
        _count: {
          select: { matches: true },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    }),
    prisma.playerThrow.groupBy({
      by: ['tournamentId'],
      _count: {
        id: true,
      },
    }),
    getActiveTournament(),
  ])

  const throwCountMap = new Map<string, number>(
    throwCountsByTournament.map((item) => [item.tournamentId, item._count.id])
  )
  const activeTournamentId = activeTournament?.id ?? null

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
                Tournament control room
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Start from tournaments here. Click into a tournament to manage matches, then open a
                match to inspect and edit its throws.
              </p>
            </div>

            <form action={logoutAdminAction} className="self-start lg:self-auto">
              <input name="returnTo" type="hidden" value={returnTo} />
              <ActionButton tone="muted">Log out</ActionButton>
            </form>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-5">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Tournaments</div>
              <div className="mt-2 text-3xl font-semibold text-white">{tournaments.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-5">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Active</div>
              <div className="mt-2 truncate text-sm font-semibold text-white">
                {activeTournament?.name ?? 'Not selected'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-5">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Filter</div>
              <div className="mt-2 text-sm text-slate-200">{query || 'No active filter'}</div>
            </div>
          </div>
        </section>

        {notice ? <MessageBanner message={notice} tone="notice" /> : null}
        {error ? <MessageBanner message={error} tone="error" /> : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Active Tournament</h2>
              {activeTournament ? (
                <div className="mt-3 space-y-1 text-sm text-slate-300">
                  <p className="font-semibold text-cyan-100">{activeTournament.name}</p>
                  <p className="text-slate-400">ID: {activeTournament.id}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  No active tournament is selected for fixed table and dashboard URLs.
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionLink href="/dashboard" tone="primary">
                  Open Dashboard
                </ActionLink>
                {activeTournament ? (
                  <ActionLink href="/tables">
                    Open Tables
                  </ActionLink>
                ) : null}
                {activeTournament ? (
                  <form action={clearActiveTournamentAction}>
                    <input name="returnTo" type="hidden" value={returnTo} />
                    <ActionButton tone="muted">Clear Active</ActionButton>
                  </form>
                ) : null}
              </div>
            </div>

            <form action={createActiveTournamentAction} className="grid w-full gap-4 lg:max-w-md">
              <input name="returnTo" type="hidden" value={returnTo} />
              <TextField label="Tournament ID" name="tournamentId" required />
              <div>
                <ActionButton>Create and Set Active</ActionButton>
              </div>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <form className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
            <TextField defaultValue={query} label="Search tournaments" name="q" />
            <ActionButton>Apply Filter</ActionButton>
            <a
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              href="/admin"
            >
              Clear
            </a>
          </form>
        </section>

        <SectionShell
          count={tournaments.length}
          description="Only tournaments are listed here. Open a tournament to manage its matches."
          title="Tournaments"
        >
          {tournaments.length === 0 ? (
            <EmptyState>No tournaments matched the current filter.</EmptyState>
          ) : null}

          {tournaments.map((tournament) => {
            const isActiveTournament = tournament.id === activeTournamentId

            return (
            <article
              className={`rounded-2xl border p-5 ${
                isActiveTournament
                  ? 'border-cyan-400/60 bg-cyan-400/10'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
              key={tournament.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{tournament.name}</h3>
                    {isActiveTournament ? (
                      <span className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">ID: {tournament.id}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span>Season: {tournament.season ?? 'unknown'}</span>
                    <span>Date: {formatTournamentEventDate(tournament.eventDate) ?? 'unknown'}</span>
                    <span>{tournament.includeInGlobalStats ? 'Included in global stats' : 'Excluded from global stats'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <span>{tournament._count.matches} matches</span>
                    <span>{throwCountMap.get(tournament.id) ?? 0} throws</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ActionLink href={`/admin/tournaments/${encodeURIComponent(tournament.id)}`} tone="primary">
                    View Matches
                  </ActionLink>
                  {!isActiveTournament ? (
                    <form action={setActiveTournamentAction}>
                      <input name="returnTo" type="hidden" value={returnTo} />
                      <input name="tournamentId" type="hidden" value={tournament.id} />
                      <ActionButton tone="muted">Set Active</ActionButton>
                    </form>
                  ) : null}
                  <form action={toggleTournamentGlobalStatsAction}>
                    <input name="returnTo" type="hidden" value={returnTo} />
                    <input name="id" type="hidden" value={tournament.id} />
                    {tournament.includeInGlobalStats ? null : <input name="includeInGlobalStats" type="hidden" value="on" />}
                    <ActionButton tone={tournament.includeInGlobalStats ? 'muted' : 'primary'}>
                      {tournament.includeInGlobalStats ? 'Exclude from stats' : 'Include to stats'}
                    </ActionButton>
                  </form>
                  <form action={deleteTournamentAction}>
                    <input name="returnTo" type="hidden" value={returnTo} />
                    <input name="id" type="hidden" value={tournament.id} />
                    <ConfirmSubmitButton confirmationMessage={`Delete tournament "${tournament.name}" and all of its matches and throws?`}>
                      Delete Tournament
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>

              <div className="mt-5">
                <EditDisclosure>
                  <form action={updateTournamentAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_0.7fr_0.9fr_1.2fr_auto]">
                    <input name="returnTo" type="hidden" value={returnTo} />
                    <input name="id" type="hidden" value={tournament.id} />
                    <TextField defaultValue={tournament.name} label="Tournament Name" name="name" required />
                    <TextField defaultValue={tournament.season} label="Season" name="season" type="number" />
                    <TextField
                      defaultValue={formatDateInputValue(tournament.eventDate)}
                      label="Tournament Date"
                      name="eventDate"
                      type="date"
                    />
                    <div className="flex items-end">
                      <CheckboxField
                        defaultChecked={tournament.includeInGlobalStats}
                        label="Include in global stats"
                        name="includeInGlobalStats"
                      />
                    </div>
                    <div className="flex items-end">
                      <ActionButton>Save Tournament</ActionButton>
                    </div>
                  </form>
                </EditDisclosure>
              </div>
            </article>
          )})}
        </SectionShell>
      </div>
    </main>
  )
}
