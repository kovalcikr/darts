import Image from "next/image";
import Darts from "./darts";
import { createMatch, getCuescoreMatch } from "@/app/lib/match";
import { Suspense, useActionState } from "react";
import { revalidatePath } from "next/cache";
import Link from "next/link";

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
      <>
        <a href={`/tournaments/${params.id}/tables/${params.table}`} >Reload</a>
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Darts tournament={params.id} table={table} matchId={match.id} />
      </Suspense>
    </>
  );
}
