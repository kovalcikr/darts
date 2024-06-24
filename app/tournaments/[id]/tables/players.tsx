import { startMatch } from "@/app/lib/match";
import PlayerName from "./[table]/player-name";
import { revalidatePath } from "next/cache";
import { Match } from "@prisma/client";

export default async function Players({ match, nextPlayer } : { match : Match, nextPlayer: string }) {

    const activeAPlayer = nextPlayer === match.playerAId;

    if (!match.firstPlayer) 
    {
        return (<>
        <div className="flex">
         Choose starting player:
        </div>
        <div className="flex">
          <form action={startMatch}>
            <input type="hidden" name="firstPlayer" value={match.playerAId} />
            <input type="hidden" name="matchId" value={match.id} />
            <button type="submit"><PlayerName playerName={match.playerAName} playerImage={match.playerAImage} active={false} /></button>
            </form>
          <form action={startMatch}>
            <input type="hidden" name="firstPlayer" value={match.playerBId} />
            <input type="hidden" name="matchId" value={match.id} />
            <button type="submit">
            <PlayerName playerName={match.playerBName} playerImage={match.playerBImage} active={false} />
            </button>
            </form>
        </div>
        </>)
    }
    return (
        <div className="flex">
            <PlayerName playerName={match.playerAName} playerImage={match.playerAImage} active={activeAPlayer}/>
            <PlayerName playerName={match.playerBName} playerImage={match.playerBImage} active={!activeAPlayer} />
        </div>
    )
    
}