export default function GamepadServerButton({
  name,
  color,
  disabled = false,
  formAction
}: { name: string, color: string, disabled?: boolean, formAction?: any }) {
  return (
    <button
      className={`flex h-full min-h-0 w-full min-w-0 items-center justify-center rounded-lg px-2 py-1 text-[clamp(1.25rem,4dvh,2rem)] font-bold ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${color}`}
      value={name}
      disabled={disabled}
      type="submit"
      formAction={formAction}
    >
      {name}
    </button>
  );
}
