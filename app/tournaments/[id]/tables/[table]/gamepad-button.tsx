export default function GamepadButton({
  name,
  color,
  disabled = false,
  onClick = () => {},
} : {name: string, color: string, disabled?: boolean, onClick?: any}) {

  return (
    <button
      className={`flex items-center justify-center border-2 rounded font-bold text-white ${color} disabled:opacity-25`}
      disabled={disabled}
      onClick={onClick}
      value={name}
      type="button"
    >
      {name}
    </button>
  );
}
