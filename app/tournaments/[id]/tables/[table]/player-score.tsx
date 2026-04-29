import { Player } from "@/app/lib/model/fullmatch";

export default function PlayerScore({ player }: { player: Player }) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className="text-center text-white" data-testid={`player-legs-${player.id}`}>
        <span className="pl-4 text-7xl"><span className="font-bold">{player.legCount}</span></span>
      </div>
      <div
        className={`m-1 flex items-center justify-center rounded-lg p-1 text-center text-8xl ring-1 ring-white/10 ${player.active ? "bg-sky-600 text-white font-bold" : "bg-gray-800 text-slate-100"}`}
        data-testid={`player-score-${player.id}`}
      >
        {player.score}
      </div>
    </div>
  );
}
