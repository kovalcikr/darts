import PlayerLegs from "../../../../tournaments/[id]/tables/[table]/player-legs";
import PlayerScore from "../../../../tournaments/[id]/tables/[table]/player-score";
import ScoreBoard from "../../../../tournaments/[id]/tables/[table]/scoreboard";
import TournamentHeader from "../../../../tournaments/[id]/tables/[table]/tournament-header";
import { getFullMatch } from "@/app/lib/match";
import Winner from "./winner";
import ChoosePlayer from "./choose-player";
import PlayerName from "./player-name";


export default async function Darts({ table, matchId } : { table: string, matchId: string }) {

  const fullMatch = await getFullMatch(matchId);

  const match = fullMatch.match;
  const playerAAvg = fullMatch.playerA.matchAvg;
  const playerBAvg = fullMatch.playerB.matchAvg;
  
  return (
    <main className="flex flex-col h-dvh font-normal text-black">
      <TournamentHeader tournament={fullMatch.tournament} round={match.round} format={String(match.runTo)} table={table} matchId={matchId} />
      <div className="flex flex-col basis-1/4 p-5 bg-slate-200">
        { !match.firstPlayer ?
          <ChoosePlayer match={match} />
         : 
         <>
          <div className="flex">
            <PlayerName player={fullMatch.playerA} />
            <PlayerName player={fullMatch.playerB} />
          </div>
          <div className="flex">
            <PlayerScore player={fullMatch.playerA} />
            <PlayerScore player={fullMatch.playerB} />
          </div>
          <div className="flex">
          <PlayerLegs player={fullMatch.playerA} />
          <PlayerLegs player={fullMatch.playerB} />
        </div>
        </>
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
