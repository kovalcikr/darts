import { resetMatch } from "@/app/lib/match";
import type { Tournament } from "@/prisma/client";
import Image from "next/image";

type TournamentHeaderTournament = Pick<Tournament, "id" | "name">

export default function TournamentHeader({ tournament, round, format, table, matchId, reset }: { tournament: TournamentHeaderTournament, round: string, format: string, table: string, matchId: string, reset: boolean }) {
  return (
    <header className="shrink-0 border-b border-gray-700 bg-gray-900/70 px-3 py-2 text-gray-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center">
          <Image
            src="https://img.cuescore.com/image/3/2/31bf20bde717adc6cb934d7b8fddd79d.png"
            alt={tournament.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-md bg-gray-800 ring-1 ring-white/10"
          />
          <div className="min-w-0 pl-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              Relax Darts Cup
            </div>
            <div className="truncate text-lg font-bold text-white">{tournament.name}</div>
            <div className="flex flex-wrap gap-x-3 text-sm text-gray-400">
              <span>{round}</span>
              <span>Table {table}</span>
              <span>First to {format} legs</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <form action={resetMatch}>
            <input type="hidden" name="matchId" value={matchId} />
            {reset && <button className="rounded-md border border-red-500/40 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/30" type="submit">Reset</button>}
          </form>
          <a className="rounded-md px-4 py-2 text-sm font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-400" href="/tables">
            Exit
          </a>
        </div>
      </div>
    </header>
  );
}
