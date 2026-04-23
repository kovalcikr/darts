import getTournamentInfo from "@/app/lib/cuescore";
import type { RouteParams } from "@/app/lib/next-types";

export async function GET(request: Request, {params} : {params: RouteParams<{id : string}>}) {
  const { id } = await params;
  return Response.json(await getTournamentInfo(id));
}
