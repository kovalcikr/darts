'use client'

import { startMatch } from "@/app/lib/match";
import type { Match } from "@/prisma/client";
import { useFormStatus } from "react-dom";

export default function ChoosePlayer({ match, table }: { match: Match, table: string }) {

    return (
        <div className="flex flex-col text-center font-bold text-white">
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
        <button
            type="submit"
            name="firstPlayer"
            value={playerId}
            disabled={pending}
            aria-label={`Start with ${name}`}
            data-testid={`start-player-${playerId}`}
        >
            <div className="flex flex-col">
                <div className={`m-6 rounded-lg bg-gray-800/50 p-4 ring-1 ring-white/10 transition hover:bg-gray-800 hover:ring-sky-500/40 ${pending ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-center flex-row basis-1/2">
                        <img src={image} alt={name} width={56} height={56} className="w-14 rounded-full ring-1 ring-white/10" />
                        <div className={"flex items-center justify-center text-center p-2 text-3xl"}>
                            {name}
                        </div>
                    </div>
                </div>
            </div>
        </button>
    )
}
