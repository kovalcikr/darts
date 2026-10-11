# 01 — Wait screen shows table identity + link to tables

Status: ready-for-human (implemented in the working tree; needs human review, commit, and an e2e run)

## Summary

When a station at `/tables/<slot>` has no live match ("waiting for new match"),
the screen now shows which table it is and links back to the tables list. The
same treatment was applied to the two sibling fallback states on that route.

## Settled decisions (grilling session, 2026-10-11)

- **"Table name" means Slot**, rendered as `Table {slot}` — consistent with
  `tournament-header.tsx` and the `/tables` cards. The CueScore Table Name is
  not shown (meaningless to a person standing at the station).
- **Link label is `Tables`** → `/tables`. The existing `Reload` link stays as is.
- **Copy is inline** (message rewritten to carry the table identity):
  - Wait: `Waiting for a match to start on Table {slot}...` + Reload + Tables
  - TableRemoved: `Table {slot} removed` + Tables (no Reload — it cannot help)
  - NoActiveTournament (table page only): `No active tournament for Table {slot}` + Reload + Tables
- **All three fallback states get the treatment**, but only on `/tables/<slot>`.
  The `/tables` and `/dashboard` `NoActiveTournament` usages are untouched: a
  "Tables" link there is a self-link / off-purpose.

## UI prototype (primary source)

Variants were explored on branch **`prototype/wait-screen-variants`**
(3 variants of the wait screen + fallback-state preview, switchable via
`?variant=A|B|C&state=wait|removed|no-tournament` on `/tables/<slot>`, plus a
shared `PrototypeSwitcher` bar).

Verdict: **Variant A (inline message)** wins — minimal card, table identity in
the message, text links. Rejected: B (app-chrome header bar) and C (kiosk hero
with giant `TABLE {slot}` and touch buttons). The full variant set stays on the
prototype branch, not in main.

## Changes

- `app/tournaments/[id]/tables/[table]/wait.tsx` — inline table identity, add `Tables` link
- `app/components/TableRemoved.tsx` — takes `slot`, copy + `Tables` link
- `app/components/NoActiveTournament.tsx` — optional `slot` renders the Reload/Tables links
- `app/tables/[table]/page.tsx` — pass `slot` through
- Tests updated to the new copy: `app/tables/[table]/__tests__/page.test.tsx`,
  `tests/e2e/match-flow.spec.ts`, `tests/e2e/tournament-lifecycle.spec.ts`,
  `tests/e2e/configurable-table-mappings.spec.ts`

## Notes

- The unit test previously asserted `Table not available` for the removed state
  (pre-existing failure — the component always rendered `Table removed`); the
  assertion now matches the real copy.
- A pre-existing unrelated failure remains in `app/admin/__tests__/actions.test.ts`
  (fails on a clean tree too).
- e2e specs were updated but not run here (they need the containerised runner).
