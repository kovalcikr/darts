'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react"

export default function Wait({ id, table }) {

  const router = useRouter();
  const reloadHref = `/tables/${table}`;

  useEffect(() => {
    const comInterval = setInterval(() => {
      router.push(reloadHref)
    }, 20000); //This will refresh the data at regularIntervals of refreshTime
    return () => clearInterval(comInterval) //Clear interval on component unmount to avoid memory leak
  }, [reloadHref, router])

  return (
    <div className="flex flex-col h-dvh bg-slate-300 align-middle text-center text-2xl text-blue-700">
      <div className="flex-col m-auto">
        <div className="text-black">Waiting for match to start...</div>
        <div>
          <a href={reloadHref} >Reload</a>
        </div>
      </div>
      <div>
          <a className="text-red-400" href={`/tables`} >Exit Tournament</a>
        </div>
    </div>
  )
}
