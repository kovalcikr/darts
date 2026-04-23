import Link from 'next/link'

export function MessageBanner({
  tone,
  message,
}: {
  tone: 'notice' | 'error'
  message: string
}) {
  const toneClassName =
    tone === 'notice'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
      : 'border-rose-500/40 bg-rose-500/10 text-rose-100'

  return <div className={`rounded-xl border px-4 py-3 text-sm ${toneClassName}`}>{message}</div>
}

export function TextField({
  label,
  name,
  defaultValue,
  required = false,
  type = 'text',
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  required?: boolean
  type?: string
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
      <span>{label}</span>
      <input
        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal tracking-normal text-slate-100 outline-none transition focus:border-cyan-400"
        defaultValue={defaultValue ?? ''}
        name={name}
        required={required}
        type={type}
      />
    </label>
  )
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string
  name: string
  defaultChecked: boolean
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
      <input defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span>{label}</span>
    </label>
  )
}

export function ActionButton({
  children,
  tone = 'primary',
  type = 'submit',
}: {
  children: React.ReactNode
  tone?: 'primary' | 'danger' | 'muted'
  type?: 'submit' | 'button'
}) {
  const toneClassName =
    tone === 'primary'
      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20'
      : tone === 'danger'
        ? 'border-rose-500/50 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
        : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'

  return (
    <button
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${toneClassName}`}
      type={type}
    >
      {children}
    </button>
  )
}

export function ActionLink({
  children,
  href,
  tone = 'muted',
}: {
  children: React.ReactNode
  href: string
  tone?: 'primary' | 'muted'
}) {
  const toneClassName =
    tone === 'primary'
      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20'
      : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'

  return (
    <Link
      className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition ${toneClassName}`}
      href={href}
    >
      {children}
    </Link>
  )
}

export function SectionShell({
  title,
  description,
  count,
  children,
}: {
  title: string
  description: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        <div className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200">
          {count} records
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function EditDisclosure({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
        Edit
      </summary>
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">{children}</div>
    </details>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-sm text-slate-400">
      {children}
    </div>
  )
}
