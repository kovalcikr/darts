import { Prisma } from '@prisma/client'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/app/lib/db'
import type { PageSearchParams, RouteParams } from '@/app/lib/next-types'
import { deleteMatchAction, deleteTournamentAction, updateMatchAction, updateTournamentAction } from '../../actions'
import { isAdminAuthenticated } from '../../auth'
import ConfirmSubmitButton from '../../ConfirmSubmitButton'
import {
  ActionButton,
  ActionLink,
  EditDisclosure,
  EmptyState,
  MessageBanner,
  SectionShell,
  TextField,
} from '../../ui'

export const dynamic = 'force-dynamic'

type TournamentDetailSearchParams = {
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

export default async function AdminTournamentPage({
  params,
  searchParams,
}: {
  params: RouteParams<{ id: string }>
  searchParams: PageSearchParams<TournamentDetailSearchParams>
}) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin?error=Please+log+in+again.')
  }

  const { id } = await params
  const resolvedSearchParams = await searchParams
  const query = readSearchParam(resolvedSearchParams.q).trim()
  const notice = readSearchParam(resolvedSearchParams.notice).trim()
  const error = readSearchParam(resolvedSearchParams.error).trim()
  const returnTo = createReturnTo(`/admin/tournaments/${encodeURIComponent(id)}`, query)
  const stringMode = Prisma.QueryMode.insensitive
  const numericQuery = query ? Number(query) : null
  const parsedNumericQuery = query && Number.isInteger(numericQuery) ? numericQuery : null

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      _count: {
        select: { matches: true },
      },
    },
  })

  if (!tournament) {
    notFound()
  }

  const matchFilters: Prisma.MatchWhereInput[] = [
    { tournamentId: id },
  ]

  if (query) {
    const scopedFilters: Prisma.MatchWhereInput[] = [
      { id: { contains: query, mode: stringMode } },
      { round: { contains: query, mode: stringMode } },
      { playerAId: { contains: query, mode: stringMode } },
      { playerAName: { contains: query, mode: stringMode } },
      { playerBId: { contains: query, mode: stringMode } },
      { playerBName: { contains: query, mode: stringMode } },
      { firstPlayer: { contains: query, mode: stringMode } },
    ]

    if (parsedNumericQuery !== null) {
      scopedFilters.push(
        { runTo: parsedNumericQuery },
        { playerALegs: parsedNumericQuery },
        { playerBlegs: parsedNumericQuery }
      )
    }

    matchFilters.push({ OR: scopedFilters })
  }

  const matches = await prisma.match.findMany({
    where: { AND: matchFilters },
    include: {
      _count: {
        select: { throwsList: true },
      },
    },
    orderBy: [{ round: 'asc' }, { id: 'asc' }],
  })

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.94))] p-8 shadow-2xl shadow-slate-950/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
                Tournament Admin
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                {tournament.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Matches are managed here. Open any match to inspect and edit throws.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>ID: {tournament.id}</span>
                <span>{tournament._count.matches} matches</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin">Back to Tournaments</ActionLink>
              <form action={deleteTournamentAction}>
                <input name="returnTo" type="hidden" value="/admin" />
                <input name="id" type="hidden" value={tournament.id} />
                <ConfirmSubmitButton confirmationMessage={`Delete tournament "${tournament.name}" and all of its matches and throws?`}>
                  Delete Tournament
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <div className="mt-6">
            <EditDisclosure>
              <form action={updateTournamentAction} className="grid gap-4 md:grid-cols-[1fr_auto]">
                <input name="returnTo" type="hidden" value={returnTo} />
                <input name="id" type="hidden" value={tournament.id} />
                <TextField defaultValue={tournament.name} label="Tournament Name" name="name" required />
                <div className="flex items-end">
                  <ActionButton>Save Tournament</ActionButton>
                </div>
              </form>
            </EditDisclosure>
          </div>
        </section>

        {notice ? <MessageBanner message={notice} tone="notice" /> : null}
        {error ? <MessageBanner message={error} tone="error" /> : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <form className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
            <TextField defaultValue={query} label="Search matches" name="q" />
            <ActionButton>Apply Filter</ActionButton>
            <a
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              href={`/admin/tournaments/${encodeURIComponent(id)}`}
            >
              Clear
            </a>
          </form>
        </section>

        <SectionShell
          count={matches.length}
          description="Edit is hidden until you open it. Throws are managed from the match detail screen."
          title="Matches"
        >
          {matches.length === 0 ? <EmptyState>No matches matched the current filter.</EmptyState> : null}

          {matches.map((match) => (
            <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5" key={match.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {match.playerAName} vs {match.playerBName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {match.round} · match {match.id}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <span>Run to {match.runTo}</span>
                    <span>
                      Legs {match.playerALegs}:{match.playerBlegs}
                    </span>
                    <span>{match._count.throwsList} throws</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ActionLink href={`/admin/matches/${encodeURIComponent(match.id)}`} tone="primary">
                    View Throws
                  </ActionLink>
                  <form action={deleteMatchAction}>
                    <input name="returnTo" type="hidden" value={returnTo} />
                    <input name="id" type="hidden" value={match.id} />
                    <ConfirmSubmitButton confirmationMessage={`Delete match "${match.id}" and its throws?`}>
                      Delete Match
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>

              <div className="mt-5">
                <EditDisclosure>
                  <form action={updateMatchAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <input name="returnTo" type="hidden" value={returnTo} />
                    <input name="id" type="hidden" value={match.id} />
                    <TextField defaultValue={match.tournamentId} label="Tournament ID" name="tournamentId" />
                    <TextField defaultValue={match.round} label="Round" name="round" required />
                    <TextField defaultValue={match.playerAId} label="Player A ID" name="playerAId" required />
                    <TextField defaultValue={match.playerAName} label="Player A Name" name="playerAName" required />
                    <TextField defaultValue={match.playerAImage} label="Player A Image" name="playerAImage" required />
                    <TextField defaultValue={match.playerBId} label="Player B ID" name="playerBId" required />
                    <TextField defaultValue={match.playerBName} label="Player B Name" name="playerBName" required />
                    <TextField defaultValue={match.playerBImage} label="Player B Image" name="playerBImage" required />
                    <TextField defaultValue={match.runTo} label="Run To" name="runTo" required type="number" />
                    <TextField
                      defaultValue={match.playerALegs}
                      label="Player A Legs"
                      name="playerALegs"
                      required
                      type="number"
                    />
                    <TextField
                      defaultValue={match.playerBlegs}
                      label="Player B Legs"
                      name="playerBlegs"
                      required
                      type="number"
                    />
                    <TextField defaultValue={match.firstPlayer} label="First Player" name="firstPlayer" />
                    <div className="flex items-end xl:col-span-4">
                      <ActionButton>Save Match</ActionButton>
                    </div>
                  </form>
                </EditDisclosure>
              </div>
            </article>
          ))}
        </SectionShell>
      </div>
    </main>
  )
}
