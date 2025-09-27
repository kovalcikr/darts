import Link from "next/link";
import { getRankings } from "../lib/cuescore";

export default async function Players() {
    const players = await getRankings("43953514");

    return (
        <div className="w-full min-h-screen bg-gray-900 text-gray-300">
            <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/70 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4">
                        <div className="relative flex items-center">
                            <h1 className="font-bold text-xl text-white">Relax Darts Cup: <span className="text-sky-400">Rebríček hráčov</span></h1>
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
                        {players.participants.map(p => (
                            <div key={p.participantId} className="list-none">
                                <Link href={`/players/${p.participantId}`}>
                                    <div className="flex items-center bg-gray-800 p-4 rounded-xl shadow-lg hover:bg-gray-700/80 hover:ring-1 hover:ring-sky-500 transition-all duration-200 h-full">
                                        <span className="text-lg font-bold text-sky-400 w-8">{p.rank}.</span>
                                        <h2 className="font-semibold text-lg text-white">{p.name}</h2>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}