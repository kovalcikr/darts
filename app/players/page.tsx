import Link from "next/link";
import prisma from "../lib/db";
import { getPlayers } from "../lib/players";
import { getTournaments } from "../lib/tournament";

export default async function Players() {
    const players = await getPlayers(await getTournaments())

    return (
        <ul>
            { Array.from(players.keys()).map(id => (
                <li key={id}><Link href={`/players/${id}`}>{ players.get(id) }</Link></li>
            )) }
        </ul>
    )
}