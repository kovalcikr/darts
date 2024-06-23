export default function PlayerName({playerName, playerImage, active} : { playerName: string, playerImage: string, active: boolean}) {
  return (
    <div className="flex items-center justify-center flex-row basis-1/2">
      <img src={playerImage} className="w-12 "></img>
      <div className={"flex items-center justify-center text-center p-2 text-lg font-bold" + (active ? " text-blue-700" : "")}>
        {playerName}
      </div>
    </div>
  );
}
