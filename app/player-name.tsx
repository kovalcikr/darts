export default function PlayerName({player, active}) {
  return (
    <div className="flex items-center justify-center flex-row basis-1/2">
      <img src={player.image} className="w-12 "></img>
      <div className={"flex items-center justify-center text-center p-2 text-lg font-bold" + (active ? " text-blue-700" : "")}>
        {player.name}
      </div>
    </div>
  );
}
