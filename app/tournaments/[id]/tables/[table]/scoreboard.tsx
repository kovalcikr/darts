'use client'

import { useEffect, useRef, useState } from "react";
import GamepadButton from "./gamepad-button";
import { addThrowAction, undoThrow } from "@/app/lib/playerThrow";
import GamepadServerButton from "./gamepad-server-button";

export default function ScoreBoard({ tournamentId, matchId, leg, player, currentPlayerScore, slow, table }) {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const impossibleScore = [163, 166, 169, 172, 173, 175, 176, 178, 179];
  const [currentScore, setCurrentScore] = useState("0");
  const [disabledOK, setDisabledOK] = useState(false);
  const [dartsCount, setDartsCount] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const currentScoreRef = useRef("0");
  const darts3ref = useRef(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function setEnteredScore(score: string) {
    currentScoreRef.current = score;
    setCurrentScore(score);
  }

  async function handleUndo() {
    await undoThrow(matchId, leg, slow, table);
    setEnteredScore("0");
  }

  function handleClr() {
    setEnteredScore("0");
  }

  function handleNumber(e: any) {
    const value = (e.currentTarget as HTMLButtonElement).value;
    const previousScore = currentScoreRef.current;
    const nextScore = previousScore === "0" ? value : previousScore + value;
    const numericScore = Number(nextScore);

    if (numericScore > 180) {
      return;
    }
    if (impossibleScore.includes(numericScore)) {
      return;
    }
    if (currentPlayerScore - numericScore == 1) {
      return;
    }
    if (currentPlayerScore < numericScore) {
      return;
    }

    setEnteredScore(nextScore);
  }

  function handleSubmit(e: any) {
    const value = (e.target as HTMLInputElement).value;
    if (Number(currentScore) > 180) return;
  }

  function DartsCount() {
    return (
      <div className="col-span-3 row-span-5 flex h-full min-h-0 items-center justify-center p-2">
        <div className="max-h-full w-full max-w-lg rounded-lg bg-gray-800/50 p-4 text-center ring-1 ring-white/10">
          <div className="text-sm font-medium uppercase tracking-wider text-gray-400">Darts used:</div>
          <div className="mt-4 flex justify-center gap-4">
            <label className="flex items-center rounded-lg bg-gray-950/60 px-4 py-2 text-lg font-semibold text-white ring-1 ring-white/10">
              <input className="h-7 w-7 accent-sky-400" name="darts" type="radio" value={1} />
              <span className="ml-3">1</span>
            </label>
            <label className="flex items-center rounded-lg bg-gray-950/60 px-4 py-2 text-lg font-semibold text-white ring-1 ring-white/10">
              <input className="h-7 w-7 accent-sky-400" name="darts" type="radio" value={2} />
              <span className="ml-3">2</span>
            </label>
            <label className="flex items-center rounded-lg bg-gray-950/60 px-4 py-2 text-lg font-semibold text-white ring-1 ring-white/10">
              <input ref={darts3ref} className="h-7 w-7 accent-sky-400" name="darts" type="radio" value={3} defaultChecked />
              <span className="ml-3">3</span>
            </label>
          </div>
          <div className="mt-4 flex h-16 justify-center">
            <GamepadServerButton
              name="OK"
              color="w-full max-w-64 bg-sky-500/20 text-sky-100 ring-sky-400/40 hover:bg-sky-500/30"
              disabled={!hydrated || disabledOK}
              formAction={async (formData: FormData) => {
                const dartsCount = Number(formData.get('darts'));
                await addThrowAction(tournamentId, matchId, leg, player, Number(currentScoreRef.current), dartsCount, slow, table);
                setEnteredScore("0")
                darts3ref.current.checked = true;
                setDartsCount(false);
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  function ScoreBoard() {
    return (
      <>
        <GamepadServerButton
          name="UNDO"
          color="bg-gray-800/80 text-gray-300 ring-white/10 hover:bg-gray-700"
          disabled={!hydrated}
          formAction={handleUndo}
        />
        <input type="text" data-testid="scoreboard-input" disabled required value={Number(currentScore)} onChange={e => {
          const value = Number(e.target.value);
          if (value >= 0 && value <= 180) setCurrentScore(e.target.value)
        }} className="flex h-full min-h-0 items-center justify-center rounded-lg bg-gray-950/80 text-center text-[clamp(2.75rem,9dvh,4.5rem)] font-bold text-white ring-1 ring-sky-500/30" />
        <GamepadButton
          name="<"
          color="bg-gray-800/80 text-gray-300 ring-white/10 hover:bg-gray-700"
          disabled={!hydrated}
          onClick={() => {
            const previousScore = currentScoreRef.current;
            const nextScore = previousScore.substring(0, previousScore.length - 1);
            setEnteredScore(nextScore.length === 0 ? "0" : nextScore);
          }}
        />
        {items.map((item) => (
          <GamepadButton
            key={item}
            name={String(item)}
            color="bg-gray-800/60 text-white ring-white/10 hover:bg-sky-500/10 hover:text-sky-200 hover:ring-sky-500/30"
            disabled={!hydrated}
            onClick={handleNumber}
          />
        ))}
        <GamepadButton
          name="CLR"
          color="bg-rose-500/10 text-rose-200 ring-rose-500/30 hover:bg-rose-500/20"
          disabled={!hydrated}
          onClick={handleClr}
        />
        <GamepadButton
          name="0"
          color="bg-gray-800/60 text-white ring-white/10 hover:bg-sky-500/10 hover:text-sky-200 hover:ring-sky-500/30"
          disabled={!hydrated}
          onClick={handleNumber}
        />
        <GamepadServerButton
          name="OK"
          color="bg-sky-500/20 text-sky-100 ring-sky-400/40 hover:bg-sky-500/30"
          disabled={!hydrated || disabledOK}
          formAction={async () => {
            const submittedScore = Number(currentScoreRef.current);

            if (currentPlayerScore == submittedScore) {
              setDartsCount(true);
              return;
            }
            await addThrowAction(tournamentId, matchId, leg, player, submittedScore, 3, slow, table);
            setEnteredScore("0")
          }}
        />
      </>
    )
  }

  return (
    <form className="grid h-full min-h-0 w-full grid-cols-3 grid-rows-5 gap-2 bg-gray-900 p-2">
      { dartsCount ? <DartsCount /> : <ScoreBoard /> }
    </form>
  );
}
