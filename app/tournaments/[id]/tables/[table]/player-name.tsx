import { Player } from "@/app/lib/model/fullmatch";

export default function PlayerName({ player }: { player: Player }) {
  return (
    <div className="flex h-[clamp(2.25rem,5dvh,3rem)] shrink-0 items-center justify-center overflow-hidden">
      <img src={player.imageUrl} alt={player.name} width={48} height={48} className="h-[clamp(2rem,4.5dvh,2.75rem)] w-[clamp(2rem,4.5dvh,2.75rem)] rounded-full ring-1 ring-white/10" />
      <div className={`flex min-w-0 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap px-2 text-center text-[clamp(1rem,2.7dvh,1.25rem)] font-bold ${player.active ? "text-sky-300" : "text-white"}`}>
        {player.name}
      </div>
    </div>
  );
}
