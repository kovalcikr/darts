import Darts from "../tournaments/[id]/tables/[table]/darts";
import type { PageSearchParams } from "../lib/next-types";

export default async function TestPage({
    searchParams,
}: {
    searchParams: PageSearchParams<{ slow?: string; reset?: string }>
}) {
    const resolvedSearchParams = await searchParams;
    return (
        <Darts
            table="test"
            matchId="test"
            slow={resolvedSearchParams.slow === 'true'}
            reset={resolvedSearchParams.reset === 'true'}
        />
    )
}
