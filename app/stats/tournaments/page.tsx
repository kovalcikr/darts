import prisma from "@/app/lib/db";
import { getTournaments } from "@/app/lib/tournament"
import Link from "next/link";

export default async function Tournaments() {

    const tournaments = await prisma.tournament.findMany();

    return (
        <ul>
            {tournaments.map(t => (
                <li key={t.id}>
                    <Link href={`tournaments/${t.id}`}>{t.name}</Link>
                </li>
            ))
            }
        </ul>
    )
}