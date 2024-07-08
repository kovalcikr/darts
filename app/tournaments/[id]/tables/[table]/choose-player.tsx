import { startMatch } from "@/app/lib/match";
import { Match } from "@prisma/client";
import PlayerName from "./player-name";

export default function ChoosePlayer({ match }: { match: Match }) {
    return (
        <div className="flex flex-col text-center text-gray-800 font-bold">
            <div className="text-3xl">
                First to play:
            </div>
            <form action={startMatch}>
                <input type="hidden" name="matchId" value={match.id} />
                <Player playerId={match.playerAId} image={match.playerAImage} name={match.playerAName} />
                <Player playerId={match.playerBId} image={match.playerBImage} name={match.playerBName} />
            </form>
        </div >
    )
}

function Player({ playerId, image, name }) {
    return (
        <button type="submit" name="firstPlayer" value={playerId}>
            <div className="flex flex-col">
                <div className="p-4 m-6 border-slate-400 border-2 bg-blue-300 rounded shadow">
                    <div className="flex items-center justify-center flex-row basis-1/2">
                        <img src={image} className="w-14 "></img>
                        <div className={"flex items-center justify-center text-center p-2 text-3xl"}>
                            {name}
                        </div>
                    </div>
                </div>
            </div>
        </button>
    )
}