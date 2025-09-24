import { Player } from "@/app/lib/model/fullmatch";
import Image from "next/image";

export default function PlayerName({ player }: { player: Player }) {
  return (
    <div className="flex items-center justify-center overflow-y-auto">
      <Image src={player.imageUrl} alt={player.name} width={48} height={48} className="w-12 " />
      <div className={"flex h-16 items-center justify-center text-center p-2 text-xl font-bold" + (player.active && " text-blue-700")}>
        {player.name}
      </div>
    </div>
  );
}
