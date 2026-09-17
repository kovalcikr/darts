Status: completed
Labels: wayfinder:research, needs-triage
Assignee: codex
Assignee: codex

## Question

After a throw commits, which dashboard data source can still return the old score, and for how long?

Trace the ordering of the transaction, `refreshMatchLiveState`, the CueScore update, `revalidateTag`, the `unstable_cache` entries in the dashboard snapshot, and the client polling effect. Check for stale-response overwrites when requests overlap. Establish whether the dashboard should be projection-first, cache-invalidated, request-versioned, or otherwise coordinated, and state the invariant the implementation must preserve.

## Comments

### Resolution

The stale-display race was reproduced deterministically in `app/dashboard/__tests__/dashboard-view.test.tsx`. The test holds the first dashboard poll at the old score (501), lets the next poll render the newer projection score (321), then releases the first response. Before the fix, the dashboard visibly regressed to 501 because every successful poll called `setData` in arrival order.

The transaction path is projection-first: `addThrowAction` creates the Throw and calls `refreshMatchLiveState` inside the Prisma transaction, then commits. Checkout-only CueScore synchronisation happens afterward, followed by `revalidatePath`/`revalidateTag`. The API snapshot prefers MatchLiveState when a current upstream match is available, but its `unstable_cache` match fetches and tag invalidation cannot change the order of requests already in flight.

The implemented coordination is request-versioned client polling: each poll receives an increasing request id and may update UI state only if it remains the latest started request. Older successes and errors, plus all results after unmount, are ignored. This preserves the required invariant: once a dashboard has rendered a newer committed score, an older poll response cannot regress it.

Verification: `npm test -- --runTestsByPath app/dashboard/__tests__/dashboard-view.test.tsx --runInBand` passed (11 tests). Direct ESLint on the two changed files reported no errors; the two existing `no-img-element` warnings remain. `npm run lint` still fails because it includes generated `.next-test` runtime files unrelated to this change.
