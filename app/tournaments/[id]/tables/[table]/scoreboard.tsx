import { MouseEventHandler, useState } from "react";
import ScoreBox from "./scorebox";
import GamepadButton from "./gamepad-button";

export default function ScoreBoard({
  currentPlayer,
  onSubmit = (score: number) => {},
  onUndo = () => {},
}: {
  currentPlayer: Player;
  onSubmit: Function;
  onUndo: Function;
}) {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const [currentScore, setCurrentScore] = useState("0");

  function handleUndo() {
    setCurrentScore("0");
    onUndo();
  }

  function handleClr() {
    setCurrentScore("0");
  }

  function handleNumber(e: any) {
    const value = (e.target as HTMLInputElement).value;
    if (currentScore === "0") {
      setCurrentScore(value);
      return;
    }
    if (Number(currentScore + value) > 180) {
      return;
    }
    setCurrentScore(currentScore + value);
  }

  function handleSubmit(e: any) {
    const value = (e.target as HTMLInputElement).value;
    const score = value == "REM" ? currentPlayer.score : currentScore;
    if (Number(score) > 180) return;
    setCurrentScore("0");
    onSubmit(score);
  }

  return (
    <div className="grid grid-cols-3 gap-1 w-screen h-full">
      <GamepadButton
        name="UNDO"
        color="bg-orange-700"
        hover="bg-orange-400"
        onClick={handleUndo}
      />
      <ScoreBox currentScore={Number(currentScore)} />
      <div
        color="bg-yellow-700"
      />

      {items.map((item) => (
        <GamepadButton
          key={item}
          name={String(item)}
          color="bg-blue-700"
          hover="bg-blue-400"
          onClick={handleNumber}
        />
      ))}
      <GamepadButton
        name="CLR"
        color="bg-red-600"
        hover="bg-red-400"
        onClick={handleClr}
      />
      <GamepadButton
        name="0"
        color="bg-blue-700"
        hover="bg-blue-400"
        onClick={handleNumber}
      />
      <GamepadButton
        name="OK"
        color="bg-green-700"
        hover="bg-green-400"
        onClick={handleSubmit}
      />
    </div>
  );
}
