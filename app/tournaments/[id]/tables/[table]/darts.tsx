import PlayerLegs from "../../../../tournaments/[id]/tables/[table]/player-legs";
import PlayerName from "../../../../tournaments/[id]/tables/[table]/player-name";
import PlayerScore from "../../../../tournaments/[id]/tables/[table]/player-score";
import ScoreBoard from "../../../../tournaments/[id]/tables/[table]/scoreboard";
import TournamentHeader from "../../../../tournaments/[id]/tables/[table]/tournament-header";
import { Cookie } from "next/font/google";
import { getMatch } from "@/app/lib/match";
import Players from "../players";


export default async function Darts({ tournament, table, matchId } : {tournament: string, table: string, matchId: string }) {

  const match = await getMatch(matchId);
  const currentPlayer : number = 1;
  
  return (
    <main className="flex flex-col h-dvh font-normal text-black">
      <TournamentHeader tournament={match.tournament.name} round={match.round} format={String(match.runTo)} onReset={null} />
      <div className="flex flex-col basis-1/4 p-5 bg-slate-200">
        <Players match={match}/>
        <div className="flex">
          <PlayerScore score={501} />
          <PlayerScore score={501} />
        </div>
        <div className="flex">
          <PlayerLegs legs={match.playerALegs} />
          <PlayerLegs legs={match.playerBlegs} />
        </div>
      </div>
      <div className="basis-2/3 text-3xl">
        <ScoreBoard
          onSubmit={null}
          onUndo={null}
        />
      </div>
    </main>
  );
}
