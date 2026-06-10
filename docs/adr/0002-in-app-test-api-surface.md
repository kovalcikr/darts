# In-app test API surface

Production code carries a small, gated test API surface so the E2E suite can
simulate real latencies (slow CueScore roundtrip, slow Prisma transaction)
that the dev server's slow HMR used to mask incidentally. The surface lives
under `app/api/test/*` and inside server actions, and is only enabled when
**all three** of `CUESCORE_PROVIDER=fake`, `ENABLE_TEST_API=true`, and (in
production) `ENABLE_TEST_ROUTES_IN_PRODUCTION=true` are set. State is held in
module-level in-memory maps (mirroring `FakeCueScoreGateway`'s per-method
delay map) keyed by `tournamentId` so parallel Playwright workers cannot
collide.

We considered (and rejected) client-side throttling via `page.route` and
keeping the dev-server timing accident as the "slow" signal. Both are
test-only and would let regressions slip through: a slow Prisma call only
exercises the spinner correctly if the server action's `isSubmitting=true`
window is observed against the *real* Prisma path, not a synthetic network
delay injected at the HTTP boundary.
