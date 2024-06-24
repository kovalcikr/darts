import { resetMatch } from "@/app/lib/match";
import { Tournament } from "@prisma/client";
import Link from "next/link";
import { MouseEventHandler } from "react";

export default function TournamentHeader({tournament, round, format, table, matchId} : { tournament: Tournament, round: string, format: string, table: string, matchId: string }) {
  return (
    <div className="flex flex-row basis-1/12 bg-green-200 p-1 pl-3 text-2xl">
      <div className="flex flex-cols items-center justify-left">
        <div>
          <img
            src="https://img.cuescore.com/image/3/2/31bf20bde717adc6cb934d7b8fddd79d.png"
            className="w-13"
          />
        </div>
        <div className="flex flex-col pl-3">
          <div className="flex p-1 font-bold"> { tournament.name }</div>
          <div className="flex p-1 text-xl">{ round }</div>
          <div className="flex p-1 text-lg">First to { format } legs</div>
        </div>
        <div className="flex absolute right-0 mr-1 p-2 pl-4 pr-4">
        <form action={resetMatch}>
          <input type="hidden" name="matchId" value={matchId}/>
          <button className="p-2 pl-4 pr-4 border border-red-700 bg-red-500 hover:bg-red-400" type="submit">Reset</button>
          </form>
        <a  className=" p-2 pl-4 pr-4 border border-green-700 bg-green-500 hover:bg-green-400" href={`/tournaments/${tournament.id}/tables/${table}`}>
          Exit
        </a>
        </div >        
      </div>
    </div>
  );
}
