import { getTournamentsForList } from "@/app/lib/tournament";
import Link from "next/link";

export default async function Page() {
    const tournaments = await getTournamentsForList();
    return (
        <div className="w-full min-h-screen bg-gray-900 text-gray-300">
            <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/70 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4">
                        <div className="relative flex items-center">
                            <h1 className="font-bold text-xl text-white">Štatistiky turnajov</h1>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tournaments.map(tournament => (
                            <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="bg-gray-800 p-6 rounded-xl shadow-lg ring-1 ring-white/10 hover:bg-gray-700/50 transition-colors">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">{tournament.name}</h2>
                                    <p className="text-sm text-gray-400 mt-2">{new Date(tournament.createdAt).toLocaleDateString()}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}