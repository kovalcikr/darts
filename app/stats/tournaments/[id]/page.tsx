import getTournamentInfo from "@/app/lib/cuescore";
import prisma from "@/app/lib/db";

export default async function TournamentStats({ params }: { params: { id: string } }) {

    const highScore = await prisma.playerThrow.findMany({
        where: {
            AND: [
                {
                    tournamentId: params.id
                },
                {
                    score: {
                        gte: 171
                    }
                }
            ]
        }
    })

    return (
        <div>
            <h1>Turnaj 1</h1>
            <div>Počet hráčov</div>
            <div>
                <ol>
                    <li>1.</li>
                    <li>2.</li>
                    <li>3.</li>
                </ol>
            </div>
            <div>
                180: { highScore.filter(s => s.score == 180).map(s => (
                    <li key={s.id}>{ s.playerId }</li>
                )) }
            </div>
            <div>
                171+: { highScore.filter(s => s.score != 180).map(s => (
                    <li key={s.id}>{ s.playerId }</li>
                )) }
            </div>
            <div>
                Naj checkout:
            </div>
            <div>
                Najvyssi priemer:
            </div>
            <div>
                Naj leg:
            </div>
        </div>
    )
}