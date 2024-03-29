"use client";

import { useEffect, useState } from "react";
import PlayerLegs from "../../../../tournaments/[id]/tables/[table]/player-legs";
import PlayerName from "../../../../tournaments/[id]/tables/[table]/player-name";
import PlayerScore from "../../../../tournaments/[id]/tables/[table]/player-score";
import ScoreBoard from "../../../../tournaments/[id]/tables/[table]/scoreboard";
import TournamentHeader from "../../../../tournaments/[id]/tables/[table]/tournament-header";
import { Cookie } from "next/font/google";

export default function Darts({ tournament, table } : {tournament: string, table: string}) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [match, setMatch] = useState<any>(null);

  const [player1, setPlayer1] = useState<Player>({
    name: "Player 1",
    image:
      "https://img.cuescore.com/image/6/4/6acba9414773fd2d369779e04d6a538e.png",
    score: 501,
    lastThrow: 0,
    legs: 0,
    previousState: undefined,
  });
  const [player2, setPlayer2] = useState<Player>({
    name: "Player 2",
    image:
      "https://img.cuescore.com/image/e/4/e2024a3843fcb9a6de719bfb66d8ca0d.png",
    score: 501,
    lastThrow: 0,
    legs: 0,
    previousState: undefined,
  });
  const [currentPlayer, setCurrentPlayer] = useState(1);

  function handleSubmit(score: number) {
    if (currentPlayer == 1) {
      if (player1.score - score < 0) return;
      player1.previousState = Object.assign({}, player1);
      if (player1.score - score == 0) {
        player1.legs = player1.legs + 1;
        player1.score = 501;
        player1.lastThrow = 0;
        setPlayer1(player1);
        player2.previousState = Object.assign({}, player2);
        player2.score = 501;
        player2.lastThrow = 0;
        setPlayer2(player2);
        setCurrentPlayer(((player1.legs + player2.legs) % 2) + 1);
      } else {
        player1.score = player1.score - score;
        player1.lastThrow = score;
        setPlayer1(player1);
        setCurrentPlayer(2);
      }
    } else if (currentPlayer == 2) {
      if (player2.score - score < 0) return;
      player2.previousState = Object.assign({}, player2);
      if (player2.score - score == 0) {
        player2.legs = player2.legs + 1;
        player2.score = 501;
        player2.lastThrow = 0;
        setPlayer2(player2);
        player1.previousState = Object.assign({}, player1);
        player1.score = 501;
        player1.lastThrow = 0;
        setPlayer1(player1);
        setCurrentPlayer(((player1.legs + player2.legs) % 2) + 1);
      } else {
        player2.score = player2.score - score;
        setPlayer2(player2);
        player2.lastThrow = score;
        setCurrentPlayer(1);
      }
    } else {
      alert("error");
    }
  }

  function handleUndo() {
    // TOOD: undo leg end
    if (currentPlayer == 1) {
      if (!player2.previousState) return;
      setPlayer2(player2.previousState);
      setCurrentPlayer(2);
    } else if (currentPlayer == 2) {
      if (!player1.previousState) return;
      setPlayer1(player1.previousState);
      setCurrentPlayer(1);
    } else {
      alert("error");
    }
  }

  function handleReset() {
    setPlayer1({
      name: "Player 1",
      image:
        "https://img.cuescore.com/image/6/4/6acba9414773fd2d369779e04d6a538e.png",
      score: 501,
      lastThrow: 0,
      legs: 0,
      previousState: undefined,
    });
    setPlayer2({
      name: "Player 2",
      image:
        "https://img.cuescore.com/image/e/4/e2024a3843fcb9a6de719bfb66d8ca0d.png",
      score: 501,
      lastThrow: 0,
      legs: 0,
      previousState: undefined,
    });
    setCurrentPlayer(1);
  }

  useEffect(() => {
    fetch("/api/tournaments/" + tournament)
      .then((res) => res.json())
      .then((json) => {
        console.log(json)
        setData(json);
        setLoading(false);
        for (let m of json.matches) {
          if (m?.table.name == table) setMatch(m)
        }
      });
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>No tournament data</p>;
  if (!match) return <p>No match in progress</p>;
  console.log(match);

  return (
    <main className="flex flex-col h-dvh font-normal text-black">
      <TournamentHeader tournament={data.name} round={match.roundName} format={match.raceTo} onReset={handleReset} />
      <div className="flex flex-col basis-1/4 p-5 bg-slate-200">
        <div className="flex">
          <PlayerName player={match.playerA} active={currentPlayer == 1} />
          <PlayerName player={match.playerB} active={currentPlayer == 2} />
        </div>
        <div className="flex">
          <PlayerScore score={player1.score} />
          <PlayerScore score={player2.score} />
        </div>
        <div className="flex">
          <PlayerLegs legs={player1.legs} />
          <PlayerLegs legs={player2.legs} />
        </div>
      </div>
      <div className="basis-2/3 text-3xl">
        <ScoreBoard
          currentPlayer={currentPlayer == 1 ? player1 : player2}
          onSubmit={handleSubmit}
          onUndo={handleUndo}
        />
      </div>
    </main>
  );
}
