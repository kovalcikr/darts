import { Player } from "@/app/lib/model/fullmatch";

export default function PlayerName({ player }: { player: Player }) {
  return (
    <div className="flex items-center justify-center overflow-y-auto">
      <img src={player.imageUrl} alt={player.name} width={48} height={48} className="w-12 rounded-full ring-1 ring-white/10" />
      <div className={`flex h-16 items-center justify-center p-2 text-center text-xl font-bold ${player.active ? "text-sky-300" : "text-white"}`}>
        {player.name}
      </div>
    </div>
  );
}
