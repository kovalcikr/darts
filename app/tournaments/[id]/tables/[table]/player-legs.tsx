import { Player } from "@/app/lib/model/fullmatch";

export default function PlayerLegs({ player }: { player: Player }) {
  return (
    <div className="shrink-0">
      <div className="grid grid-cols-3 gap-1 text-center text-[clamp(0.7rem,1.8dvh,0.9rem)] text-gray-400">
        <div className="rounded bg-gray-950/40 px-1 py-1 ring-1 ring-white/10">Last: {player.lastThrow}</div>
        <div className="rounded bg-gray-950/40 px-1 py-1 ring-1 ring-white/10">Darts: {player.dartsCount}</div>
        <div className="rounded bg-gray-950/40 px-1 py-1 ring-1 ring-white/10">Avg: {player.matchAvg?.toFixed(2)}</div>
      </div>
    </div>
  );
}
