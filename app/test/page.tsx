import Darts from "../tournaments/[id]/tables/[table]/darts";

export default function TestPage({ searchParams } : { searchParams: {slow: boolean, reset: boolean} }) {
    return (
        <Darts table="test" matchId="test" slow={searchParams.slow} reset={searchParams.reset} />
    )
}