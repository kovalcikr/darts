'use client';

import { use } from 'react';
import type { RouteParams } from '@/app/lib/next-types';
import DashboardView from '../../dashboard-view';

export default function DashboardPage({ params }: { params: RouteParams<{ tournamentId: string }> }) {
    const { tournamentId } = use(params);

    return <DashboardView tournamentId={tournamentId} />;
}
