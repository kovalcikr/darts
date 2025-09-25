export function Header({ text }) {
    return (
        <span className="flex items-center">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-300"></span>

            <span className="text-2xl shrink-0 px-4 text-gray-900">{text}</span>

            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300"></span>
        </span>
    )
}
