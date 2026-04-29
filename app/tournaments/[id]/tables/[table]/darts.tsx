import PlayerLegs from "../../../../tournaments/[id]/tables/[table]/player-legs";
import PlayerScore from "../../../../tournaments/[id]/tables/[table]/player-score";
import ScoreBoard from "../../../../tournaments/[id]/tables/[table]/scoreboard";
import TournamentHeader from "../../../../tournaments/[id]/tables/[table]/tournament-header";
import { getFullMatch } from "@/app/lib/match";
import Winner from "./winner";
import ChoosePlayer from "./choose-player";
import PlayerName from "./player-name";
import Wait from "./wait";
import { getPlayerCardAccentClassName } from "./scoreboard-display";


export default async function Darts({ table, matchId, slow, reset, tournamentId }: { table: string, matchId: string, slow: boolean, reset: boolean, tournamentId?: string }) {

  const fakeMatch = {
    tournament: { id: "10", name: "ABC" },
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
      isComplete: false,
      firstPlayer: "1",
      tournamentId: "test",
    },
    playerA: { matchAvg: 10, score: 501, active: true, id: "1", name: "Fero Hruska", dartsCount: 3, imageUrl: "abc", lastThrow: 41, legCount: 0, highestScore: 0, bestCheckout: 0, bestLeg: 0 },
    playerB: { matchAvg: 30, score: 501, active: false, id: "2", name: "Jozo Mrkva", dartsCount: 6, imageUrl: "abc", lastThrow: 41, legCount: 1, highestScore: 0, bestCheckout: 0, bestLeg: 0 },
    nextPlayer: "1",
    currentLeg: 1,
    throwHistory: [],
  };
  const fullMatch = table === "test" ? fakeMatch : await getFullMatch(matchId, slow);

  if (!fullMatch) {
    return <Wait id={tournamentId ?? ""} table={table} />;
  }

  const match = fullMatch.match;
  const playerAAvg = fullMatch.playerA.matchAvg;
  const playerBAvg = fullMatch.playerB.matchAvg;

  const playerLeft = match.firstPlayer == match.playerAId ? fullMatch.playerA : fullMatch.playerB;
  const playerRight = playerLeft == fullMatch.playerA ? fullMatch.playerB : fullMatch.playerA;

  const currentPlayerScore = fullMatch.playerA.active ? fullMatch.playerA.score : fullMatch.playerB.score;

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-gray-900 font-normal text-gray-300">
      <TournamentHeader tournament={fullMatch.tournament} round={match.round} format={String(match.runTo)} table={table} matchId={matchId} reset={reset} />
      {match.runTo != match.playerALegs && match.runTo != match.playerBlegs &&
        <div className="flex h-[34dvh] min-h-0 shrink-0 flex-col px-2 py-2">
          {!match.firstPlayer ?
            <ChoosePlayer match={match} table={table} />
            :
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
              <div
                className={`flex min-h-0 flex-col overflow-hidden rounded-lg bg-gray-800/50 p-2 ring-1 ring-white/10 ${getPlayerCardAccentClassName('left')} ${playerLeft.active ? "bg-sky-500/10 ring-2 ring-sky-400/70" : ""}`}
                data-testid={`player-card-${playerLeft.id}`}
                data-active={playerLeft.active ? "true" : "false"}
              >
                <PlayerName player={playerLeft} />
                <PlayerScore player={playerLeft} />
                <PlayerLegs player={playerLeft} />
              </div>
              <div
                className={`flex min-h-0 flex-col overflow-hidden rounded-lg bg-gray-800/50 p-2 ring-1 ring-white/10 ${getPlayerCardAccentClassName('right')} ${playerRight.active ? "bg-sky-500/10 ring-2 ring-sky-400/70" : ""}`}
                data-testid={`player-card-${playerRight.id}`}
                data-active={playerRight.active ? "true" : "false"}
              >
                <PlayerName player={playerRight} />
                <PlayerScore player={playerRight} />
                <PlayerLegs player={playerRight} />
              </div>
            </div>
          }
        </div>
      }
      {match.firstPlayer &&
        <div className="min-h-0 flex-1 text-3xl">
          {match.runTo == match.playerALegs ?
            <Winner player={match.playerAName} image={match.playerAImage} match={match} leg={fullMatch.currentLeg} slow={slow} table={table} />
            :
            (
              match.runTo == match.playerBlegs ?
                <Winner player={match.playerBName} image={match.playerBImage} match={match} leg={fullMatch.currentLeg} slow={slow} table={table} />
                :
                <ScoreBoard
                  tournamentId={fullMatch.tournament.id}
                  matchId={match.id}
                  leg={fullMatch.currentLeg}
                  player={fullMatch.nextPlayer}
                  currentPlayerScore={currentPlayerScore}
                  slow={slow}
                  table={table}
                  throwHistory={fullMatch.throwHistory}
                  playerNames={{
                    [fullMatch.playerA.id]: fullMatch.playerA.name,
                    [fullMatch.playerB.id]: fullMatch.playerB.name,
                  }}
                  playerAccents={{
                    [playerLeft.id]: 'left',
                    [playerRight.id]: 'right',
                  }}
                />
            )
          }
        </div>
      }
    </main>
  );
}
