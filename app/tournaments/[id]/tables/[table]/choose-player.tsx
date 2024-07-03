import { startMatch } from "@/app/lib/match";
import { Match } from "@prisma/client";
import PlayerName from "./player-name";

export default function ChoosePlayer({ match }: { match: Match }) {
    return (
        <div className="flex flex-col text-center">
            <div className="text-2xl text-gray-800">
                First to play:
            </div>
            <div className="flex flex-col">
                <div className="p-10">
                    <form action={startMatch}>
                        <input type="hidden" name="firstPlayer" value={match.playerAId} />
                        <input type="hidden" name="matchId" value={match.id} />
                        <button type="submit">
                            <div className="flex items-center justify-center flex-row basis-1/2">
                                <img src={match.playerAImage} className="w-12 "></img>
                                <div className={"flex items-center justify-center text-center p-2 text-lg font-bold"}>
                                    {match.playerAName}
                                </div>
                            </div>
                        </button>
                    </form>
                </div>
                <div className="p-10">
                    <form action={startMatch}>
                        <input type="hidden" name="firstPlayer" value={match.playerBId} />
                        <input type="hidden" name="matchId" value={match.id} />
                        <button type="submit">
                            <div className="flex items-center justify-center flex-row basis-1/2">
                                <img src={match.playerBImage} className="w-12 "></img>
                                <div className={"flex items-center justify-center text-center p-2 text-lg font-bold"}>
                                    {match.playerBName}
                                </div>
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}