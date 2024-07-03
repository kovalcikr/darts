import { MouseEventHandler } from "react";

export default function GamepadButton({
  name,
  color,
  disabled = false,
  onClick = () => {},
} : {name: string, color: string, disabled?: boolean, onClick: any}) {
  
  return (
    <button
      className={`flex items-center justify-center border-2 font-bold text-white ${color}`}
      onClick={onClick}
      value={name}
      disabled={disabled}
    >
      {name}
    </button>
  );
}
