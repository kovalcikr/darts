Status: ready-for-agent

# Configurable Table Count

## Problem Statement

The Relax Darts Cup venue can have a different number of physical scoreboard
stations (Tables) than the six the system was built around. Today the table
count is hardcoded to 6 in three places — the dashboard snapshot, the Tables
menu, and the Dashboard grid — and there is no admin surface for editing which
Slots map to which CueScore Table Names. A venue with 4 Tablets renders two
empty dashboard cells; a venue with 8 Tablets has two matches invisible on the
dashboard. The admin cannot fix this without a code change.

## Solution

Make Table Mappings (the existing `tableMappings` `AppSetting` row tying each
Slot to a CueScore Table Name) the single source of truth for both the table
identity and the table count. An authenticated admin edits the mappings list
on `/admin`; the count is `mappings.length` (no separate count setting).
Slots are stable identifiers that survive admin edits with gaps allowed, so a
removed Table's `/tables/<slot>` URL degrades gracefully without breaking the
surviving Tablets. The dashboard and Tables menu consume the mappings and
render one cell/card per existing Table, ordered by Slot ASC.

This implements ADR-0004 (Table Mappings as the single source of truth for
table count and identity) and uses the four new CONTEXT.md terms: Table, Slot,
CueScore Table Name, Table Mapping.

## User Stories

1. As an admin, I want to see the current Table Mappings (Slot + CueScore
   Table Name per row) on `/admin`, so that I know which physical stations are
   configured.
2. As an admin, I want to edit the CueScore Table Name for an existing Slot
   in place, so that a renumbered CueScore event is reflected without code.
3. As an admin, I want to add a new Table Mapping, so that a newly wired-up
   Tablet at the venue appears on the Tables menu and dashboard.
4. As an admin, I want to remove a Table Mapping, so that a decommissioned
   Tablet stops appearing on the Tables menu and dashboard.
5. As an admin, I want the Slot of a surviving Table to stay the same when I
   remove a different Table, so that a Tablet pinned to `/tables/4` keeps
   working after I remove Table 3.
6. As an admin, I want a removed Table's `/tables/<slot>` URL to render a
   clear "Table removed" message (not a generic 404), so that scorer operators
   understand what happened at a glance.
7. As an admin, I want to be prevented from saving mappings with a duplicate
   Slot, so that `/tables/<slot>` URLs stay unambiguous.
8. As an admin, I want to be prevented from saving mappings with a duplicate
   CueScore Table Name, so that one CueScore table is never scored from two
   physical stations simultaneously.
9. As an admin, I want to be prevented from saving more than 12 Table Mappings,
   so that an accidental huge number cannot crash the dashboard polling loop.
10. As an admin, I want the Tables section to be visible only when I'm logged
    in, so that an unauthenticated visitor cannot see or infer the venue
    layout.
11. As a scorer, I want the `/tables` menu to show one card per configured
    Table ordered by Slot, so that I can pick my station even when the Slots
    are non-sequential (e.g. gaps from a removed Table).
12. As a scorer, I want `/tables/<slot>` for a still-configured Slot to keep
    working unchanged, so that my Tablet's pinned URL is stable across admin
    edits to other Tables.
13. As a spectator, I want the dashboard to show one cell per configured Table
    (no empty cells for missing Slots, no hidden matches for extra Tables), so
    that the grid always reflects the venue's current layout.
14. As a spectator, I want the dashboard grid to lay out cleanly for any
    configured count (2, 3, 4, 5, 6, 7, 8…), so that the cells aren't
    squashed or oddly arranged when the count isn't 6.
15. As a developer, I want the `/api/dashboard` contract to expose an array
    of per-table objects rather than `match1..match6` keys, so that the client
    can `.map` N rows without hardcoded field names.
16. As a developer, I want the new `getTableMappings`-based reads to be the
    single source of truth across snapshot, menu and dashboard, so that no
    code path still assumes six Tables.

## Implementation Decisions

### Data model
- No schema migration. Table Mappings continue to be stored as a JSON array in
  the existing `AppSetting` row keyed `tableMappings`. The number of mappings
  IS the number of Tables; there is no separate `tableCount` setting.
- `TableMapping` retains its shape `{ slot: number, cuescoreTableName: string }`.
  Slots are stable positive integers; gaps are allowed; the list is ordered by
  Slot ASC for all reads.

### Reads — `app/lib/table-mappings.ts`
- `getTableMappings()` already returns the parsed array; extend it to sort by
  Slot ASC and to validate the parsed shape (array of `{ slot, cuescoreTableName }`
  with positive integer slots and non-empty string names). Return
  `defaultTableMappings` on any validation failure (mirrors current fallback
  behaviour).
- `getTableIdBySlot(slot)` keeps returning the CueScore Table Name for an
  existing Slot. Add a companion helper that distinguishes "slot exists" from
  "slot unknown" so pages can render "Table removed" rather than falling back
  to a default mapping (this replaces today's silent fallback to `defaultTableMappings`).
- Add a constant `MAX_TABLE_MAPPINGS = 12` used by both the editor validation
  and any read-side rendering that needs to bound work.

### Writes — admin server action
- New `saveTableMappingsAction` in `app/admin/actions.ts` (auth-gated exactly
  like the other admin actions). Accepts the full list of mappings from the
  single-form editor, server-side validates (slots unique, cuescore names
  unique, non-empty, positive integer slots, count ≤ 12), assigns the
  smallest unused positive Slot to any new rows the admin added, serialises
  back to the `tableMappings` AppSetting value, and revalidates the
  `/tables` and `/dashboard` paths.
- On validation failure, redirect back to `/admin` with an `error` query
  param (matching the existing admin error banner pattern).

### Admin UI — `app/admin/page.tsx`
- New authenticated-only "Tables" section, rendered below the Tournaments
  list. Unauthenticated visitors do not see it.
- Uses the existing `EditDisclosure` + `ActionButton` + `TextField` UI
  primitives from `app/admin/ui.tsx`, matching the tournament card edit
  pattern.
- Inside the disclosure: a single `<form action={saveTableMappingsAction}>`
  listing current mappings as rows (Slot readonly display + CueScore Table
  Name text input + Remove button), plus an "Add row" button. One "Save
  Table Mappings" submit commits the whole list.
- Slots of existing rows are displayed readonly (stable identity); new rows
  are added without a Slot visible and get one assigned on submit.

### `/tables` menu — `app/tables/page.tsx`
- Remove the hardcoded six-entry list. Read `getTableMappings()` and render
  one card per mapping, ordered by Slot ASC. Cards link to
  `/tables/<slot>` using the Slot. Gaps do not render.

### `/tables/<slot>` scoreboard — `app/tournaments/[id]/tables/[table]/`
- `table-scoreboard-page.tsx` uses the new "slot exists vs. unknown" check.
  For an unknown Slot, render a "Table removed" view (new small component,
  mirroring the `<NoActiveTournament>` pattern) instead of silently falling
  back to a default CueScore Table Name.
- For an existing Slot, behaviour is unchanged: resolve the CueScore Table
  Name via `getTableIdBySlot` and render the scoreboard.

### `/api/dashboard` contract — `app/api/dashboard/snapshot.ts`
- Remove the hardcoded `SLOTS = [1, 2, 3, 4, 5, 6]`. Read Slots from
  `getTableMappings()` (ordered ASC). The six numbered `unstable_cache`
  wrappers become a function of the Slot (cache key and tag derived from the
  Slot, not a fixed array index).
- The response shape changes from `{ match1, matchInfo1, liveState1,
  firstPlayer1, matchAvgA1, matchAvgB1, ... match6... }` to
  `{ tables: [{ slot, match, matchInfo, liveState, firstPlayer, matchAvgA,
  matchAvgB }, ...] }`, ordered by Slot ASC. This is a breaking change to the
  internal API surface; the only consumer is the Dashboard client.

### Dashboard client — `app/dashboard/dashboard-view.tsx`
- Replace the six hardcoded `<TableDashboard>` instances with a `.map` over
  `data.tables`. Each cell uses `slot` for its `data-testid`, `#label`, and
  cache identity.
- Replace the hardcoded `grid-cols-3 grid-rows-2` with a derived grid:
  `cols = N <= 4 ? 2 : 3`, `rows = Math.ceil(N / cols)`. Cells use
  `grid-cols-{cols}` and `grid-rows-{rows}`. (N is capped at 12 by the
  editor, so the grid stays bounded.)
- `TableDashboard` keeps its props; only the source of the list and the grid
  wrapper change.

### Out-of-scope columns
- `MatchLiveState.table` is left as-is. It stores the CueScore Table Name
  (e.g. `11`), not the Slot; the column name is a latent smell documented in
  CONTEXT.md under "CueScore Table Name". No rename, no migration. (See
  ADR-0004 "Consequences".)

## Testing Decisions

Tests cover external behaviour, not implementation details. Prefer existing
seams; no new test files unless noted. Prior art for each seam is cited.

- **A good test** asserts what a user or downstream consumer observes
  (rendered HTML shape, API contract shape, persisted AppSetting value),
  never internal call counts or private helpers.

- **`app/lib/__tests__/table-mappings.test.ts` (extend)** — prior art already
  covers defaults, parsing, fallbacks. Add: `getTableMappings` returns
  mappings sorted by Slot ASC with gaps preserved; the "slot exists vs.
  unknown" helper returns the right discriminant for configured, unknown,
  and gap Slots; validation rejects duplicate Slots, duplicate CueScore
  Table Names, non-positive Slots, empty names, and counts > 12.

- **`app/admin/__tests__/actions.test.ts` (extend)** — prior art uses
  `mockDeep<PrismaClient>` and `mockRedirect`. Add a `saveTableMappingsAction`
  test: applies a valid list and writes the serialised array to the
  `tableMappings` AppSetting; assigns smallest-unused Slots to new rows;
  rejects duplicate Slots / duplicate names / count > 12 with a redirect
  carrying an `error` param; is auth-gated (unauthenticated call throws /
  redirects like the other admin actions).

- **`app/admin/__tests__/page.test.tsx` (extend)** — prior art uses
  `renderToStaticMarkup`. Assert: when authenticated, the page contains the
  Tables section with the current mappings listed inside an
  `EditDisclosure`; when unauthenticated, the Tables section is absent.

- **`app/api/dashboard/__tests__/snapshot.test.ts` (extend, contract change)**
  — prior art asserts `match1..match6` fields. Replace those assertions with
  the array contract: result has `tables: [...]` ordered by Slot ASC, each
  entry has `slot, match, matchInfo, liveState, firstPlayer, matchAvgA,
  matchAvgB`. Vary the mocked `getTableMappings` length (e.g. 4, 8 with a
  gap) and verify the response length and order follow.

- **`app/dashboard/__tests__/dashboard-view.test.tsx` (extend, contract
  change)** — prior art mocks `fetch('/api/dashboard')` returning `match1`
  etc. Switch the mock to `{ tables: [...] }`. Assert: the grid `.map`s the
  right number of cells, in Slot ASC order, with the right `data-testid`
  per cell. Drop the `match1..match6` expectations.

- **`app/tables/__tests__/page.test.tsx` (extend)** — prior art exists.
  Replace the six-card assertion with "one card per mapping returned by
  `getTableMappings`, ordered by Slot ASC, gaps don't render".

- **`app/tournaments/[id]/tables/[table]/__tests__/` (extend)** — prior art
  (`page.test.tsx`, `scoreboard.test.tsx`). Add: when the Slot is unknown,
  the page renders the "Table removed" view; when known, the scoreboard
  renders as before.

- **`tests/e2e/` (extend)** — prior art (`tournament-lifecycle.spec.ts`,
  `dashboard-cache-revalidate.spec.ts`). Add one spec: admin edits Table
  Mappings (remove and add) → `/tables` menu updates → `/tables/<removed-slot>`
  shows "Table removed" → dashboard renders the new count of cells.

## Out of Scope

- Per-tournament Table counts or per-tournament mappings (rejected in
  ADR-0004; the realistic driver is venue hardware, which is global).
- A separate `tableCount` setting (rejected; the count is derived from
  `mappings.length`).
- Renaming `MatchLiveState.table` to `cuescoreTableName` (smell documented,
  rename deferred — orthogonal churn).
- Adding a Slot column to `MatchLiveState` (the dashboard derives Slot from
  mappings + match, so redundant).
- Migrating historical `MatchLiveState.table` values (unchanged).
- Any change to `defaultTableMappings` semantics (still the fallback when no
  setting exists or the stored JSON fails validation).
- Authentication/authorisation changes (the new action reuses the existing
  admin auth gate).
- Admin navigation chrome (there's no admin nav today; the new section sits
  on `/admin` below tournaments rather than introducing a `/admin/tables`
  route).

## Further Notes

- Implements ADR-0004 (`docs/adr/0004-table-mappings-as-source-of-truth.md`).
- Uses CONTEXT.md terms: Table, Slot, CueScore Table Name, Table Mapping.
- The `/api/dashboard` contract change is internal-only (single consumer: the
  Dashboard client), so no deprecation period is needed.
- Cache invalidation for the dashboard snapshot shifts from `unstable_cache`
  keyed on a fixed array index to keyed on the Slot; `revalidateTag('match<slot>')`
  already uses the Slot, so surviving Slots' cache keys don't change when a
  different Slot is removed — only the removed Slot's cache entries go cold.
- The "Table removed" view is a small presentational component; reuse the
  `<NoActiveTournament>` shape (title + message) for visual consistency.