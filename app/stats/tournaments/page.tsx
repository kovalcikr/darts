import { getCachedTournaments } from "@/app/lib/tournament"
import { formatTournamentEventDate } from "@/app/lib/tournament-metadata";
import Link from "next/link";
import type { PageSearchParams } from "@/app/lib/next-types";
import StatsPageShell from "@/app/components/StatsPageShell";
import { withSeason } from "@/app/lib/season-links";

export const dynamic = 'force-dynamic'

export default async function Tournaments({ searchParams }: { searchParams: PageSearchParams }) {
    const resolvedSearchParams = await searchParams;

    const season = resolvedSearchParams.season as string || "2026";
    const { included, excluded } = await getCachedTournaments(season);

    return (
        <StatsPageShell
            activeSection="tournaments"
            season={season}
            subtitle={`Prehľad turnajov a lokálnych turnajových štatistík pre sezónu ${season}.`}
            title="Všetky turnaje"
        >
                    <section>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {included.map(t => {
                            const seasonLabel = `Sezóna ${t.season ?? season}`;
                            const dateLabel = formatTournamentEventDate(t.eventDate) ?? "Dátum neznámy";

                            return (
                            <li key={t.id} className="list-none">
                                <Link href={withSeason(`/stats/tournaments/${t.id}`, season)}>
                                    <div className="block bg-gray-800 p-6 rounded-xl shadow-lg hover:bg-gray-700/80 hover:ring-1 hover:ring-sky-500 transition-all duration-200 h-full">
                                        <h2 className="font-bold text-lg text-white">{t.name}</h2>
                                        <div className="mt-2 space-y-1 text-sm text-gray-400">
                                            <p>{seasonLabel}</p>
                                            <p>{dateLabel}</p>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                            );
                        })
                        }
                        </div>
                    </section>

                    {excluded.length > 0 ? (
                    <section className="mt-12">
                        <h2 className="text-lg font-semibold text-white">Nebodované turnaje</h2>
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {excluded.map(t => {
                                    const seasonLabel = `Sezóna ${t.season ?? season}`;
                                    const dateLabel = formatTournamentEventDate(t.eventDate) ?? "Dátum neznámy";

                                    return (
                                    <li key={t.id} className="list-none">
                                        <Link href={withSeason(`/stats/tournaments/${t.id}`, season)}>
                                            <div className="block bg-gray-800/70 p-6 rounded-xl shadow-lg ring-1 ring-amber-400/30 hover:bg-gray-700/80 hover:ring-amber-300 transition-all duration-200 h-full">
                                                <h3 className="font-bold text-lg text-white">{t.name}</h3>
                                                <div className="mt-2 space-y-1 text-sm text-gray-400">
                                                    <p>{seasonLabel}</p>
                                                    <p>{dateLabel}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                    );
                                })}
                            </div>
                    </section>
                    ) : null}
        </StatsPageShell>
    )
}
