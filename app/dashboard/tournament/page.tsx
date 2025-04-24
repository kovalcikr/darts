import Image from 'next/image';

export default function TournamentDashboardPage() {
    return (
        <div className="grid grid-cols-3 grid-rows-2 h-screen w-full">
            <TableDashboard tableId="1" />
            <TableDashboard tableId="2" />
            <TableDashboard tableId="3" />
            <TableDashboard tableId="4" />
            <TableDashboard tableId="5" />
            <TableDashboard tableId="6" />
        </div>
    );
};

export function TableDashboard({ tableId }: { tableId: string }) {
    return (
        <div className="col-span-1 row-span-1 bg-blue-50 p-6 flex flex-col items-center justify-center space-y-6 rounded-lg shadow-md border border-blue-200">
            <div className="w-full flex flex-col items-center space-y-4">
                {/* Table Name */}
                <h1 className="text-2xl font-bold text-blue-800">Table {tableId}</h1>

                <div className="w-full flex justify-between items-center space-x-6">
                    <Player playerId="1" tableId={tableId} active />

                    {/* VS */}
                    <div className="text-center flex-none">
                        <h2 className="text-2xl font-bold text-blue-800">VS</h2>
                    </div>

                    {/* Player 2 */}
                    <Player playerId="2" tableId={tableId} />
                </div>
            </div>
        </div>

    );
}

export function Player({ playerId, tableId, active }: { playerId: string, tableId: string, active?: boolean }) {
    return (
        <div className={`flex flex-col items-center space-y-4 flex-1 ${active ? "bg-yellow-50" : ""}`}>
            <img
            src={"https://img.cuescore.com/image/3/2/3705f760e00f952a5e950b22061287b5.png"}
            alt={`Player ${tableId} - ${playerId}`}
            className="w-28 h-28"
            />
            <h2 className="text-xl text-center px-1 font-bold text-blue-700">Avbraham Likoln Mayki {tableId} - {playerId}</h2>
            <div className="text-center">
            <p className="text-xl text-blue-600">Legs Won: <span className="font-semibold text-blue-800 text-2xl">3</span></p>
            <p className="text-xl text-blue-600">Leg Score: <span className="font-semibold text-blue-800 text-2xl">501</span></p>
            </div>
            <div className="text-center">
            <p className="text-lg font-semibold text-blue-700">Last Throws:</p>
            <p className="text-lg text-blue-600">
            <span className="text-xl font-bold text-blue-800">20</span>, 18, 5
            </p>
            </div>
        </div>
    )
}