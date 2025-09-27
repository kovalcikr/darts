export function Header({ text }) {
    return (
        <div className="flex items-center" role="heading" aria-level={2}>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-500/50 to-sky-500"></span>
            <h2 className="text-2xl font-bold shrink-0 px-6 text-white tracking-wider uppercase">{text}</h2>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-sky-500/50 to-sky-500"></span>
        </div>
    )
}
