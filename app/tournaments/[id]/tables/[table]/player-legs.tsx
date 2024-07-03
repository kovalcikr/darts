import { Player } from "@/app/lib/model/fullmatch";

export default function PlayerLegs({ player } : { player: Player}) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className="flex flex-col items-center justify-center text-center p-2 text-1xl">
        <div className="p-1">Last: {player.lastThrow}</div>
        <div className="p-1">Leg Darts: {player.dartsCount}</div>
        <div className="p-1">Match Avg: {player.matchAvg?.toFixed(2)}</div>
      </div>  
    </div>
  );
}
