'use client'

type ConfirmSubmitButtonProps = {
  children: React.ReactNode
  confirmationMessage: string
  tone?: 'danger' | 'muted'
}

export default function ConfirmSubmitButton({
  children,
  confirmationMessage,
  tone = 'danger',
}: ConfirmSubmitButtonProps) {
  const toneClassName =
    tone === 'danger'
      ? 'border-rose-500/50 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
      : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'

  return (
    <button
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${toneClassName}`}
      onClick={(event) => {
        if (!window.confirm(confirmationMessage)) {
          event.preventDefault()
        }
      }}
      type="submit"
    >
      {children}
    </button>
  )
}
