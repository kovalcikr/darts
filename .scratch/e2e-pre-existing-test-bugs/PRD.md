# E2E pre-existing test bugs

Three test bugs surfaced after the containerised test runner (`91cb255`) was switched to a production `next start` webServer instead of `next dev`. The dev server's slow HMR was masking real test races; in production, the tests fail deterministically (or sometimes retry-pass as "flaky").

## Issues

- `01-loading-spinner-test-delays-wrong-method.md` — `match-flow.spec.ts:248` delays the wrong CueScore method.
- `02-match-flow-spec-undo-wait-race.md` — `match-flow.spec.ts:120` has a UNDO + `waitForActivePlayer` race.
- `03-dashboard-cache-revalidate-table-page-race.md` — three tests in `dashboard-cache-revalidate.spec.ts` race between `page.goto('/tables/1')` and `start-player-` click.

## Background

Diagnosed in a follow-up session to the containerised test runner work. The original flake investigation started with the `match-flow.spec.ts:248` "loading spinner" test, but root cause was a Next.js dev-server crash (`Manifest file is empty` / `SyntaxError: Unexpected end of JSON input`) under sustained HMR + revalidatePath load. Fixing the dev-server crash by switching the runner to `next start` exposed these three pre-existing test bugs that dev-mode timing was masking.

These are all real test bugs that should be fixed for the E2E suite to be deterministic. They were intentionally left out of the production-build fix to keep that change scoped.
