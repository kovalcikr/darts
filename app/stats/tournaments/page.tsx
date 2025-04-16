import prisma from "@/app/lib/db";
import { getTournaments } from "@/app/lib/tournament"
import { Baloo_Tamma_2 } from "next/font/google";
import Link from "next/link";

export default async function Tournaments() {

    const tournaments = (await prisma.tournament.findMany({
        where: {
            name: {
                contains: "2025"
            }
        }
    })).sort((t1, t2) => t1.name.localeCompare(t2.name));

    return (
        <div className="w-full min-h-screen text-gray-900 bg-white">
            <header className="sticky top-0 z-40 w-full backdrop-blur flex-none">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
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
            <main className="flex-auto">
                <div className="max-w-7xl mx-auto py-4 px-4">
                    <div className="text-gray-700 text-base">
                        <ul>
                            {tournaments.map(t => (
                                <li key={t.id}>
                                    <Link href={`tournaments/${t.id}`}>{t.name}</Link>
                                </li>
                            ))
                            }
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    )
}