'use client'

import { useRouter } from "next/navigation";
import { FormEvent, useActionState } from "react";
import { openTournamentForm } from "./lib/tournament";
import { useFormState, useFormStatus } from "react-dom";

export default function Tournament({ props }) {

  const initialState = {
    message: '',
  }

  const { pending } = useFormStatus();

  const [state, formAction] = useFormState(openTournamentForm, initialState)

  return (
    <main className="flex flex-col h-dvh font-normal text-black bg-slate-300">
      {props?.error}
      <form action={formAction}>
        <label htmlFor="tournamentId">Tournament ID: </label>
        <input type="text" name="tournamentId" required />
        <button className="border-2 border-slate-600 rounded bg-green-200 p-1 m-2" type="submit" aria-disabled={pending}>OK</button>
        <p aria-live="polite">
          {state?.message}
        </p>
      </form>
    </main>
  );
}
