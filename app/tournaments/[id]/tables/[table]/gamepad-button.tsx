export default function GamepadButton({
  name,
  color,
  onClick = () => {},
} : {name: string, color: string, onClick?: any}) {

  return (
    <button
      className={`flex items-center justify-center border-2 rounded font-bold text-white ${color}`}
      onClick={onClick}
      value={name}
      type="button"
    >
      {name}
    </button>
  );
}
