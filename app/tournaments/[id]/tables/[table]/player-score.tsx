import { Player } from "@/app/lib/model/fullmatch";

export default function PlayerScore({ player } : { player: Player }) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className={`flex items-center justify-center text-center p-2 text-5xl border-gray-700 border-spacing-1 border  ${player.active ? "bg-green-400 font-bold" : "bg-green-200 text-slate-600"}`}>
        {player.score} <span className="text-2xl pl-4">({player.legCount})</span>
      </div>
    </div>
  );
}
