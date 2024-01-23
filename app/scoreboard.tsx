import { useState } from "react";
import ScoreBox from "./scorebox";
import GamepadButton from "./gamepad-button";

export default function ScoreBoard({ currentPlayer, onSubmit=() => {}, onUndo=() => {} }) {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const [currentScore, setCurrentScore] = useState("0");

  function handleUndo() {
    setCurrentScore("0");
    onUndo();
  }

  function handleClr() {
    setCurrentScore("0");
  }

  function handleNumber(e) {
    if (currentScore === "0") {
        setCurrentScore(e.target.value);
        return;
    }
    if (Number(currentScore + e.target.value) > 180) {
        return;
    }
    setCurrentScore(currentScore + e.target.value);
  }

  function handleSubmit(e) {
    const score = e.target.value === "REM" ? currentPlayer.score : currentScore;
    if (score > 180) return;
    setCurrentScore("0");
    onSubmit(score);
  }

  return (
    <div className="grid grid-cols-3 gap-1 w-screen h-full">
      <GamepadButton name="UNDO" color="bg-orange-700" hover="bg-orange-400" onClick={handleUndo} />
      <ScoreBox currentScore={currentScore} />
      <GamepadButton name="REM" color="bg-yellow-700" hover="bg-yellow-400" onClick={handleSubmit} />

      {items.map((item) => (
        <GamepadButton name={item} color="bg-blue-700" hover="bg-blue-400" onClick={handleNumber} />
      ))}
      <GamepadButton name="CLR" color="bg-red-600" hover="bg-red-400" onClick={handleClr} />
      <GamepadButton name="0" color="bg-blue-700" hover="bg-blue-400" onClick={handleNumber}/>
      <GamepadButton name="OK" color="bg-green-700" hover="bg-green-400" onClick={handleSubmit} />
    </div>
  );
}
