import { revalidatePath } from "next/cache"

export default function Page({ params }: { params: { id: string } }) {
  revalidatePath(`/stats/tournaments/${params.id}`);
  return (
    <div className="h-dvh bg-slate-200">OK</div>
  )
}