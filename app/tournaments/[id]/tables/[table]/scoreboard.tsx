'use client'

import { useRef, useState } from "react";
import GamepadButton from "./gamepad-button";
import { addThrowAction, undoThrow } from "@/app/lib/playerThrow";
import GamepadServerButton from "./gamepad-server-button";

export default function ScoreBoard({ tournamentId, matchId, leg, player, currentPlayerScore, slow }) {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const impossibleScore = [163, 166, 169, 172, 173, 175, 176, 178, 179];
  const [currentScore, setCurrentScore] = useState("0");
  const [disabledOK, setDisabledOK] = useState(false);
  const [dartsCount, setDartsCount] = useState(false);
  const darts3ref = useRef(null);

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
    <form className="grid grid-cols-3 w-screen h-full">
      <div className={`absolute text-center mx-auto w-full flex-col border-black border-2 bg-gray-400 text-4xl ${dartsCount ? "flex" : "hidden"} `}>
        <div>Darts used:</div>
        <label className="m-7"><input className="form-radio h-7 w-7 text-gray-600" name="darts" type="radio" value={1} /><span className="w-full ml-4 text-gray-800">1</span></label>
        <label className="m-7"><input className="form-radio h-7 w-7 text-gray-600" name="darts" type="radio" value={2} /><span className="w-full ml-4 text-gray-800">2</span></label>
        <label className="m-7"><input ref={darts3ref} className="form-radio h-7 w-7 text-gray-600" name="darts" type="radio" value={3} defaultChecked /><span className="w-full ml-4 text-gray-800">3</span></label>
        <GamepadServerButton
          name="OK"
          color="bg-green-500 h-20"
          disabled={disabledOK}
          formAction={async (formData: FormData) => {
            const dartsCount = Number(formData.get('darts'));
            await addThrowAction(tournamentId, matchId, leg, player, Number(currentScore), dartsCount, slow);
            setCurrentScore("0")
            setDartsCount(false);
            darts3ref.current.checked = true;
          }}
        />
      </div>
      <GamepadServerButton
        name="UNDO"
        color="bg-yellow-600"
        formAction={handleUndo}
      />
      <input type="text" disabled required value={Number(currentScore)} onChange={e => {
        const value = Number(e.target.value);
        if (value >= 0 && value <= 180) setCurrentScore(e.target.value)
      }} className="flex items-center text-center  justify-center border-2 font-bold text-6xl text-white bg-slate-800  " />
      <GamepadButton
        name="<"
        color="bg-blue-800"
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
          color="bg-blue-600"
          onClick={handleNumber}
        />
      ))}
      <GamepadButton
        name="CLR"
        color="bg-red-500"
        onClick={handleClr}
      />
      <GamepadButton
        name="0"
        color="bg-blue-600"
        onClick={handleNumber}
      />
      <GamepadServerButton
        name="OK"
        color="bg-green-600"
        disabled={disabledOK}
        formAction={async () => {
          if (currentPlayerScore == Number(currentScore)) {
            setDartsCount(true);
            return;
          }
          await addThrowAction(tournamentId, matchId, leg, player, Number(currentScore), 3, slow);
          setCurrentScore("0")
        }}
      />
    </form>
  );
}
