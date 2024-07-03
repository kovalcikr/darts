'use client'

import { MouseEventHandler, useState } from "react";
import GamepadButton from "./gamepad-button";
import { addThrowAction, undoThrow } from "@/app/lib/playerThrow";
import { useFormStatus } from "react-dom";

export default function ScoreBoard({ tournamentId, matchId, leg, player }) {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const [currentScore, setCurrentScore] = useState("0");

  async function handleUndo() {
    await undoThrow(matchId, leg);
    setCurrentScore("0");
  }

  function handleClr() {
    setCurrentScore("0");
  }

  function handleNumber(e: any) {
    const value = (e.target as HTMLInputElement).value;
    if (currentScore === "0") {
      setCurrentScore(value);
      return;
    }
    if (Number(currentScore + value) > 180) {
      return;
    }
    setCurrentScore(currentScore + value);
  }

  function handleSubmit(e: any) {
    const value = (e.target as HTMLInputElement).value;
    if (Number(currentScore) > 180) return;
  }

  return (
    <div className="grid grid-cols-3 gap-1 w-screen h-full">
      <GamepadButton
        name="UNDO"
        color="bg-orange-700"
        onClick={handleUndo}
      />
          <input type="text" autoFocus={true} required={true} value={Number(currentScore)} onChange={e => {
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
      <form action={async() => {
        await addThrowAction(tournamentId, matchId, leg, player, Number(currentScore));
        setCurrentScore("0")
      }}>
        <GamepadButton
          name="OK"
          color="bg-green-700"
          onClick={async () => {
            
          }}
        />
      </form>
    </div>
  );
}
