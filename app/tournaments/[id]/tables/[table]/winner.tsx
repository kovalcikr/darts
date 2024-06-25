'use client'

import { undoThrow } from "@/app/lib/playerThrow";
import GamepadButton from "./gamepad-button";
import { finishMatch } from "@/app/lib/cuescore";
import { Match } from "@prisma/client";
import { revalidatePath } from "next/cache";

export default function Winner({ player, image, match, leg }: { player: string, image: string, match: Match, leg: number }) {
    return (
        <>
        winner: 
        <img src={image} className="w-20 "></img>
  <div className={"flex p-2 text-2xl font-bold"}>
  {player}
  </div>
  <GamepadButton
        name="Undo"
        color="bg-orange-700"
        hover="bg-orange-400"
        onClick={async () => await undoThrow(match.id, leg)}
      />
        <GamepadButton
        name="Finish Match"
        color="bg-green-700"
        hover="bg-green-400"
        onClick={async () => await finishMatch(match.tournamentId, match.id, match.playerALegs, match.playerBlegs)}
      />
        </>
    );
  }