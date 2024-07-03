import PlayerLegs from "../../../../tournaments/[id]/tables/[table]/player-legs";
import PlayerName from "../../../../tournaments/[id]/tables/[table]/player-name";
import PlayerScore from "../../../../tournaments/[id]/tables/[table]/player-score";
import ScoreBoard from "../../../../tournaments/[id]/tables/[table]/scoreboard";
import TournamentHeader from "../../../../tournaments/[id]/tables/[table]/tournament-header";
import { Cookie } from "next/font/google";
import { getFullMatch, getMatch, getScores, nextPlayer } from "@/app/lib/match";
import Players from "../players";
import { findLastThrow, findMatchAvg } from "@/app/lib/playerThrow";
import Winner from "./winner";


export default async function Darts({ tournament, table, matchId } : {tournament: string, table: string, matchId: string }) {

  const fullMatch = await getFullMatch(matchId);

  const match = fullMatch.match;
  const playerAAvg = fullMatch.playerA.matchAvg?.toFixed(2);
  const playerBAvg = fullMatch.playerB.matchAvg?.toFixed(2);
  
  if (!match.firstPlayer) {
    return (
      <main className="flex flex-col h-dvh font-normal text-black">
      <TournamentHeader tournament={fullMatch.tournament} round={match.round} format={String(match.runTo)} table={table} matchId={matchId} />
      <div className="flex flex-col basis-1/4 p-5 bg-slate-200">
        <Players match={match} nextPlayer={fullMatch.nextPlayer}/>
      </div>
    </main>
    )
  }

  if (match.runTo == match.playerALegs) {
    return (
      <main className="flex flex-col h-dvh font-normal text-black">
      <TournamentHeader tournament={fullMatch.tournament} round={match.round} format={String(match.runTo)} table={table} matchId={matchId} />
      <div className="flex flex-col basis-1/4 p-5 bg-slate-200">
        <Players match={match} nextPlayer={fullMatch.nextPlayer}/>
        <div className="flex">
          <PlayerLegs last={fullMatch.playerA.lastThrow} darts={fullMatch.playerA.dartsCount} avg={playerAAvg} />
          <PlayerLegs last={fullMatch.playerA.lastThrow} darts={fullMatch.playerB.dartsCount} avg={playerBAvg} />
        </div>
      </div>
      <div className="basis-2/3 text-3xl">
        <Winner player={match.playerAName} image={match.playerAImage} match={match} leg={fullMatch.currentLeg}/>
      </div>
    </main>
    )
  }

  if (match.runTo == match.playerBlegs) {
    return (
      <main className="flex flex-col h-dvh font-normal text-black">
      <TournamentHeader tournament={fullMatch.tournament} round={match.round} format={String(match.runTo)} table={table} matchId={matchId} />
      <div className="flex flex-col basis-1/4 p-5 bg-slate-200">
        <Players match={match} nextPlayer={fullMatch.nextPlayer}/>
        <div className="flex">
          <PlayerLegs last={fullMatch.playerA.lastThrow} darts={fullMatch.playerA.dartsCount} avg={playerAAvg} />
          <PlayerLegs last={fullMatch.playerB.lastThrow} darts={fullMatch.playerB.dartsCount} avg={playerBAvg} />
        </div>
      </div>
      <div className="basis-2/3 text-3xl">
        <Winner player={match.playerBName} image={match.playerBImage} match={match} leg={fullMatch.currentLeg}/>
      </div>
    </main>
    )
  }

  return (
    <main className="flex flex-col h-dvh font-normal text-black">
      <TournamentHeader tournament={fullMatch.tournament} round={match.round} format={String(match.runTo)} table={table} matchId={matchId} />
      <div className="flex flex-col basis-1/4 p-5 bg-slate-200">
        <Players match={match} nextPlayer={fullMatch.nextPlayer}/>
        <div className="flex">
          <PlayerScore score={fullMatch.playerA.score} legs={match.playerALegs} active={fullMatch.nextPlayer == match.playerAId} />
          <PlayerScore score={fullMatch.playerB.score} legs={match.playerBlegs} active={fullMatch.nextPlayer != match.playerAId} />
        </div>
        <div className="flex">
          <PlayerLegs last={fullMatch.playerA.lastThrow} darts={fullMatch.playerA.dartsCount} avg={playerAAvg} />
          <PlayerLegs last={fullMatch.playerA.lastThrow} darts={fullMatch.playerB.dartsCount} avg={playerBAvg} />
        </div>
      </div>
      <div className="basis-2/3 text-3xl">
        <ScoreBoard tournamentId={fullMatch.tournament.id} matchId={match.id} leg={fullMatch.currentLeg} player={fullMatch.nextPlayer}
        />
      </div>
    </main>
  );
}
