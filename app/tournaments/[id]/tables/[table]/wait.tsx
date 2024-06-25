'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react"

export default function Wait({id, table}) {

    const router = useRouter();

     useEffect(() => {
        const comInterval = setInterval(() => {
            router.push(`/tournaments/${id}/tables/${table}`)
        }, 20000); //This will refresh the data at regularIntervals of refreshTime
        return () => clearInterval(comInterval) //Clear interval on component unmount to avoid memory leak
      },[])

    return(
    <div className="flex h-dvh bg-slate-300 align-middle text-center text-2xl text-blue-700">
    <div className="m-auto">
    <div className="text-black">Waiting for match to start...</div>
    <a href={`/tournaments/${id}/tables/${table}`} >Reload</a>
    </div>
  </div>
  )
}