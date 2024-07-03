import { useFormStatus } from "react-dom";

export default function GamepadServerButton({
  name,
  color,
  formAction
} : {name: string, color: string, disabled?: boolean, formAction?: any}) {

  const { pending } = useFormStatus();
  
  return (
    <button
      className={`flex items-center justify-center border-2 font-bold text-white ${color} disabled:opacity-25 `}
      value={name}
      disabled={pending}
      type="submit"
      formAction={formAction}
    >
      {name}
    </button>
  );
}
