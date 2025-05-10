import PlayerLegs from "../../../../tournaments/[id]/tables/[table]/player-legs";
import PlayerScore from "../../../../tournaments/[id]/tables/[table]/player-score";
import ScoreBoard from "../../../../tournaments/[id]/tables/[table]/scoreboard";
import TournamentHeader from "../../../../tournaments/[id]/tables/[table]/tournament-header";
import { getFullMatch } from "@/app/lib/match";
import Winner from "./winner";
import ChoosePlayer from "./choose-player";
import PlayerName from "./player-name";


export default async function Darts({ table, matchId, slow, reset }: { table: string, matchId: string, slow: boolean, reset: boolean }) {

  const fakeMatch = { 
    tournament: { id: "10", name: "ABC"}, 
    match: { 
    id: "1",
    round: "Round 1",
    playerAId: "1",
    playerAName: "Fero Hruska",
    playerAImage: "abc",
    playerBId: "2",
    playerBName: "Jozo Mrkva",
    playerBImage: "cde",
    runTo: 3,
    playerALegs: 1,
    playerBlegs: 2,
    firstPlayer: "1",
    tournamentId: "test",
    }, 
    playerA: { matchAvg: 10, score: 501, active: true, id: "1", name: "Fero Hruska", dartsCount: 3, imageUrl: "abc", lastThrow: 41, legCount: 0}, 
    playerB: { matchAvg: 30, score: 501, active: false, id: "2", name: "Jozo Mrkva", dartsCount: 6, imageUrl: "abc", lastThrow: 41, legCount: 1},
    nextPlayer: "1",
    currentLeg: 1,
  };
  const fullMatch = table === "test" ? fakeMatch : await getFullMatch(matchId, slow);

  const match = fullMatch.match;
  const playerAAvg = fullMatch.playerA.matchAvg;
  const playerBAvg = fullMatch.playerB.matchAvg;

  const playerLeft = match.firstPlayer == match.playerAId ? fullMatch.playerA : fullMatch.playerB;
  const playerRight = playerLeft == fullMatch.playerA ? fullMatch.playerB : fullMatch.playerA;

  const currentPlayerScore = fullMatch.playerA.active ? fullMatch.playerA.score : fullMatch.playerB.score;

  return (
    <main className="flex flex-col h-dvh font-normal text-black bg-blue-100">
      <TournamentHeader tournament={fullMatch.tournament} round={match.round} format={String(match.runTo)} table={table} matchId={matchId} reset={reset} />
      <div className="flex flex-col basis-1/4">
        {!match.firstPlayer ?
          <ChoosePlayer match={match} />
          :
          <div className="flex">
            <div className={`w-1/2 p-1 ${playerLeft.active && "border-2 border-slate-400 rounded bg-yellow-100"}`}>
              <PlayerName player={playerLeft} />
              <PlayerScore player={playerLeft} />
              <PlayerLegs player={playerLeft} />
            </div>
            <div className={`w-1/2 p-1 ${playerRight.active && "border-2 border-slate-400 rounded bg-yellow-100"}`}>
              <PlayerName player={playerRight} />
              <PlayerScore player={playerRight} />
              <PlayerLegs player={playerRight} />
            </div>
          </div>
        }
      </div>
      {match.firstPlayer &&
        <div className="basis-2/3 text-3xl">
          {match.runTo == match.playerALegs ?
            <Winner player={match.playerAName} image={match.playerAImage} match={match} leg={fullMatch.currentLeg} slow={slow} table={table} />
            :
            (
              match.runTo == match.playerBlegs ?
                <Winner player={match.playerBName} image={match.playerBImage} match={match} leg={fullMatch.currentLeg} slow={slow} table={table} />
                :
                <ScoreBoard tournamentId={fullMatch.tournament.id} matchId={match.id} leg={fullMatch.currentLeg} player={fullMatch.nextPlayer} currentPlayerScore={currentPlayerScore} slow={slow} table={table} />
            )
          }
        </div>
      }
    </main>
  );
}
