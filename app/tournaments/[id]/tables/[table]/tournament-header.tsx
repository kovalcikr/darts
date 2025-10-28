import { resetMatch } from "@/app/lib/match";
import { Tournament } from "@prisma/client";
import Image from "next/image";

export default function TournamentHeader({ tournament, round, format, table, matchId, reset }: { tournament: { name: string, id: string, createdAt?: Date }, round: string, format: string, table: string, matchId: string, reset: boolean }) {
  return (
    <div className="flex flex-row basis-1/12 bg-blue-200 p-1 pl-3 text-xl text-slate-800">
      <div className="flex flex-cols items-center justify-left">
        <div>
          <Image
            src="https://img.cuescore.com/image/3/2/31bf20bde717adc6cb934d7b8fddd79d.png"
            alt={tournament.name}
            width={48}
            height={48}
            className="w-12"
          />
        </div>
        <div className="flex flex-col pl-3">
          <div className="flex p-1 font-bold"> {tournament.name}</div>
          <div className="flex p-1 text-lg">{round}</div>
          <div className="flex p-1 text-sm">First to {format} legs</div>
        </div>
        <div className="flex absolute right-0 mr-1 p-2 pl-4 pr-4">
          <form action={resetMatch}>
            <input type="hidden" name="matchId" value={matchId} />
            {reset && <button className="p-2 pl-4 pr-4 border border-red-700 bg-red-500" type="submit">Reset</button>}
          </form>
          <a className=" p-2 pl-4 pr-4 border border-blue-700 bg-blue-400 rounded font-bold  " href={`/tournaments/${tournament.id}/tables/${table}`}>
            Exit
          </a>
        </div >
      </div>
    </div>
  );
}
