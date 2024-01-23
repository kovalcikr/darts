export default function GamepadButton({
  name,
  color,
  hover,
  onClick = () => {},
}) {
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
