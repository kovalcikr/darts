'use client'

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useEffect } from "react"

export default function Wait({ id, slot }: { id: string; slot: string }) {

  const router = useRouter();
  const reloadHref = `/tables/${slot}`;

  useEffect(() => {
    const comInterval = setInterval(() => {
      router.push(reloadHref)
    }, 20000); //This will refresh the data at regularIntervals of refreshTime
    return () => clearInterval(comInterval) //Clear interval on component unmount to avoid memory leak
  }, [reloadHref, router])

  return (
    <div className="flex h-dvh flex-col bg-gray-900 text-center text-2xl text-sky-300">
      <div className="m-auto flex-col rounded-lg bg-gray-800/50 p-6 ring-1 ring-white/10">
        <div className="text-white">Waiting for a match to start on Table {slot}...</div>
        <div className="mt-3 flex justify-center gap-6">
          <a className="text-sm font-semibold text-sky-300 hover:text-sky-200" href={reloadHref}>Reload</a>
          <Link className="text-sm font-semibold text-sky-300 hover:text-sky-200" href="/tables">Tables</Link>
        </div>
      </div>
    </div>
  )
}
