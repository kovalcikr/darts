export default function PlayerLegs({ last, avg, darts } : { last : number, avg: string, darts: number}) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className="flex flex-col items-center justify-center text-center p-2 text-1xl">
        <div className="p-1">Last: {last}</div>
        <div className="p-1">Leg Darts: {darts}</div>
        <div className="p-1">Match Avg: {avg}</div>
      </div>  
    </div>
  );
}
