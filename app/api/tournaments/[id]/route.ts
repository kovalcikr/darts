import { apiError } from '@/app/api/_lib/responses';
import getTournamentInfo from "@/app/lib/cuescore";
import type { RouteParams } from "@/app/lib/next-types";

export async function GET(request: Request, {params} : {params: RouteParams<{id : string}>}) {
  const { id } = await params;
  try {
    return Response.json(await getTournamentInfo(id));
  } catch (error) {
    console.error('Failed to load tournament info', { id, error });
    return apiError('TOURNAMENT_FETCH_FAILED', 'Unable to load tournament info', { status: 500 });
  }
}
