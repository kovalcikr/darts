import { apiError } from "@/app/api/_lib/responses";
import { NextRequest } from "next/server";
import type { RouteParams } from "@/app/lib/next-types";

export async function GET(_request: NextRequest, _context: { params: RouteParams<{ id: string }> }) {
    return apiError('DASHBOARD_TOURNAMENT_DEPRECATED', 'Use /api/dashboard for the active tournament dashboard.', { status: 410 });
}
