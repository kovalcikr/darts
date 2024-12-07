import Link from "next/link";
import prisma from "../lib/db";
import { getPlayers } from "../lib/players";
import { getTournaments } from "../lib/tournament";
import { getRankings } from "../lib/cuescore";

export default async function Players() {
    const players = await getRankings("43953514");

    return (
        <div className="fixed w-full min-h-full text-gray-900 bg-white overflow-x-scroll">
            <header className="sticky top-0 z-40 w-full backdrop-blur flex-none">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4">
                        <div className="relative flex items-center">
                            <div className="font-bold text-xl">Relax darts cup</div>
                            <div className="relative flex items-center ml-auto">
                                <nav className="text-sm leading-6 font-semibold text-slate-700">
                                    <ul className="flex space-x-8">
                                        <li>
                                            <Link className="hover:text-sky-500" href="/">Späť</Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-auto relative border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto py-4 px-4">
                    <div className="text-gray-700 text-base">
                        <ul>
                            {players.participants.map(p => (
                                <li key={p.participantId}><Link className="hover:text-sky-500" href={`/players/${p.participantId}`}>{p.rank}. {p.name}</Link></li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    )
}