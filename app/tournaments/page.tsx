import Image from 'next/image'
import Tournament from '../tournament'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedSearchParams = await searchParams

  return (
    <Tournament props={{ error: resolvedSearchParams.error ?? null }}/>
  )
}
