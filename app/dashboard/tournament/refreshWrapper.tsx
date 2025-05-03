'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RefreshWrapper({ children }: { children: React.ReactNode }) {
    'use client'
    const router = useRouter();
    useEffect(() => {
        const comInterval = setInterval(() => {
            router.push(`/dashboard/tournament`)
        }, 500); //This will refresh the data at regularIntervals of refreshTime
        return () => clearInterval(comInterval) //Clear interval on component unmount to avoid memory leak
    }
        , [])
    return (
        children
    );
}