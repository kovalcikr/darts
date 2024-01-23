import { MouseEventHandler } from "react";

export default function GamepadButton({
  name,
  color,
  hover,
  onClick = () => {},
} : {name: string, color: string, hover: string, onClick: MouseEventHandler<HTMLButtonElement>}) {
  return (
    <button
      className={
        "flex items-center justify-center border-2 font-bold text-white " +
        color +
        " hover:" +
        hover
      }
      onClick={onClick}
      value={name}
    >
      {name}
    </button>
  );
}
