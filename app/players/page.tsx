import Link from "next/link";
import prisma from "../lib/db";
import { getPlayers } from "../lib/players";
import { getTournaments } from "../lib/tournament";

export default async function Players() {
    const players = await getPlayers(await getTournaments())

    return (
        <div className="flex flex-col h-dvh font-normal text-black bg-slate-300">
            <div className="max-w-screen-md rounded shadow-lg">
                <div className="px-6 py-4">
                    <div className="font-bold text-xl mb-2">Relax darts cup</div>
                    <div className="text-gray-700 text-base">
                        <ul>
                            {Array.from(players.keys()).map(id => (
                                <li key={id}><Link href={`/players/${id}`}>{players.get(id)}</Link></li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}