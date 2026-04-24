import prisma from "@/app/lib/db"
import { getPlayers } from "@/app/lib/players"
import { getTournaments } from "@/app/lib/tournament"
import { randomUUID } from "crypto"
import Link from "next/link"
import type { PageSearchParams, RouteParams } from "@/app/lib/next-types"
import StatsPageShell from "@/app/components/StatsPageShell"
import { withSeason } from "@/app/lib/season-links"

export default async function Player({
    params,
    searchParams,
}: {
    params: RouteParams<{ id: string }>
    searchParams: PageSearchParams
}) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;

    const season = resolvedSearchParams.season as string || "2026";
    const tournamentIds = await getTournaments(season)
    const players = await getPlayers(tournamentIds)

    const matches = await prisma.match.findMany({
        where: {
            AND: [
                {
                    tournamentId: {
                        in: tournamentIds
                    },
                },
                {
                    OR: [
                        {
                            playerAId: id
                        },
                        {
                            playerBId: id
                        }
                    ]
                }
            ]
        }
    })

    let playerLegs = 0;
    let wonLegs = 0;
    let matchesWon = 0;
    const playerTournaments = new Set();
    const playerOppornents = new Map();
    matches.forEach(match => {
        playerTournaments.add(match.tournamentId);
        const isPlayerA = match.playerAId === id;
        const opponentId = isPlayerA ? match.playerBId : match.playerAId;

        playerOppornents.set(opponentId, (playerOppornents.get(opponentId) || 0) + 1);

        playerLegs += match.playerALegs + match.playerBlegs;
        wonLegs += isPlayerA ? match.playerALegs : match.playerBlegs;

        if ((isPlayerA && match.playerALegs > match.playerBlegs) || (!isPlayerA && match.playerBlegs > match.playerALegs)) {
            matchesWon++;
        }
    })
    const frequentOpponents = Array.from(playerOppornents).sort((a, b) => b[1] - a[1]);

    const throws = await prisma.playerThrow.aggregate({
        where: {
            tournamentId: { in: tournamentIds },
            playerId: id
        },
        _count: { id: true },
        _sum: { score: true, darts: true },
        _max: { score: true }
    })

    const throwsOver80 = await prisma.playerThrow.groupBy({
        by: ["score"],
        where: {
            playerId: id,
            tournamentId: { in: tournamentIds },
            score: { gte: 80 }
        },
        _count: { score: true }
    })

    const checkouts = await prisma.playerThrow.findMany({
        where: {
            checkout: true,
            playerId: id,
            tournamentId: { in: tournamentIds }
        },
        orderBy: { score: "desc" }
    })

    const legs = await prisma.playerThrow.groupBy({
        by: ["tournamentId", "matchId", "leg"],
        where: {
            playerId: id,
            tournamentId: { in: tournamentIds }
        },
        _sum: { score: true, darts: true },
        having: { score: { _sum: { equals: 501 } } }
    })
    const legsSorted = legs.sort((a, b) => (a._sum?.darts || Infinity) - (b._sum?.darts || Infinity))

    const matchSums = await prisma.playerThrow.groupBy({
        by: ["tournamentId", "matchId"],
        where: {
            playerId: id,
            tournamentId: { in: tournamentIds }
        },
        _sum: { score: true, darts: true }
    })
    const matchAverages = matchSums.map(match => (match._sum.score || 0) / (match._sum.darts || 1) * 3)
    const bestAvg = matchAverages.sort((a, b) => b - a);

    function StatCard({ title, children }) {
        return (
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 ring-1 ring-white/10">
                <h2 className="text-lg font-bold text-sky-400 uppercase tracking-wider mb-4">{title}</h2>
                <div className="space-y-3">{children}</div>
            </div>
        )
    }

    function StatRow({ label, value }) {
        return (
            <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-gray-400 font-medium">{label}</span>
                <span className="text-white font-semibold text-lg">{value}</span>
            </div>
        )
    }

    function StatWithNames({ name, value, playerIds }) {
        return (
            <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                <span className="text-gray-400 font-medium">{name}</span>
                <div className="flex items-center gap-x-2">
                    <span className="text-white font-semibold text-lg">{value}</span>
                    {playerIds.map(pid => (
                        <Link key={randomUUID()} href={withSeason(`/players/${pid}`, season)}>
                            <div className="rounded-full bg-gray-600 px-3 py-1 text-sm font-semibold text-gray-200 hover:bg-gray-500 transition-colors">{players[pid]}</div>
                        </Link>
                    ))}
                </div>
            </div>
        )
    }

    function CategoryGrid({ title, data }) {
        return (
            <StatCard title={title}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {data.map(item => (
                        <div key={item.name} className="bg-gray-700/50 p-3 rounded-lg text-center">
                            <div className="text-sm text-gray-400">{item.name}</div>
                            <div className="text-xl font-bold text-white mt-1">{item.value}</div>
                        </div>
                    ))}
                </div>
            </StatCard>
        )
    }

    const averagesData = [
        { name: "45+", value: countAverages(matchAverages, 45, 50) },
        { name: "50+", value: countAverages(matchAverages, 50, 55) },
        { name: "55+", value: countAverages(matchAverages, 55, 60) },
        { name: "60+", value: countAverages(matchAverages, 60, 65) },
        { name: "65+", value: countAverages(matchAverages, 65, 70) },
        { name: "70+", value: countAverages(matchAverages, 70, 75) },
        { name: "75+", value: countAverages(matchAverages, 75, 80) },
        { name: "80+", value: countAverages(matchAverages, 80, 180) },
    ].reverse();

    const scoresData = [
        { name: "80+", value: countThrows(throwsOver80, 80, 100) },
        { name: "100+", value: countThrows(throwsOver80, 100, 133) },
        { name: "133+", value: countThrows(throwsOver80, 133, 151) },
        { name: "151+", value: countThrows(throwsOver80, 151, 171) },
        { name: "171+", value: countThrows(throwsOver80, 171, 180) },
        { name: "180", value: countThrows(throwsOver80, 180, 181) },
    ].reverse();

    const checkoutsData = [
        { name: "41+", value: countCheckouts(checkouts, 41, 60) },
        { name: "60+", value: countCheckouts(checkouts, 60, 80) },
        { name: "80+", value: countCheckouts(checkouts, 80, 90) },
        { name: "90+", value: countCheckouts(checkouts, 90, 100) },
        { name: "100+", value: countCheckouts(checkouts, 100, 120) },
        { name: "120+", value: countCheckouts(checkouts, 120, 140) },
        { name: "140+", value: countCheckouts(checkouts, 140, 181) },
    ].reverse();

    const bestLegsData = [
        { name: "13-15", value: countLegs(legs, 13, 15) },
        { name: "16-18", value: countLegs(legs, 16, 18) },
        { name: "19-21", value: countLegs(legs, 19, 21) },
        { name: "22-24", value: countLegs(legs, 22, 24) },
        { name: "25-27", value: countLegs(legs, 25, 27) },
    ].reverse();

    return (
        <StatsPageShell
            activeSection="players"
            season={season}
            subtitle={`Profil hráča a sezónne štatistiky pre ${season}.`}
            title={<><span className="text-sky-400">{players[id]}</span></>}
        >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <StatCard title="Celkový výkon">
                                <StatRow label="Sezóna" value={`${season}`} />
                                <StatRow label="Počet turnajov" value={`${playerTournaments.size} / ${tournamentIds.length} (${(playerTournaments.size / tournamentIds.length * 100).toFixed(1)}%)`} />
                                <StatRow label="Vyhrané zápasy" value={`${matchesWon} / ${matches.length} (${(matchesWon / matches.length * 100).toFixed(1)}%)`} />
                                <StatRow label="Vyhrané legy" value={`${wonLegs} / ${playerLegs} (${(wonLegs / playerLegs * 100).toFixed(1)}%)`} />
                            </StatCard>
                            <StatCard title="Priemery a hody">
                                <StatRow label="Priemer za sezónu" value={((throws._sum?.score || 0) / (throws._sum?.darts || 1) * 3).toFixed(2)} />
                                <StatRow label="Počet hodov" value={throws._count.id} />
                                <StatRow label="Počet šípok" value={throws._sum.darts} />
                                {frequentOpponents.length > 0 && <StatWithNames name="Najčastejší protihráč" value={`${frequentOpponents[0][1]}x`} playerIds={[frequentOpponents[0][0]]} />}
                            </StatCard>
                        </div>
                        <div className="lg:col-span-3">
                            <StatCard title="Osobné rekordy">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                                        <div className="text-sm text-gray-400">Najlepší hod</div>
                                        <div className="text-2xl font-bold text-white mt-1">{throws._max.score || '-'}</div>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                                        <div className="text-sm text-gray-400">Najlepší leg</div>
                                        <div className="text-2xl font-bold text-white mt-1">{legsSorted[0]?._sum?.darts || '-'}</div>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                                        <div className="text-sm text-gray-400">Najlepší checkout</div>
                                        <div className="text-2xl font-bold text-white mt-1">{checkouts[0]?.score || '-'}</div>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                                        <div className="text-sm text-gray-400">Najlepší priemer</div>
                                        <div className="text-2xl font-bold text-white mt-1">{bestAvg[0]?.toFixed(2) || '-'}</div>
                                    </div>
                                </div>
                            </StatCard>
                        </div>
                        <div className="lg:col-span-3">
                           <CategoryGrid title="Priemery v zápasoch" data={averagesData} />
                        </div>
                        <div className="lg:col-span-3">
                            <CategoryGrid title="Vysoké skóre" data={scoresData} />
                        </div>
                        <div className="lg:col-span-3">
                            <CategoryGrid title="Vysoké zatvorenia" data={checkoutsData} />
                        </div>
                        <div className="lg:col-span-3">
                            <CategoryGrid title="Najlepšie legy" data={bestLegsData} />
                        </div>
                    </div>
        </StatsPageShell>
    )
}

function countThrows(throwsOver80: any[], min: number, max: number) {
    return throwsOver80
        .filter((t: { score: number }) => t.score >= min && t.score < max)
        .reduce((p: number, t: { _count: { score: number } }) => p + t._count.score, 0)
}

function countCheckouts(checkouts: { score: number }[], min: number, max: number) {
    return checkouts.filter(co => co.score >= min && co.score < max).length
}

function countAverages(matchAverages: number[], min: number, max: number) {
    return matchAverages.filter(avg => avg >= min && avg < max).length
}

function countLegs(legs: any[], min: number, max: number) {
    return legs.filter(l => l._sum.darts >= min && l._sum.darts <= max).length
}
