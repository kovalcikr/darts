import { redirect } from 'next/navigation'
import type { RouteParams } from '@/app/lib/next-types'

export default async function TournamentTableRedirect({
  params,
}: {
  params: RouteParams<{ id: string; table: string }>
}) {
  const { table } = await params
  redirect(`/tables/${encodeURIComponent(table)}`)
}
