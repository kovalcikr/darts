import { getCachedTournaments } from "@/app/lib/tournament"
import Link from "next/link";

export const dynamic = 'force-dynamic'

export default async function Tournaments({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {

    const season = searchParams.season as string || "2025";
    const tournaments = (await getCachedTournaments(season)).sort((t1, t2) => t1.name.localeCompare(t2.name));

    return (
        <div className="w-full min-h-screen bg-gray-900 text-gray-300">
            <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/70 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4">
                        <div className="relative flex items-center">
                            <h1 className="font-bold text-xl text-white">Relax Darts Cup: <span className="text-sky-400">Všetky turnaje</span></h1>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {tournaments.map(t => (
                            <li key={t.id} className="list-none">
                                <Link href={`/stats/tournaments/${t.id}`}>
                                    <div className="block bg-gray-800 p-6 rounded-xl shadow-lg hover:bg-gray-700/80 hover:ring-1 hover:ring-sky-500 transition-all duration-200 h-full">
                                        <h2 className="font-bold text-lg text-white">{t.name}</h2>
                                    </div>
                                </Link>
                            </li>
                        ))
                        }
                    </div>
                </div>
            </main>
        </div>
    )
}