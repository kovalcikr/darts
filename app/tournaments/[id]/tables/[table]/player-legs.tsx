export default function PlayerLegs({ last, avg, darts } : { last : number, avg: number, darts: number}) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className="flex flex-row items-center justify-center text-center p-2 text-1xl">
        <div className="p-3">Last: {last}</div>
        <div className="p-3">Leg Darts: {darts}</div>
        <div className="p-3">Match Avg: {avg}</div>
      </div>  
    </div>
  );
}
