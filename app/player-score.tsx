export default function PlayerScore({ score } : {score : number}) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className="flex items-center justify-center text-center p-2 text-5xl border-gray-700 border-spacing-1 border bg-green-400 font-bold">
        {score}
      </div>
    </div>
  );
}
