import Link from "next/link";

export default function APage() {
    return (
        <>
            <div className="w-full min-h-screen text-gray-900 bg-white">
                <header className="sticky top-0 z-40 w-full backdrop-blur flex-none">
                    <div className="max-w-7xl mx-auto">
                        <div className="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
                            <div className="relative flex items-center">
                                <div className="font-bold text-xl">Relax darts cup</div>
                                <div className="relative flex items-center ml-auto">
                                    <nav className="text-sm leading-6 font-semibold text-slate-700">
                                        <ul className="flex space-x-8">
                                            <li>
                                                <Link className="hover:text-sky-500" href="/">Štatistiky</Link>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-auto">
                    <div className="max-w-7xl mx-auto py-4 px-4">
                        <div className="text-gray-700 text-base">
                            <Link href={"/tournaments/53004712"}>Relax Darts CUP 01 2025</Link>
                        </div>
                    </div>
                </main>
            </div>

        </>
    )
}