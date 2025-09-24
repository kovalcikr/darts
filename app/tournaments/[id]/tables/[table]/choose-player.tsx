'use client'

import { startMatch } from "@/app/lib/match";
import { Match } from "@prisma/client";
import { useFormStatus } from "react-dom";
import Image from "next/image";

export default function ChoosePlayer({ match, table }: { match: Match, table: string }) {

    return (
        <div className="flex flex-col text-center text-gray-800 font-bold">
            <div className="text-3xl">
                First to play:
            </div>
            <form action={startMatch}>
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="table" value={table} />
                <Players match={match} />
            </form>
        </div >
    )
}

function Players({ match }) {
    const { pending } = useFormStatus();

    return (
        <div className="relative">
            <Player playerId={match.playerAId} image={match.playerAImage} name={match.playerAName} />
            <Player playerId={match.playerBId} image={match.playerBImage} name={match.playerBName} />
            {pending &&
                <div className="absolute top-24 z-10 w-full m-auto">
                    <span className={"loader"}></span>
                </div>
            }
        </div>
    )
}

function Player({ playerId, image, name }) {
    const { pending } = useFormStatus();

    return (
        <button type="submit" name="firstPlayer" value={playerId} disabled={pending}>
            <div className="flex flex-col">
                <div className={`p-4 m-6 border-slate-400 border-2 bg-blue-300 rounded shadow ${pending && "bg-slate-200"}`}>
                    <div className="flex items-center justify-center flex-row basis-1/2">
                        <Image src={image} alt={name} width={56} height={56} className="w-14 " />
                        <div className={"flex items-center justify-center text-center p-2 text-3xl"}>
                            {name}
                        </div>
                    </div>
                </div>
            </div>
        </button>
    )
}