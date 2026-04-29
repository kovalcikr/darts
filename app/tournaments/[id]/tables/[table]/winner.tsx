'use client'

import { undoThrow } from "@/app/lib/playerThrow";
import GamepadButton from "./gamepad-button";
import { finishMatch } from "@/app/lib/cuescore";
import type { Match } from "@/prisma/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react"

export default function Winner({ player, image, match, leg, slow, table }: { player: string, image: string, match: Match, leg: number, slow: boolean, table: string }) {

  const router = useRouter();

  useEffect(() => {
    const comInterval = setInterval(() => {
      finishMatch(match.tournamentId, match.id, match.playerALegs, match.playerBlegs, table)
    }, 20000); //This will refresh the data at regularIntervals of refreshTime
    return () => clearInterval(comInterval) //Clear interval on component unmount to avoid memory leak
  }, [match.tournamentId, match.id, match.playerALegs, match.playerBlegs, table])

  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-gray-300">
      <div className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Winner:</div>
      <img src={image} alt={player} width={80} height={80} className="mt-4 w-20 rounded-full ring-1 ring-white/10" />
      <div className={"flex p-2 text-2xl font-bold text-white"}>
        {player}
      </div>
      <div className="flex flex-col p-1 m-1">
        <GamepadButton
          name="Finish Match"
          color="bg-sky-500/20 p-5 text-sky-100 ring-sky-400/40 hover:bg-sky-500/30"
          onClick={async () => await finishMatch(match.tournamentId, match.id, match.playerALegs, match.playerBlegs, table)}
        />
        <GamepadButton
          name="Undo"
          color="bg-gray-800/80 p-5 text-gray-300 ring-white/10 hover:bg-gray-700"
          onClick={async () => await undoThrow(match.id, leg, slow, table)}
        />
      </div>
    </div>
  );
}
