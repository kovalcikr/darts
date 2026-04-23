import { notFound, redirect } from 'next/navigation'
import prisma from '@/app/lib/db'
import type { PageSearchParams, RouteParams } from '@/app/lib/next-types'
import {
  createThrowAction,
  deleteMatchAction,
  deleteThrowAction,
  updateMatchAction,
  updateThrowAction,
} from '../../actions'
import { isAdminAuthenticated } from '../../auth'
import ConfirmSubmitButton from '../../ConfirmSubmitButton'
import {
  ActionButton,
  ActionLink,
  CheckboxField,
  EditDisclosure,
  EmptyState,
  MessageBanner,
  SectionShell,
  TextField,
} from '../../ui'

export const dynamic = 'force-dynamic'

type MatchDetailSearchParams = {
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

function formatDateInput(value: Date) {
  return value.toISOString()
}

type AdminMatchRecord = {
  id: string
  round: string
  tournamentId: string | null
  tournament: { id: string; name: string } | null
  playerAId: string
  playerAName: string
  playerAImage: string
  playerBId: string
  playerBName: string
  playerBImage: string
  runTo: number
  playerALegs: number
  playerBlegs: number
  firstPlayer: string | null
}

type AdminThrow = {
  id: string
  tournamentId: string
  matchId: string
  leg: number
  playerId: string
  time: Date
  score: number
  darts: number
  doubles: number | null
  checkout: boolean
}

type ThrowCell = {
  playerThrow: AdminThrow
  remainingBefore: number
  remainingAfter: number
  isHighlighted: boolean
}

type LegRow = {
  visit: number
  playerA: ThrowCell | null
  playerB: ThrowCell | null
}

type LegGroup = {
  leg: number
  rows: LegRow[]
  throws: AdminThrow[]
  winnerId: string | null
}

function matchesThrowQuery(playerThrow: AdminThrow, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  if (playerThrow.id.toLowerCase().includes(normalizedQuery)) {
    return true
  }

  if (playerThrow.tournamentId.toLowerCase().includes(normalizedQuery)) {
    return true
  }

  if (playerThrow.playerId.toLowerCase().includes(normalizedQuery)) {
    return true
  }

  const parsedNumber = Number(normalizedQuery)

  if (!Number.isInteger(parsedNumber)) {
    return false
  }

  return [playerThrow.leg, playerThrow.score, playerThrow.darts, playerThrow.doubles].some(
    (value) => value === parsedNumber
  )
}

function getLegGroups(
  throws: AdminThrow[],
  match: Pick<AdminMatchRecord, 'playerAId' | 'playerBId'>,
  matchedThrowIds: Set<string> | null
) {
  const throwsByLeg = new Map<number, AdminThrow[]>()

  for (const playerThrow of throws) {
    const legThrows = throwsByLeg.get(playerThrow.leg) ?? []
    legThrows.push(playerThrow)
    throwsByLeg.set(playerThrow.leg, legThrows)
  }

  return Array.from(throwsByLeg.entries())
    .sort(([leftLeg], [rightLeg]) => leftLeg - rightLeg)
    .map(([leg, legThrows]) => ({
      leg,
      throws: legThrows,
      rows: getLegRows(legThrows, match.playerAId, match.playerBId, matchedThrowIds),
      winnerId: legThrows.find((playerThrow) => playerThrow.checkout)?.playerId ?? null,
    }))
}

function getLegRows(
  legThrows: AdminThrow[],
  playerAId: string,
  playerBId: string,
  matchedThrowIds: Set<string> | null
) {
  const playerAThrows = legThrows.filter((playerThrow) => playerThrow.playerId === playerAId)
  const playerBThrows = legThrows.filter((playerThrow) => playerThrow.playerId === playerBId)
  const rowCount = Math.max(playerAThrows.length, playerBThrows.length)
  const rows: LegRow[] = []
  let remainingA = 501
  let remainingB = 501

  for (let index = 0; index < rowCount; index += 1) {
    const row: LegRow = {
      visit: index + 1,
      playerA: null,
      playerB: null,
    }

    const playerAThrow = playerAThrows[index]

    if (playerAThrow) {
      const remainingBefore = remainingA
      remainingA -= playerAThrow.score
      row.playerA = {
        playerThrow: playerAThrow,
        remainingBefore,
        remainingAfter: remainingA,
        isHighlighted: matchedThrowIds ? matchedThrowIds.has(playerAThrow.id) : false,
      }
    }

    const playerBThrow = playerBThrows[index]

    if (playerBThrow) {
      const remainingBefore = remainingB
      remainingB -= playerBThrow.score
      row.playerB = {
        playerThrow: playerBThrow,
        remainingBefore,
        remainingAfter: remainingB,
        isHighlighted: matchedThrowIds ? matchedThrowIds.has(playerBThrow.id) : false,
      }
    }

    rows.push(row)
  }

  return rows
}

function getPlayerName(match: Pick<AdminMatchRecord, 'playerAId' | 'playerAName' | 'playerBId' | 'playerBName'>, playerId: string) {
  if (playerId === match.playerAId) {
    return match.playerAName
  }

  if (playerId === match.playerBId) {
    return match.playerBName
  }

  return playerId
}

function getOpposingPlayerId(match: Pick<AdminMatchRecord, 'playerAId' | 'playerBId'>, playerId: string | null) {
  if (playerId === match.playerAId) {
    return match.playerBId
  }

  return match.playerAId
}

function getLegToneClass(
  match: Pick<AdminMatchRecord, 'playerAId' | 'playerBId'>,
  winnerId: string | null
) {
  if (winnerId === match.playerAId) {
    return 'border-cyan-400/30 bg-cyan-400/10'
  }

  if (winnerId === match.playerBId) {
    return 'border-rose-400/30 bg-rose-400/10'
  }

  return 'border-slate-800 bg-slate-950/40'
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string
  name: string
  defaultValue: string
  options: Array<{ label: string; value: string }>
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
      <span>{label}</span>
      <select
        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal tracking-normal text-slate-100 outline-none transition focus:border-cyan-400"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function InsertThrowDisclosure({
  title,
  subtitle,
  returnTo,
  match,
  leg,
  defaultPlayerId,
  defaultScore,
  defaultDarts = 3,
  insertBeforeId,
  insertAfterId,
}: {
  title: string
  subtitle: string
  returnTo: string
  match: Pick<
    AdminMatchRecord,
    'id' | 'tournamentId' | 'playerAId' | 'playerAName' | 'playerBId' | 'playerBName'
  >
  leg: number
  defaultPlayerId: string
  defaultScore?: number
  defaultDarts?: number
  insertBeforeId?: string
  insertAfterId?: string
}) {
  const tournamentId = match.tournamentId ?? ''

  return (
    <details className="group rounded-xl border border-slate-800 bg-slate-950/60">
      <summary className="cursor-pointer list-none rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-900">
        {title}
      </summary>
      <div className="border-t border-slate-800 px-4 py-4">
        <p className="text-sm text-slate-400">{subtitle}</p>
        <form action={createThrowAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input name="returnTo" type="hidden" value={returnTo} />
          <input name="tournamentId" type="hidden" value={tournamentId} />
          <input name="matchId" type="hidden" value={match.id} />
          <input name="leg" type="hidden" value={String(leg)} />
          {insertBeforeId ? <input name="insertBeforeId" type="hidden" value={insertBeforeId} /> : null}
          {insertAfterId ? <input name="insertAfterId" type="hidden" value={insertAfterId} /> : null}

          <SelectField
            defaultValue={defaultPlayerId}
            label="Player"
            name="playerId"
            options={[
              { label: match.playerAName, value: match.playerAId },
              { label: match.playerBName, value: match.playerBId },
            ]}
          />
          <TextField
            defaultValue={defaultScore}
            label="Score"
            name="score"
            required
            type="number"
          />
          <TextField
            defaultValue={defaultDarts}
            label="Darts"
            name="darts"
            required
            type="number"
          />
          <TextField defaultValue="" label="Doubles" name="doubles" type="number" />
          <div className="flex items-end">
            <CheckboxField defaultChecked={false} label="Checkout" name="checkout" />
          </div>
          <div className="flex items-end md:col-span-2 xl:col-span-5">
            <ActionButton>Insert Throw</ActionButton>
          </div>
        </form>
      </div>
    </details>
  )
}

function ThrowCellCard({
  cell,
  match,
  returnTo,
}: {
  cell: ThrowCell | null
  match: Pick<
    AdminMatchRecord,
    | 'id'
    | 'tournamentId'
    | 'playerAId'
    | 'playerAName'
    | 'playerBId'
    | 'playerBName'
  >
  returnTo: string
}) {
  if (!cell) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-4 text-sm text-slate-500">
        No throw recorded for this visit.
      </div>
    )
  }

  const { playerThrow } = cell
  const nextPlayerId = getOpposingPlayerId(match, playerThrow.playerId)

  return (
    <div
      className={`rounded-2xl border p-4 ${
        cell.isHighlighted
          ? 'border-cyan-400/50 bg-cyan-400/10 shadow-lg shadow-cyan-950/20'
          : 'border-slate-800 bg-slate-950/60'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {getPlayerName(match, playerThrow.playerId)}
          </p>
          <div className="mt-2 flex items-end gap-3">
            <h3 className="text-3xl font-semibold text-white">{playerThrow.score}</h3>
            {playerThrow.checkout ? (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Checkout
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {cell.remainingBefore} left to {Math.max(cell.remainingAfter, 0)} left
          </p>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.2em] text-slate-500">
          <p>{playerThrow.darts} darts</p>
          <p>{playerThrow.doubles !== null ? `D${playerThrow.doubles}` : 'No double'}</p>
          <p className="mt-2 normal-case tracking-normal text-slate-400">{playerThrow.time.toISOString()}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <InsertThrowDisclosure
          defaultPlayerId={nextPlayerId}
          defaultScore={100}
          insertBeforeId={playerThrow.id}
          leg={playerThrow.leg}
          match={match}
          returnTo={returnTo}
          subtitle="Insert a throw immediately before this visit. The timestamp is placed automatically."
          title="Insert Before"
        />
        <InsertThrowDisclosure
          defaultPlayerId={nextPlayerId}
          defaultScore={100}
          insertAfterId={playerThrow.id}
          leg={playerThrow.leg}
          match={match}
          returnTo={returnTo}
          subtitle="Insert a throw immediately after this visit. The timestamp is placed automatically."
          title="Insert After"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <form action={deleteThrowAction}>
          <input name="returnTo" type="hidden" value={returnTo} />
          <input name="id" type="hidden" value={playerThrow.id} />
          <ConfirmSubmitButton confirmationMessage={`Delete throw "${playerThrow.id}"?`}>
            Delete Throw
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="mt-4">
        <EditDisclosure>
          <form action={updateThrowAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input name="returnTo" type="hidden" value={returnTo} />
            <input name="id" type="hidden" value={playerThrow.id} />
            <TextField
              defaultValue={playerThrow.tournamentId}
              label="Tournament ID"
              name="tournamentId"
              required
            />
            <TextField defaultValue={playerThrow.matchId} label="Match ID" name="matchId" required />
            <TextField defaultValue={playerThrow.leg} label="Leg" name="leg" required type="number" />
            <TextField defaultValue={playerThrow.playerId} label="Player ID" name="playerId" required />
            <TextField defaultValue={formatDateInput(playerThrow.time)} label="Time" name="time" required />
            <TextField defaultValue={playerThrow.score} label="Score" name="score" required type="number" />
            <TextField defaultValue={playerThrow.darts} label="Darts" name="darts" required type="number" />
            <TextField defaultValue={playerThrow.doubles} label="Doubles" name="doubles" type="number" />
            <div className="flex items-end">
              <CheckboxField defaultChecked={playerThrow.checkout} label="Checkout" name="checkout" />
            </div>
            <div className="flex items-end xl:col-span-4">
              <ActionButton>Save Throw</ActionButton>
            </div>
          </form>
        </EditDisclosure>
      </div>
    </div>
  )
}

export default async function AdminMatchPage({
  params,
  searchParams,
}: {
  params: RouteParams<{ id: string }>
  searchParams: PageSearchParams<MatchDetailSearchParams>
}) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin?error=Please+log+in+again.')
  }

  const { id } = await params
  const resolvedSearchParams = await searchParams
  const query = readSearchParam(resolvedSearchParams.q).trim()
  const notice = readSearchParam(resolvedSearchParams.notice).trim()
  const error = readSearchParam(resolvedSearchParams.error).trim()
  const returnTo = createReturnTo(`/admin/matches/${encodeURIComponent(id)}`, query)

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  }) as AdminMatchRecord | null

  if (!match) {
    notFound()
  }

  const allThrows = (await prisma.playerThrow.findMany({
    where: { matchId: id },
    orderBy: [{ leg: 'asc' }, { time: 'asc' }, { id: 'asc' }],
  })) as AdminThrow[]
  const matchedThrows = query ? allThrows.filter((playerThrow) => matchesThrowQuery(playerThrow, query)) : allThrows
  const matchedThrowIds = query ? new Set(matchedThrows.map((playerThrow) => playerThrow.id)) : null
  const allLegGroups = getLegGroups(allThrows, match, matchedThrowIds)
  const legGroups = query
    ? allLegGroups.filter((legGroup) =>
        legGroup.throws.some((playerThrow) => matchedThrowIds?.has(playerThrow.id))
      )
    : allLegGroups
  const nextLegNumber = Math.max(...allLegGroups.map((legGroup) => legGroup.leg), 0) + 1

  const deleteMatchReturnTo = match.tournamentId
    ? `/admin/tournaments/${encodeURIComponent(match.tournamentId)}`
    : '/admin'

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.94))] p-8 shadow-2xl shadow-slate-950/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
                Match Admin
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                {match.playerAName} vs {match.playerBName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Throws are grouped leg by leg, shown side by side by player, and every insert action places the throw in order automatically.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Match {match.id}</span>
                <span>{match.round}</span>
                <span>
                  Tournament {match.tournament?.name ?? match.tournamentId ?? 'none'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink
                href={
                  match.tournamentId
                    ? `/admin/tournaments/${encodeURIComponent(match.tournamentId)}`
                    : '/admin'
                }
              >
                Back to Matches
              </ActionLink>
              <form action={deleteMatchAction}>
                <input name="returnTo" type="hidden" value={deleteMatchReturnTo} />
                <input name="id" type="hidden" value={match.id} />
                <ConfirmSubmitButton confirmationMessage={`Delete match "${match.id}" and all of its throws?`}>
                  Delete Match
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <div className="mt-6">
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
        </section>

        {notice ? <MessageBanner message={notice} tone="notice" /> : null}
        {error ? <MessageBanner message={error} tone="error" /> : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <form className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
            <TextField defaultValue={query} label="Search throws" name="q" />
            <ActionButton>Apply Filter</ActionButton>
            <a
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              href={`/admin/matches/${encodeURIComponent(id)}`}
            >
              Clear
            </a>
          </form>
        </section>

        <SectionShell
          count={matchedThrows.length}
          description="Leg view mirrors the darts screen, while edit stays hidden until you open it."
          title="Throws"
        >
          {query ? (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100">
              Showing {matchedThrows.length} matching throws across {legGroups.length} legs.
            </div>
          ) : null}

          {legGroups.length === 0 ? (
            <EmptyState>
              {allThrows.length === 0
                ? 'No throws exist for this match yet. Start with the first leg below.'
                : 'No throws matched the current filter.'}
            </EmptyState>
          ) : null}

          {legGroups.map((legGroup) => {
            const firstThrow = legGroup.throws[0]
            const lastThrow = legGroup.throws[legGroup.throws.length - 1]

            return (
              <article
                className={`rounded-3xl border p-6 shadow-2xl shadow-slate-950/20 ${getLegToneClass(
                  match,
                  legGroup.winnerId
                )}`}
                key={legGroup.leg}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                      Leg {legGroup.leg}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">
                      {legGroup.winnerId
                        ? `${getPlayerName(match, legGroup.winnerId)} finished this leg`
                        : 'Leg in progress'}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {legGroup.throws.length} throws recorded in this leg.
                    </p>
                  </div>

                  <div className="grid gap-3 xl:min-w-[34rem] xl:grid-cols-2">
                    <InsertThrowDisclosure
                      defaultPlayerId={match.firstPlayer ?? match.playerAId}
                      defaultScore={100}
                      insertBeforeId={firstThrow?.id}
                      leg={legGroup.leg}
                      match={match}
                      returnTo={returnTo}
                      subtitle="Add a throw at the start of this leg without editing timestamps manually."
                      title="Insert At Leg Start"
                    />
                    <InsertThrowDisclosure
                      defaultPlayerId={getOpposingPlayerId(match, lastThrow?.playerId ?? match.playerAId)}
                      defaultScore={100}
                      insertAfterId={lastThrow?.id}
                      leg={legGroup.leg}
                      match={match}
                      returnTo={returnTo}
                      subtitle="Append the next throw to the end of this leg."
                      title="Append To Leg End"
                    />
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-3 py-2">Visit</th>
                        <th className="px-3 py-2">{match.playerAName}</th>
                        <th className="px-3 py-2">{match.playerBName}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {legGroup.rows.map((row) => (
                        <tr key={`${legGroup.leg}-${row.visit}`} className="align-top">
                          <td className="px-3 py-2 text-sm font-semibold text-slate-400">Visit {row.visit}</td>
                          <td className="px-3 py-2">
                            <ThrowCellCard cell={row.playerA} match={match} returnTo={returnTo} />
                          </td>
                          <td className="px-3 py-2">
                            <ThrowCellCard cell={row.playerB} match={match} returnTo={returnTo} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            )
          })}

          <article className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              New Leg
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Start another leg</h3>
            <p className="mt-2 text-sm text-slate-400">
              Use this when the next throws belong in a fresh leg rather than inserted into an existing one.
            </p>
            <div className="mt-5">
              <InsertThrowDisclosure
                defaultPlayerId={match.firstPlayer ?? match.playerAId}
                defaultScore={100}
                leg={nextLegNumber}
                match={match}
                returnTo={returnTo}
                subtitle={`Creates the opening throw for leg ${nextLegNumber}.`}
                title={`Start Leg ${nextLegNumber}`}
              />
            </div>
          </article>
        </SectionShell>
      </div>
    </main>
  )
}
