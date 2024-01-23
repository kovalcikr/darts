export default function ScoreBox({ currentScore }: { currentScore: number }) {
  return (
    <div className="flex items-center justify-center border-2 font-bold text-6xl text-white bg-slate-700  ">
      {currentScore}
    </div>
  );
}
