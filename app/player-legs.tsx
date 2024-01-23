export default function PlayerLegs({ legs }) {
  return (
    <div className="flex flex-col basis-1/2">
      <div className="flex items-center justify-center text-center p-2 text-4xl">
        {legs}
      </div>
    </div>
  );
}
