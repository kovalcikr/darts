export function selectCurrentLegStarter({
    leg,
    playerAId,
    playerBId,
    firstPlayer,
}: {
    leg?: number | null
    playerAId?: string | null
    playerBId?: string | null
    firstPlayer?: string | null
}) {
    if (!Number.isInteger(leg) || !playerAId || !playerBId || !firstPlayer) {
        return null;
    }

    if (firstPlayer !== playerAId && firstPlayer !== playerBId) {
        return null;
    }

    return leg! % 2 === 1
        ? firstPlayer
        : firstPlayer === playerAId ? playerBId : playerAId;
}
