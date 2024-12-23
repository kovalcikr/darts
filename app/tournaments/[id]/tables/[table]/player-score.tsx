import { Player } from "@/app/lib/model/fullmatch";

export default function PlayerScore({ player }: { player: Player }) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className="text-center"> <span className="text-7xl pl-4"><span className="font-bold">{player.legCount}</span></span></div>
      <div className={`flex items-center justify-center text-center p-1 m-1 border-gray-700 bg-blue-600 text-8xl ${player.active ? " text-white font-bold rounded border-1" : "text-slate-100"}`}>
        {player.score}
      </div>
    </div>
  );
}
