export default function GamepadServerButton({
  name,
  color,
  disabled = false,
  formAction,
  isLoading = false,
}: { name: string, color: string, disabled?: boolean, formAction?: any, isLoading?: boolean }) {
  return (
    <button
      className={`flex h-full min-h-0 w-full min-w-0 items-center justify-center rounded-lg px-2 py-1 text-[clamp(1.25rem,4dvh,2rem)] font-bold ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${color}`}
      value={name}
      disabled={disabled || isLoading}
      type="submit"
      formAction={formAction}
    >
      {isLoading ? (
        <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
      ) : (
        name
      )}
    </button>
  );
}
