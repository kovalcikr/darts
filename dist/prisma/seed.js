"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.playerThrow.deleteMany();
    await prisma.match.deleteMany();
    await prisma.tournament.deleteMany();
    const tournament = await prisma.tournament.create({
        data: {
            name: 'Relax Darts CUP 13 2024',
            id: 'relax-darts-cup-13-2024',
        },
    });
    const match = await prisma.match.create({
        data: {
            id: 'test-match',
            round: '1',
            playerAId: 'player-a',
            playerAName: 'Player A',
            playerAImage: '',
            playerBId: 'player-b',
            playerBName: 'Player B',
            playerBImage: '',
            runTo: 3,
            tournamentId: tournament.id,
        }
    });
    await prisma.playerThrow.createMany({
        data: [
            {
                tournamentId: tournament.id,
                matchId: match.id,
                leg: 1,
                playerId: 'player-a',
                score: 100,
                darts: 3,
            },
            {
                tournamentId: tournament.id,
                matchId: match.id,
                leg: 1,
                playerId: 'player-b',
                score: 50,
                darts: 3,
            },
            {
                tournamentId: tournament.id,
                matchId: match.id,
                leg: 1,
                playerId: 'player-a',
                score: 140,
                darts: 3,
                checkout: true,
            },
        ],
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
