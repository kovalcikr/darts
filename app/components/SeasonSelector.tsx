'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function SeasonSelector({ season }: { season: string }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [selectedSeason, setSelectedSeason] = useState(season);
    const [pendingSeason, setPendingSeason] = useState<string | null>(null);

    useEffect(() => {
        setSelectedSeason(season);
        if (pendingSeason === season) {
            setPendingSeason(null);
        }
    }, [pendingSeason, season]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextSeason = e.target.value;
        if (nextSeason === season) {
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set('season', nextSeason);
        setSelectedSeason(nextSeason);
        setPendingSeason(nextSeason);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-[11rem]" aria-busy={Boolean(pendingSeason)}>
          <label htmlFor="season" className="block text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Sezóna</label>
          <select
            id="season"
            name="season"
            className={`mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 ${pendingSeason ? 'cursor-wait opacity-80' : ''}`}
            disabled={Boolean(pendingSeason)}
            value={selectedSeason}
            onChange={handleChange}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <div className="mt-1 min-h-5 text-xs text-gray-500">
            {pendingSeason ? (
              <span className="inline-flex items-center gap-2 text-sky-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
                Načítavam sezónu {pendingSeason}...
              </span>
            ) : null}
          </div>
        </div>
    );
}
