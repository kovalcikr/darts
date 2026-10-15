Status: needs-triage
Labels: wayfinder:map

# Dashboard score refresh glitch — investigation map

## Destination

An evidence-backed diagnosis and implementation-ready specification for the dashboard showing stale scores/freezing after a confirmed throw, plus the unexpected refresh-and-write behavior when interacting with the scoreboard. The route should include reproducible steps, the responsible state/cache boundary, and regression coverage criteria.

## Notes

Domain: live Match scoring, Scoreboard UI, Dashboard polling, MatchLiveState projection, and CueScore synchronization.

Consult `CONTEXT.md`, `docs/agents/issue-tracker.md`, and the existing dashboard/cache E2E tests. Planning only in this map; do not implement the fix while charting. Existing worktree changes are user-owned.

## Decisions so far

- [Reproduce the scoreboard interaction](issues/01-reproduce-scoreboard-interaction.md): The baseline normal-throw flow passed on desktop and mobile; the reported freeze/navigation symptom was not reproduced.
- [Trace the score-submit lifecycle](issues/02-trace-score-submit-lifecycle.md): Normal throws commit projection state before revalidation; checkout waits on CueScore, while dashboard polling accepts out-of-order responses and can overwrite newer data.
- [Trace dashboard consistency](issues/03-trace-dashboard-consistency.md): A delayed older poll deterministically regressed the score; request-versioned polling now ignores it after a newer snapshot renders.

## Not yet specified

- Whether the observed behavior differs between the active `/tables/<slot>` route and the redirected tournament route.
- The smallest regression test that reliably catches both symptoms under realistic request timing.

## Out of scope

- Redesigning the scoreboard or dashboard visuals.
- Changing CueScore business semantics or the database schema unless the investigation proves it is required for this glitch.
