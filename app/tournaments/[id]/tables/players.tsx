import { startMatch } from "@/app/lib/match";
import PlayerName from "./[table]/player-name";
import { revalidatePath } from "next/cache";
import { Match } from "@prisma/client";
import PlayerLegs from "./[table]/player-legs";

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
            <button type="submit"><PlayerName playerName={match.playerAName} playerImage={match.playerAImage} playerLegs="" active={false} /></button>
            </form>
          <form action={startMatch}>
            <input type="hidden" name="firstPlayer" value={match.playerBId} />
            <input type="hidden" name="matchId" value={match.id} />
            <button type="submit">
            <PlayerName playerName={match.playerBName} playerImage={match.playerBImage} playerLegs="" active={false} />
            </button>
            </form>
        </div>
        </>)
    }
    return (
        <div className="flex">
            <PlayerName playerName={match.playerAName} playerImage={match.playerAImage} playerLegs={`(${match.playerALegs})`} active={activeAPlayer}/>
            <PlayerName playerName={match.playerBName} playerImage={match.playerBImage} playerLegs={`(${match.playerBlegs})`} active={!activeAPlayer} />
        </div>
    )
    
}