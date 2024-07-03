import { startMatch } from "@/app/lib/match";
import PlayerName from "./player-name";
import { revalidatePath } from "next/cache";
import { Match } from "@prisma/client";
import PlayerLegs from "./player-legs";
import { Player } from "@/app/lib/model/fullmatch";

export default async function Players({ playerA, playerB } : { playerA: Player, playerB: Player }) {

    return (
        <div className="flex">
            <PlayerName player={playerA} />
            <PlayerName player={playerB} />
        </div>
    )
    
}