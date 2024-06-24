export default function PlayerScore({ score, active } : {score : number, active: boolean}) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className={`flex items-center justify-center text-center p-2 text-5xl border-gray-700 border-spacing-1 border  ${active ? "bg-green-400" : "bg-green-200"} ${active ? "font-bold" : "text-slate-600"}`}>
        {score}
      </div>
    </div>
  );
}
