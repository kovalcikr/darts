'use client'

import { useState } from "react";
import GamepadButton from "./gamepad-button";
import { addThrowAction, undoThrow } from "@/app/lib/playerThrow";
import GamepadServerButton from "./gamepad-server-button";

export default function ScoreBoard({ tournamentId, matchId, leg, player, currentPlayerScore, slow }) {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const impossibleScore = [163,166,169,172,173,175,176,178,179];
  const [currentScore, setCurrentScore] = useState("0");
  const [disabledOK, setDisabledOK] = useState(false);

  async function handleUndo() {
    await undoThrow(matchId, leg, slow);
    setCurrentScore("0");
  }

  function handleClr() {
    setCurrentScore("0");
  }

  function handleNumber(e: any) {
    const value = (e.target as HTMLInputElement).value;
    if (Number(currentScore + value) > 180) {
      return;
    }
    const newScore = Number(currentScore + value);
    if (impossibleScore.includes(newScore)) {
      return;
    }
    if (currentPlayerScore - newScore == 1) {
      return;
    }
    if (currentPlayerScore < newScore) {
      return;
    }
    if (currentPlayerScore == 2 && newScore == 1) {
      return;
    }
    if (currentPlayerScore == newScore && newScore % 2 != 0) {
      return;
    }
    if (currentScore === "0") {
      setCurrentScore(value);
      return;
    }

    setCurrentScore(currentScore + value);
  }

  function handleSubmit(e: any) {
    const value = (e.target as HTMLInputElement).value;
    if (Number(currentScore) > 180) return;
  }

  return (
    <form className="grid grid-cols-3 gap-1 w-screen h-full">

      <GamepadServerButton
        name="UNDO"
        color="bg-orange-700"
        formAction={handleUndo}
      />
          <input type="text" disabled required value={Number(currentScore)} onChange={e => {
            const value = Number(e.target.value);
            if (value >= 0 && value <= 180) setCurrentScore(e.target.value)
          }} className="flex items-center text-center  justify-center border-2 font-bold text-6xl text-white bg-slate-700  "/>
      <GamepadButton
        name="<"
        color="bg-orange-600"
        onClick={() => {
          if (currentScore.length != 0) {
            setCurrentScore(currentScore.substring(0, currentScore.length - 1))
          }
        }}
      />
      {items.map((item) => (
        <GamepadButton
          key={item}
          name={String(item)}
          color="bg-blue-700"
          onClick={handleNumber}
        />
      ))}
      <GamepadButton
        name="CLR"
        color="bg-red-600"
        onClick={handleClr}
      />
      <GamepadButton
        name="0"
        color="bg-blue-700"
        onClick={handleNumber}
      />
        <GamepadServerButton
          name="OK"
          color="bg-green-700"
          disabled={disabledOK}
          formAction={async() => {
            await addThrowAction(tournamentId, matchId, leg, player, Number(currentScore), slow);
            setCurrentScore("0")
          }}
        />
    </form>
  );
}
