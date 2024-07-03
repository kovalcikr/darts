import PlayerLegs from "../../../../tournaments/[id]/tables/[table]/player-legs";
import PlayerScore from "../../../../tournaments/[id]/tables/[table]/player-score";
import ScoreBoard from "../../../../tournaments/[id]/tables/[table]/scoreboard";
import TournamentHeader from "../../../../tournaments/[id]/tables/[table]/tournament-header";
import { getFullMatch } from "@/app/lib/match";
import Players from "../players";
import Winner from "./winner";


export default async function Darts({ tournament, table, matchId } : {tournament: string, table: string, matchId: string }) {

  const fullMatch = await getFullMatch(matchId);

  const match = fullMatch.match;
  const playerAAvg = fullMatch.playerA.matchAvg?.toFixed(2);
  const playerBAvg = fullMatch.playerB.matchAvg?.toFixed(2);
  
  return (
    <main className="flex flex-col h-dvh font-normal text-black">
      <TournamentHeader tournament={fullMatch.tournament} round={match.round} format={String(match.runTo)} table={table} matchId={matchId} />
      <div className="flex flex-col basis-1/4 p-5 bg-slate-200">
        <Players match={match} nextPlayer={fullMatch.nextPlayer}/>
        { match.firstPlayer && 
        <div className="flex">
        <PlayerScore score={fullMatch.playerA.score} legs={match.playerALegs} active={fullMatch.nextPlayer == match.playerAId} />
        <PlayerScore score={fullMatch.playerB.score} legs={match.playerBlegs} active={fullMatch.nextPlayer != match.playerAId} />
      </div>
        }
        { match.firstPlayer && 
        <div className="flex">
        <PlayerLegs last={fullMatch.playerA.lastThrow} darts={fullMatch.playerA.dartsCount} avg={playerAAvg} />
        <PlayerLegs last={fullMatch.playerA.lastThrow} darts={fullMatch.playerB.dartsCount} avg={playerBAvg} />
      </div>
        }        
      </div>
      { match.firstPlayer && 
        <div className="basis-2/3 text-3xl">
        { match.runTo == match.playerALegs ? 
          <Winner player={match.playerAName} image={match.playerAImage} match={match} leg={fullMatch.currentLeg}/> 
          : 
          (
            match.runTo == match.playerBlegs ? 
            <Winner player={match.playerBName} image={match.playerBImage} match={match} leg={fullMatch.currentLeg}/>
            : 
            <ScoreBoard tournamentId={fullMatch.tournament.id} matchId={match.id} leg={fullMatch.currentLeg} player={fullMatch.nextPlayer}/>
          )
        }
      </div>
      }
    </main>
  );
}
