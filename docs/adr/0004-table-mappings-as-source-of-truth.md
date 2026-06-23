# Table Mappings as the single source of truth for table count and identity

The number of Tables (physical scoreboard stations) was hardcoded to 6 in
`app/api/dashboard/snapshot.ts`, `app/tables/page.tsx`, and
`app/dashboard/dashboard-view.tsx`, with the `/api/dashboard` contract exposing
fixed `match1..match6` keys. We're making the count and identity admin-
configurable, stored in the database. We decided Table Mappings (the existing
`tableMappings` `AppSetting` row, tying each Slot to a CueScore Table Name)
becomes the single source of truth: there is no separate "table count" setting
— the count is `mappings.length` — and Slots are stable identifiers that
survive admin edits with gaps allowed rather than renumbering.

## Considered Options

- **Separate `tableCount` setting vs. derive from `mappings.length`.** Rejected
  the separate count: it lets an admin set a count that disagrees with the
  mappings list, and the count was never independent of the mappings — it was
  always "the venue has these N slots, each mapped to this CueScore table."
- **Per-tournament count vs. global.** Rejected per-tournament: the existing
  `tableMappings` setting is global, and the realistic driver is "the venue has
  N physical tables wired up," not a per-event property. Per-tournament would
  add a `Tournament` column, complicate active-tournament resolution, and split
  the existing global setting.
- **Sequential slots (renumber on remove) vs. stable slots with gaps.** Rejected
  sequential: `/tables/<slot>` URLs are baked into physical tablets and QR
  posters. Renumbering on removal would silently point a surviving tablet at a
  different CueScore table. Stable slots mean removing Table 3 leaves a gap
  `{1,2,4,5,6}`; `/tables/3` renders a "Table removed" page, surviving tablets
  keep working.

## Consequences

- `/api/dashboard` changes from fixed `match1..match6` keys to an array
  contract: `{ tables: [{ slot, match, matchInfo, liveState, firstPlayer,
  matchAvgA, matchAvgB }, ...] }`, ordered by Slot ASC. The client `.map`s
  rows.
- `/tables` menu and Dashboard grid render one card/cell per existing Table
  Mapping, ordered by Slot ASC; gaps don't render. Dashboard grid layout is
  derived from N: `cols = N<=4 ? 2 : 3`, `rows = ceil(N/cols)`,
  capped at 12 to bound the polling/render cost.
- `getTableIdBySlot` distinguishes "slot exists" from "slot unknown"; unknown
  slots render a "Table removed" page (not a 404 — the URL was once valid).
- `MatchLiveState.table` stores the CueScore Table Name (e.g. `11`), not the
  Slot. The column name is a latent smell but is left as-is to avoid an
  orthogonal migration; the CONTEXT.md term "CueScore Table Name" documents
  what the field means.
- Admin UI: a new authenticated-only "Tables" section on `/admin` (below the
  tournament list) edits Table Mappings as a single-form list editor inside an
  `EditDisclosure` (matching the tournament card pattern). Existing rows show
  slot + CueScore table name, with add/remove; new rows are assigned the
  smallest unused positive Slot on submit. Slots and CueScore table names must
  be unique within the list.
- The hardcoded `SLOTS = [1, 2, 3, 4, 5, 6]` in `snapshot.ts`, the hardcoded
  list in `tables/page.tsx`, and the six `<TableDashboard>` instances in
  `dashboard-view.tsx` are all removed; they consume `getTableMappings()`
  and the new array contract.