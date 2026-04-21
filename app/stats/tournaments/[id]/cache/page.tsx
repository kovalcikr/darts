import { revalidatePath } from "next/cache"
import type { RouteParams } from "@/app/lib/next-types"

export default async function Page({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  revalidatePath(`/stats/tournaments/${id}`);
  return (
    <div className="h-dvh bg-slate-200">OK</div>
  )
}
