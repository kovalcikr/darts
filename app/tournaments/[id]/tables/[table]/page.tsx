import TableScoreboardPage from "@/app/tournaments/table-scoreboard-page";
import type { PageSearchParams, RouteParams } from "@/app/lib/next-types";

export default async function Page({
  params, searchParams
}: {
  params: RouteParams<{ id: string; table: string }>,
  searchParams: PageSearchParams<{ slow?: string; reset?: string }>
}) {
  const { id, table: encodedTable } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <TableScoreboardPage
      encodedTable={encodedTable}
      searchParams={resolvedSearchParams}
      tournamentId={id}
    />
  );
}
