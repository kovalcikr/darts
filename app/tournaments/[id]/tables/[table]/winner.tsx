export default function Winner({ player, image }: { player: string, image: string }) {
    return (
        <>
        winner: 
        <img src={image} className="w-20 "></img>
  <div className={"flex p-2 text-2xl font-bold"}>
  {player}
  </div>
        </>
    );
  }