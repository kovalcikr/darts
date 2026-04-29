import Darts from "./darts";
import { createMatch, getCuescoreMatch } from "@/app/lib/match";
import { Suspense } from "react";
import Wait from "./wait";
import type { PageSearchParams, RouteParams } from "@/app/lib/next-types";

export default async function Page({
  params, searchParams
}: {
  params: RouteParams<{ id: string; table: string }>,
  searchParams: PageSearchParams<{ slow?: string; reset?: string }>
}) {
  const { id, table: encodedTable } = await params;
  const resolvedSearchParams = await searchParams;
  const table = decodeURIComponent(encodedTable);
  const slow = resolvedSearchParams.slow === 'true';
  const reset = resolvedSearchParams.reset === 'true';

  let match = null;

  try {
    const cueScoreMatch = await getCuescoreMatch(id, encodedTable);
    match = await createMatch(cueScoreMatch);
  } catch (e) {
    console.log(e);
    return (
      <Wait id={id} table={encodedTable}/>
    );
  }

  return (
    <Suspense fallback={<div className="flex h-dvh bg-slate-300 text-center text-2xl text-blue-700"><div className="m-auto">Loading...</div></div>}>
      <Darts table={table} matchId={match.id} slow={slow} reset={reset} tournamentId={id} />
    </Suspense>
  );
}
