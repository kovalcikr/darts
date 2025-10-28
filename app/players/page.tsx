import Link from "next/link";
import { getPlayers } from "../lib/players";
import { getSeasons, getTournaments } from "../lib/tournament";
import prisma from "../lib/db";
import SeasonSelector from "../components/season-selector";

export default async function Players({ searchParams }: { searchParams: { season: string } }) {
    const seasons = await getSeasons();
    const season = searchParams.season || seasons[0] || "2025";
    const tournaments = await getTournaments(season);
    const players = await getPlayers(tournaments);

    const throwsPerPlayer = await prisma.playerThrow.groupBy({
        by: ["playerId"],
        where: {
            tournamentId: {
                in: tournaments
            }
        },
        _sum: {
            score: true,
            darts: true
        },
        _count: {
            id: true
        }
    });

    const playersWithStats = Object.entries(players).map(([id, name]) => {
        const playerThrows = throwsPerPlayer.find(p => p.playerId === id);
        return {
            id,
            name,
            avg: playerThrows ? (playerThrows._sum.score / playerThrows._sum.darts * 3) : 0,
            throws: playerThrows ? playerThrows._count.id : 0
        }
    }).sort((a, b) => b.avg - a.avg);


    return (
        <div className="w-full min-h-screen bg-gray-900 text-gray-300">
            <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/70 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4">
                        <div className="relative flex items-center">
                            <h1 className="font-bold text-xl text-white">Relax Darts Cup: <span className="text-sky-400">Štatistiky hráčov</span></h1>
                            <div className="relative flex items-center ml-auto">
                                <nav className="text-sm leading-6 font-semibold text-gray-400">
                                    <ul className="flex space-x-4 md:space-x-8">
                                        <li>
                                            <Link className="hover:text-sky-400 transition-colors" href="/">Domov</Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-auto">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md mx-auto mb-8">
                        <SeasonSelector seasons={seasons} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Meno</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Priemer</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hody</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-800">
                                {playersWithStats.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            <Link href={`/players/${p.id}?season=${season}`}>
                                                {p.name as string}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{p.avg.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{p.throws}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}