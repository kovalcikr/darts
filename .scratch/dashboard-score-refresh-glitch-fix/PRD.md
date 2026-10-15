Status: ready-for-agent
Labels: ready-for-agent

# Dashboard score refresh and Scoreboard interaction reliability

## Problem Statement

During a live Match, a Player enters a Throw score on the Scoreboard and confirms it with `OK`. In the reported case, the database contains the new Throw, but the Scoreboard appears frozen and the Dashboard continues showing the old score. A related report says that clicking the Scoreboard surface can refresh the page and persist the number that was clicked.

The ordinary normal-Throw flow currently passes on Chromium desktop and mobile in the existing dashboard cache-revalidation E2E test, so the defect is not reproduced under baseline timing. The fix must address the untested timing, error, navigation, and overlapping-poll conditions without regressing the working flow.

## Solution

Make live scoring behave as one reliable user interaction: keypad clicks only edit the pending score, `OK` submits exactly one Throw, the Scoreboard remains usable or clearly reports failure, and the Dashboard converges promptly to the committed `MatchLiveState`. A successful database commit must not be hidden by a stale Dashboard response or by an unrelated external CueScore failure.

The implementation should identify and correct the actual failure boundary found by instrumentation. It must preserve the existing domain behavior for normal Throws, valid checkouts, bust prevention, undo, redo, Match leg progression, and CueScore synchronization.

## User Stories

1. As a Player, I want keypad number clicks to change only the pending score, so that accidental surface clicks cannot submit a Throw or navigate away.
2. As a Player, I want `OK` to submit the score I can see, so that the recorded Throw matches my confirmed input.
3. As a Player, I want one `OK` click to create at most one Throw, so that double clicks and delayed responses cannot duplicate scoring.
4. As a Player, I want the Scoreboard to show a clear submitting state, so that I know whether input is temporarily locked.
5. As a Player, I want the Scoreboard to recover from a failed server action, so that an error does not leave the controls permanently frozen.
6. As a Player, I want invalid bust and checkout inputs to remain rejected, so that the scoring rules are unchanged.
7. As a Player, I want a valid checkout to present the darts-used confirmation and then submit once, so that closing a Leg remains explicit and reliable.
8. As a Player, I want undo and redo to remain available after a successful or failed score operation according to the actual persisted state.
9. As a Dashboard viewer, I want a committed Throw to appear with the new remaining score, active Player, average, and recent Throw history, so that the live display reflects the Match.
10. As a Dashboard viewer, I want an older polling response never to overwrite newer state, so that intermittent network timing cannot make the score move backward visually.
11. As a tournament operator, I want a slow CueScore update not to conceal a successful local database/projection commit, so that live venue displays remain useful during upstream latency.
12. As a tournament operator, I want upstream CueScore synchronization to retain its existing semantics and error visibility, so that local display reliability does not silently corrupt external Match results.
13. As a venue operator, I want the active `/tables/<slot>` route and its tournament redirect to behave consistently, so that physical Scoreboard stations do not depend on which URL opened them.
14. As a maintainer, I want production-style E2E coverage for normal Throws, checkouts, slow requests, and concurrent Dashboard polling, so that this timing-sensitive defect cannot return unnoticed.

## Implementation Decisions

- Treat the persisted `MatchLiveState` as the authoritative live read model for Dashboard scoring fields after a local Throw commit. Cached CueScore Match data remains responsible for Match identity, players, race state, and upstream synchronization, but must not overwrite newer local live scoring fields.
- Preserve the existing transaction boundary that writes the PlayerThrow, updates Match leg counts when needed, and refreshes MatchLiveState. Do not introduce a schema migration unless the investigation proves that the current projection cannot express the required ordering.
- Make the score-submit lifecycle explicit: pending input, submitting, success/reset, and recoverable failure. The submitting state must always be cleared on both success and failure, and a failed submission must not silently discard the user-visible pending score without a deliberate product decision.
- Ensure all interactive Scoreboard controls that are not intentional form submissions cannot trigger native form navigation. If the form wrapper is unnecessary, remove it; otherwise prevent default submission and keep button semantics explicit.
- Guard against duplicate submissions from rapid clicks or repeated input events. The guard must live at the client interaction boundary and be backed by server/database behavior that does not create duplicate Throws for one confirmed action.
- Keep the existing server action interface compatible unless changing it is necessary to return a structured success/error result. If errors are returned, use a stable result contract that the Scoreboard can render without relying on an uncaught rejected Promise.
- Revalidate the table-specific cache tag only after the local transaction commits. Ensure the invalidation covers every cached Dashboard reader that can serve the affected Table, including cached Match, Match information, and first-Player data where applicable.
- Prevent stale overlapping `/api/dashboard` responses from replacing newer client state. The preferred approach is request sequencing or cancellation in the Dashboard polling effect; the chosen mechanism must be justified by observable behavior and avoid increasing polling frequency.
- Preserve Table Mapping semantics: cache identity and invalidation remain scoped to the stable physical Table Slot, while `MatchLiveState.table` continues to hold the CueScore Table Name.
- Instrument the failure path sufficiently to distinguish local transaction success, projection refresh, CueScore synchronization, cache invalidation, Dashboard response generation, and client render order. Avoid logging score data or credentials unnecessarily.
- Do not redesign the Scoreboard or Dashboard visuals. Only add the minimum pending/error indication needed to make the interaction state understandable and testable.

## Testing Decisions

- Prefer external behavior over implementation details. The primary assertion is what the Player and Dashboard viewer observe, plus the persisted Throw count/state through the existing test API or database-backed test seam.
- Extend the existing production-style Playwright test that opens a Dashboard and a Scoreboard in separate browser pages. This is the highest existing seam and already proves normal Throw cache revalidation.
- Add a test for keypad interaction that asserts number clicks do not navigate, submit, or change persisted state until `OK` is clicked.
- Add a test for one normal Throw that asserts exactly one persisted Throw, the Scoreboard returns to `0`, and the Dashboard shows the new remaining score and recent Throw.
- Add a test for rapid repeated `OK` activation that asserts one Throw and a recoverable control state.
- Add checkout coverage that exercises both `OK` steps, leg progression, active Player, and Dashboard state.
- Use the gated in-app test API to delay the real CueScore roundtrip and, where useful, the real Prisma path. Assert that local live state and controls behave according to the chosen contract during the delay and after completion.
- Add an overlapping-poll test that delays or reorders Dashboard responses and asserts that an older response cannot overwrite the newest displayed score.
- Add failure-path coverage for a rejected server action or CueScore synchronization error. Assert that the Scoreboard does not remain permanently disabled and that the user receives a visible, actionable failure state.
- Retain and run the existing desktop and mobile Dashboard cache-revalidation tests, the match-flow E2E suite, relevant Scoreboard component tests, and the unit/integration suites.
- Follow the repository’s standalone-container E2E architecture for browser tests; do not rely on dev-server HMR or incidental local timing.

## Out of Scope

- Redesigning the visual layout, keypad, Dashboard grid, or Player cards.
- Replacing one-second polling with WebSockets or a broader real-time transport.
- Changing CueScore’s external API or Match scoring semantics.
- Reworking Table Mappings, Slot identity, or the Dashboard array contract.
- Adding audit/history features beyond the existing Throw and MatchLiveState data.
- Fixing unrelated stale-cache behavior outside live Match scoring.

## Further Notes

The baseline reproduction passed on Chromium desktop and mobile against the running app using the existing `dashboard-cache-revalidate.spec.ts` normal-Throw scenario. The implementation agent should first run the new timing/error-path tests or add minimal instrumentation, then narrow the fix to the demonstrated failure mechanism rather than assuming a form-navigation bug or a cache bug.
