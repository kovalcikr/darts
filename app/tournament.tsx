'use client'

import { useFormState, useFormStatus } from "react-dom";
import { openTournamentForm } from "./lib/tournament";
import Link from "next/link";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            className="w-full px-4 py-2 mt-4 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            aria-disabled={pending}
        >
            {pending ? 'Otváram...' : 'Otvoriť'}
        </button>
    )
}

export default function Tournament({ props }) {

    const initialState = {
        message: '',
    }

    const [state, formAction] = useFormState(openTournamentForm, initialState)

    return (
        <div className="w-full min-h-screen bg-gray-900 text-gray-300">
             <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/70 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4">
                        <div className="relative flex items-center">
                            <h1 className="font-bold text-xl text-white">Relax Darts Cup: <span className="text-sky-400">Otvoriť turnaj</span></h1>
                            <div className="relative flex items-center ml-auto">
                                <nav className="text-sm leading-6 font-semibold text-gray-400">
                                    <ul className="flex space-x-4 md:space-x-8">
                                        <li>
                                            <Link className="hover:text-sky-400 transition-colors" href="/">Domov</Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex items-center justify-center flex-grow">
                <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg ring-1 ring-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-center text-white">Zadajte ID turnaja</h2>
                    </div>
                    <form action={formAction} className="mt-8 space-y-6">
                        <div>
                            <label htmlFor="tournamentId" className="sr-only">Tournament ID</label>
                            <input
                                type="text"
                                name="tournamentId"
                                id="tournamentId"
                                required
                                className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Tournament ID"
                            />
                        </div>
                        <SubmitButton />
                        {state?.message &&
                            <p aria-live="polite" className="mt-2 text-sm text-red-400 text-center">
                                {state.message}
                            </p>
                        }
                         {props?.error &&
                            <p aria-live="polite" className="mt-2 text-sm text-red-400 text-center">
                                {props.error}
                            </p>
                        }
                    </form>
                </div>
            </main>
        </div>
    );
}