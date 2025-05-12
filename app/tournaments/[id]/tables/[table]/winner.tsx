'use client'

import { undoThrow } from "@/app/lib/playerThrow";
import GamepadButton from "./gamepad-button";
import { finishMatch } from "@/app/lib/cuescore";
import { Match } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react"

export default function Winner({ player, image, match, leg, slow, table }: { player: string, image: string, match: Match, leg: number, slow: boolean, table: string }) {

  const router = useRouter();

  useEffect(() => {
    const comInterval = setInterval(() => {
      finishMatch(match.tournamentId, match.id, match.playerALegs, match.playerBlegs, table)
    }, 20000); //This will refresh the data at regularIntervals of refreshTime
    return () => clearInterval(comInterval) //Clear interval on component unmount to avoid memory leak
  }, [])

  return (
    <div className="flex flex-col text-center justify-center items-center content-center">
      Winner:
      <img src={image} className="w-20"></img>
      <div className={"flex p-2 text-2xl font-bold"}>
        {player}
      </div>
      <div className="flex flex-col p-1 m-1">
        <GamepadButton
          name="Finish Match"
          color="bg-green-600 p-5 border border-2 round flex flex-col"
          onClick={async () => await finishMatch(match.tournamentId, match.id, match.playerALegs, match.playerBlegs, table)}
        />
        <GamepadButton
          name="Undo"
          color="bg-orange-600 p-5 border border-2 round flex felx-col"
          onClick={async () => await undoThrow(match.id, leg, slow, table)}
        />
      </div>
    </div>
  );
}