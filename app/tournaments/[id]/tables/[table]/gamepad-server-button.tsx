import { useFormStatus } from "react-dom";

export default function GamepadServerButton({
  name,
  color,
  disabled = false,
  formAction
}: { name: string, color: string, disabled?: boolean, formAction?: any }) {

  const { pending } = useFormStatus();

  return (
    <button
      className={`flex h-full min-h-0 items-center justify-center rounded-lg px-2 py-1 text-[clamp(1.25rem,4dvh,2rem)] font-bold ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${color}`}
      value={name}
      disabled={pending || disabled}
      type="submit"
      formAction={formAction}
    >
      {name}
      <div className={`${!pending && "hidden"}`}>
        <span className={"loader"}></span>
      </div>
    </button>
  );
}
