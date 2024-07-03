'use client'

import { undoThrow } from "@/app/lib/playerThrow";
import GamepadButton from "./gamepad-button";
import { finishMatch } from "@/app/lib/cuescore";
import { Match } from "@prisma/client";

export default function Winner({ player, image, match, leg, slow }: { player: string, image: string, match: Match, leg: number, slow: boolean }) {
    return (
        <div className="flex flex-col text-center justify-center items-center content-center">
        Winner: 
        <img src={image} className="w-28 "></img>
  <div className={"flex p-2 text-3xl font-bold"}>
  {player}
  </div>
  <div className="flex flex-col p-1 m-1">  <GamepadButton
        name="Undo"
        color="bg-orange-700 p-8 border flex felx-col"
        onClick={async () => await undoThrow(match.id, leg, slow)}
      /></div>
        <GamepadButton
        name="Finish Match"
        color="bg-green-700 p-8 border flex flex-col"
        onClick={async () => await finishMatch(match.tournamentId, match.id, match.playerALegs, match.playerBlegs)}
      />
        </div>
    );
  }