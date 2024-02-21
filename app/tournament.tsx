'use client'

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function Tournament() {
  const router = useRouter();
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    router.push("/tournaments/" + formData.get("tournament"));
  }

  return (
    <main className="flex flex-col h-dvh font-normal text-black">
      <form onSubmit={onSubmit}>
        Tournament ID: <input type="text" name="tournament" />
        <button type="submit">OK</button>
      </form>
    </main>
  );
}
