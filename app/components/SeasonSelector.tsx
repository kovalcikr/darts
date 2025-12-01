'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export default function SeasonSelector({ season }: { season: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('season', e.target.value);
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="max-w-xs mx-auto">
          <label htmlFor="season" className="block text-sm font-medium text-gray-400">Select Season</label>
          <select
            id="season"
            name="season"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
            value={season}
            onChange={handleChange}
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
    );
}
