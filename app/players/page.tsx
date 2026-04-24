import Link from "next/link";
import { getRankings } from "../lib/cuescore";
import type { PageSearchParams } from "../lib/next-types";
import StatsPageShell from "../components/StatsPageShell";
import { withSeason } from "../lib/season-links";

export default async function Players({searchParams}: {searchParams: PageSearchParams}) {
    const resolvedSearchParams = await searchParams;
    const season = resolvedSearchParams.season as string || "2026";
    const rankings = season == "2026" ? "72952249" : (season == "2024" ? "43953514" : "52708102");
    const players = await getRankings(rankings);

    return (
        <StatsPageShell
            activeSection="players"
            season={season}
            subtitle={`Rebríček a profily hráčov pre sezónu ${season}.`}
            title="Rebríček hráčov"
        >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {players.participants.map(p => (
                            <div key={p.participantId} className="list-none">
                                <Link href={withSeason(`/players/${p.participantId}`, season)}>
                                    <div className="flex items-center bg-gray-800 p-4 rounded-xl shadow-lg hover:bg-gray-700/80 hover:ring-1 hover:ring-sky-500 transition-all duration-200 h-full">
                                        <span className="text-lg font-bold text-sky-400 w-8">{p.rank}.</span>
                                        <h2 className="font-semibold text-lg text-white">{p.name}</h2>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
        </StatsPageShell>
    )
}
