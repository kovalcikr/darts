import { Player } from "@/app/lib/model/fullmatch";

export default function PlayerScore({ player }: { player: Player }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 py-1 sm:flex-row">
      <div className="flex h-[clamp(3rem,8dvh,4rem)] w-full shrink-0 flex-col items-center justify-center rounded-lg bg-gray-950/40 text-center text-white ring-1 ring-white/10 sm:h-auto sm:w-[clamp(3.5rem,9dvh,5rem)]" data-testid={`player-legs-${player.id}`}>
        <span className="text-[clamp(0.65rem,1.6dvh,0.8rem)] uppercase tracking-wider text-gray-500">Legs</span>
        <span className="text-[clamp(1.75rem,6dvh,3.5rem)] font-bold leading-none">{player.legCount}</span>
      </div>
      <div
        className={`flex min-h-0 flex-1 items-center justify-center rounded-lg p-1 text-center text-[clamp(3rem,12dvh,6rem)] leading-none ring-1 ${player.active ? "bg-sky-500/20 text-white font-bold ring-sky-400/50" : "bg-gray-950/60 text-slate-100 ring-white/10"}`}
        data-testid={`player-score-${player.id}`}
      >
        {player.score}
      </div>
    </div>
  );
}
