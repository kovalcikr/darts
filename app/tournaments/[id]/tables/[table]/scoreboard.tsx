'use client'

import { useEffect, useRef, useState } from "react";
import GamepadButton from "./gamepad-button";
import { addThrowAction, redoThrow, undoThrow } from "@/app/lib/playerThrow";
import GamepadServerButton from "./gamepad-server-button";
import type { ScoreboardThrowHistoryItem } from "@/app/lib/model/fullmatch";
import {
  buildScoreboardPlayerDisplayNames,
  getThrowHistoryAccentClassName,
  type PlayerAccent,
} from "./scoreboard-display";
import { CHECKOUT_DART_OPTIONS, getAllowedCheckoutDarts } from "@/app/lib/checkout-darts";

type ScoreBoardProps = {
  tournamentId: string
  matchId: string
  leg: number
  player: string
  currentPlayerScore: number
  slow: boolean
  table: string
  throwHistory: ScoreboardThrowHistoryItem[]
  playerNames: Record<string, string>
  playerAccents: Record<string, PlayerAccent>
}

const DEFAULT_CHECKOUT_DARTS = 3;

function getDefaultCheckoutDarts(allowedCheckoutDarts: number[]) {
  if (allowedCheckoutDarts.length === 1) {
    return allowedCheckoutDarts[0];
  }

  return allowedCheckoutDarts.includes(DEFAULT_CHECKOUT_DARTS) ? DEFAULT_CHECKOUT_DARTS : null;
}

function getValidCheckoutDartsSelection(allowedCheckoutDarts: number[], selectedDarts: number | null) {
  if (allowedCheckoutDarts.length === 1) {
    return allowedCheckoutDarts[0];
  }

  return selectedDarts !== null && allowedCheckoutDarts.includes(selectedDarts) ? selectedDarts : null;
}

export function CheckoutDartsSelector({
  remainingScore,
  selectedDarts,
  onSelectedDartsChange,
}: {
  remainingScore: number
  selectedDarts: number | null
  onSelectedDartsChange: (darts: number | null) => void
}) {
  const allowedCheckoutDarts = getAllowedCheckoutDarts(remainingScore);

  useEffect(() => {
    const nextAllowedCheckoutDarts = getAllowedCheckoutDarts(remainingScore);
    const nextSelectedDarts = getValidCheckoutDartsSelection(nextAllowedCheckoutDarts, selectedDarts);

    if (nextSelectedDarts !== selectedDarts) {
      onSelectedDartsChange(nextSelectedDarts);
    }
  }, [remainingScore, selectedDarts, onSelectedDartsChange]);

  return (
    <div className="mt-4 flex justify-center gap-4">
      {CHECKOUT_DART_OPTIONS.map((option) => {
        const allowed = allowedCheckoutDarts.includes(option);

        return (
          <label
            className={`flex items-center rounded-lg bg-gray-950/60 px-4 py-2 text-lg font-semibold ring-1 ring-white/10 ${allowed ? 'text-white' : 'text-gray-500 opacity-40'}`}
            key={option}
          >
            <input
              checked={selectedDarts === option}
              className="h-7 w-7 accent-sky-400 disabled:cursor-not-allowed"
              disabled={!allowed}
              name="darts"
              onChange={() => onSelectedDartsChange(option)}
              type="radio"
              value={option}
            />
            <span className="ml-3">{option}</span>
          </label>
        )
      })}
    </div>
  )
}

export default function ScoreBoard({ tournamentId, matchId, leg, player, currentPlayerScore, slow, table, throwHistory, playerNames, playerAccents }: ScoreBoardProps) {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const [currentScore, setCurrentScore] = useState("0");
  const [disabledOK, setDisabledOK] = useState(false);
  const [dartsCount, setDartsCount] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [selectedCheckoutDarts, setSelectedCheckoutDarts] = useState<number | null>(null);
  const currentScoreRef = useRef("0");
  const playerDisplayNames = buildScoreboardPlayerDisplayNames(playerNames);

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

  async function handleRedo() {
    await redoThrow(matchId, slow, table);
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
    if (numericScore === currentPlayerScore && getAllowedCheckoutDarts(currentPlayerScore).length === 0) {
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

  function ThrowHistory() {
    const hasRedo = throwHistory.some(playerThrow => playerThrow.status === 'undone');
    const orderedThrowHistory = [...throwHistory].reverse();

    return (
      <div className="mb-2 flex h-[4dvh] min-h-8 max-h-10 shrink-0 items-center gap-2 overflow-hidden rounded-lg bg-gray-950/70 px-2 ring-1 ring-white/10" data-testid="scoreboard-throw-history">
        {throwHistory.length === 0 ? (
          <div className="h-6 flex-1" />
        ) : (
          <div className="grid min-w-0 flex-1 grid-cols-6 gap-1.5" data-testid="scoreboard-throw-history-slots">
            {orderedThrowHistory.map(playerThrow => {
              const undone = playerThrow.status === 'undone';
              const playerName = playerDisplayNames[playerThrow.playerId] ?? playerNames[playerThrow.playerId] ?? playerThrow.playerId;
              const playerAccent = playerAccents[playerThrow.playerId] ?? 'left';
              return (
                <div
                  className={`flex h-6 min-w-0 items-center gap-1 rounded-md px-1.5 text-[clamp(0.7rem,1.8dvh,0.95rem)] font-semibold ring-1 sm:px-2 ${getThrowHistoryAccentClassName(playerAccent, undone)}`}
                  data-player-accent={playerAccent}
                  data-testid={`scoreboard-history-${playerThrow.status}-${playerThrow.id}`}
                  key={`${playerThrow.status}-${playerThrow.id}`}
                  title={`${undone ? 'Undone ' : ''}${playerNames[playerThrow.playerId] ?? playerName} ${playerThrow.score}`}
                >
                  <span className="min-w-0 truncate" data-testid={`scoreboard-history-player-${playerThrow.id}`}>{playerName}</span>
                  <span className="shrink-0">{playerThrow.score}</span>
                  {playerThrow.checkout ? <span className="shrink-0 text-sky-200/80">/{playerThrow.darts}</span> : null}
                </div>
              );
            })}
          </div>
        )}
        <div className={`ml-auto h-2 w-2 shrink-0 rounded-full ${hasRedo ? 'bg-rose-300' : 'bg-gray-700'}`} aria-hidden="true" />
      </div>
    )
  }

  function DartsCount() {
    const allowedCheckoutDarts = getAllowedCheckoutDarts(currentPlayerScore);

    return (
      <div className="col-span-3 row-span-5 flex h-full min-h-0 items-center justify-center p-2">
        <div className="max-h-full w-full max-w-lg rounded-lg bg-gray-800/50 p-4 text-center ring-1 ring-white/10">
          <div className="text-sm font-medium uppercase tracking-wider text-gray-400">Darts used:</div>
          <CheckoutDartsSelector
            remainingScore={currentPlayerScore}
            selectedDarts={selectedCheckoutDarts}
            onSelectedDartsChange={setSelectedCheckoutDarts}
          />
          <div className="mt-4 flex h-16 justify-center">
            <GamepadServerButton
              name="OK"
              color="w-full max-w-64 bg-sky-500/20 text-sky-100 ring-sky-400/40 hover:bg-sky-500/30"
              disabled={!hydrated || disabledOK || selectedCheckoutDarts === null}
              formAction={async (formData: FormData) => {
                const dartsCount = Number(formData.get('darts'));
                const checkoutDarts = CHECKOUT_DART_OPTIONS.find((option) => option === dartsCount);

                if (checkoutDarts === undefined || !allowedCheckoutDarts.includes(checkoutDarts)) {
                  return;
                }
                await addThrowAction(tournamentId, matchId, leg, player, Number(currentScoreRef.current), checkoutDarts, slow, table);
                setEnteredScore("0")
                setSelectedCheckoutDarts(null);
                setDartsCount(false);
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  function ScoreBoard() {
    function handleBackspace() {
      const previousScore = currentScoreRef.current;
      const nextScore = previousScore.substring(0, previousScore.length - 1);
      setEnteredScore(nextScore.length === 0 ? "0" : nextScore);
    }

    return (
      <>
        <GamepadServerButton
          name="UNDO"
          color="bg-gray-800/80 text-gray-300 ring-white/10 hover:bg-gray-700"
          disabled={!hydrated}
          formAction={handleUndo}
        />
        <button
          aria-label="Delete last digit"
          className="relative flex h-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-lg bg-gray-950/80 px-12 text-center text-[clamp(2.75rem,9dvh,4.5rem)] font-bold text-white ring-1 ring-sky-500/30 transition-colors hover:ring-sky-400/60 disabled:cursor-not-allowed disabled:opacity-30"
          data-testid="scoreboard-backspace"
          disabled={!hydrated}
          onClick={handleBackspace}
          type="button"
        >
          <span data-testid="scoreboard-input">{Number(currentScore)}</span>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/10 px-2 py-1 text-[clamp(1rem,2.5dvh,1.5rem)] text-gray-400">
            &lt;
          </span>
        </button>
        <GamepadServerButton
          name="REDO"
          color="bg-gray-800/80 text-gray-300 ring-white/10 hover:bg-gray-700"
          disabled={!hydrated || !throwHistory.some(playerThrow => playerThrow.status === 'undone')}
          formAction={handleRedo}
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
              const allowedCheckoutDarts = getAllowedCheckoutDarts(currentPlayerScore);

              if (allowedCheckoutDarts.length === 0) {
                return;
              }

              setSelectedCheckoutDarts(getDefaultCheckoutDarts(allowedCheckoutDarts));
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
    <form className="flex h-full min-h-0 w-full flex-col bg-gray-900 p-2">
      {dartsCount ? (
        <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-5 gap-2">
          <DartsCount />
        </div>
      ) : (
        <>
          <ThrowHistory />
          <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-5 gap-2">
            <ScoreBoard />
          </div>
        </>
      )}
    </form>
  );
}
