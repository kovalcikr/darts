export default function GamepadButton({
  name,
  color,
  disabled = false,
  onClick = () => {},
} : {name: string, color: string, disabled?: boolean, onClick?: any}) {

  return (
    <button
      className={`flex h-full min-h-0 w-full min-w-0 items-center justify-center rounded-lg px-2 py-1 text-[clamp(1.25rem,4dvh,2rem)] font-bold ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${color}`}
      disabled={disabled}
      onClick={onClick}
      value={name}
      type="button"
    >
      {name}
    </button>
  );
}
