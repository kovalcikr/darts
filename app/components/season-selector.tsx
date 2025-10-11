'use client'

import { useRouter, useSearchParams } from "next/navigation";

export default function SeasonSelector({ seasons }: { seasons: string[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedSeason = searchParams.get('season') || seasons[0];

    function handleSeasonChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const season = event.target.value;
        router.push(`/?season=${season}`);
    }

    return (
        <select
            value={selectedSeason}
            onChange={handleSeasonChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
        >
            {seasons.map(season => (
                <option key={season} value={season}>
                    {season}
                </option>
            ))}
        </select>
    );
}