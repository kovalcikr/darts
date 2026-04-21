import getTournamentInfo from "@/app/lib/cuescore";

export async function GET(request: Request, {params} : {params: {id : string}}) {
  return Response.json(await getTournamentInfo(params.id));
}
