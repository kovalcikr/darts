import { findPlayersByTournament } from "./data";

export async function getPlayers(tournaments) : Promise<any> {
    const { playersA, playersB } = await findPlayersByTournament(tournaments);
    const players = {};
    playersA.forEach(value => {
        if (value.playerAId) {
            players[value.playerAId] = value.playerAName
        }
    })
    playersB.forEach(value => {
        if (value.playerBId) {
            players[value.playerBId] = value.playerBName
        }
    })

    return players;
}