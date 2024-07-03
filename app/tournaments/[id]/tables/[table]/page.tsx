import Image from "next/image";
import Darts from "./darts";
import { createMatch, getCuescoreMatch } from "@/app/lib/match";
import { Suspense, useActionState } from "react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Wait from "./wait";

export default async function Page({
  params,
}: {
  params: { id: string; table: string };
}) {
  const table = decodeURIComponent(params.table);

  let match = null;

  try {
    const cueScoreMatch = await getCuescoreMatch(params.id, params.table);
    match = await createMatch(cueScoreMatch);
  } catch (e) {
    console.log(e);
    return (
      <Wait id={params.id} table={params.table}/>
    );
  }

  return (
    <Suspense fallback={<div className="flex h-dvh bg-slate-300 text-center text-2xl text-blue-700"><div className="m-auto">Loading...</div></div>}>
      <Darts table={table} matchId={match.id} />
    </Suspense>
  );
}
