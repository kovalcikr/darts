import { Player } from "@/app/lib/model/fullmatch";

export default function PlayerScore({ player }: { player: Player }) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className="text-center"> <span className="text-3xl pl-4">Legs: <span className="font-bold">{player.legCount}</span></span></div>
      <div className={`flex items-center justify-center text-center p-1 m-1 border-gray-700 bg-blue-600   ${player.active ? "text-8xl text-white font-bold rounded border-1" : "text-7xl text-slate-300"}`}>
        {player.score}
      </div>
    </div>
  );
}
