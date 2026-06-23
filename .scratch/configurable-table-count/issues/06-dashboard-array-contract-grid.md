Status: ready-for-agent

# 06 — /api/dashboard array contract + dynamic grid

## Parent

`.scratch/configurable-table-count/PRD.md`

## What to build

The pivot slice. The `/api/dashboard` HTTP contract changes from fixed
`match1..match6` keys to an array, and the Dashboard client + grid move with
it. Snapshot and client ship together because the contract is internal
(single consumer: the Dashboard client).

### Server (`app/api/dashboard/snapshot.ts`)
- Remove the hardcoded `SLOTS = [1, 2, 3, 4, 5, 6]`. Read Slots from
  `getTableMappings()` (ordered ASC).
- The six numbered `unstable_cache` wrappers become a function of the Slot;
  cache key and tag are derived from the Slot, not a fixed array index.
- Response shape changes from `{ match1, matchInfo1, liveState1,
  firstPlayer1, matchAvgA1, matchAvgB1, ... match6... }` to
  `{ tables: [{ slot, match, matchInfo, liveState, firstPlayer, matchAvgA,
  matchAvgB }, ...] }`, ordered by Slot ASC.

### Client (`app/dashboard/dashboard-view.tsx`)
- Replace the six hardcoded `<TableDashboard>` instances with a `.map` over
  `data.tables`.
- Each cell uses its `slot` for `data-testid`, `#`-label, and cache identity.
- Replace the hardcoded `grid-cols-3 grid-rows-2` with a derived grid:
  `cols = N <= 4 ? 2 : 3`, `rows = Math.ceil(N / cols)`, where N is
  `data.tables.length` (capped at 12 by `MAX_TABLE_MAPPINGS`).

`TableDashboard` keeps its props; only the source of the list and the grid
wrapper change.

## Acceptance criteria

- [ ] `/api/dashboard` response is `{ tables: [...] }` ordered by Slot ASC,
      each entry having `slot, match, matchInfo, liveState, firstPlayer,
      matchAvgA, matchAvgB`
- [ ] Snapshot derives Slots from `getTableMappings()`; cache keys/tags are
      derived from the Slot
- [ ] Dashboard client `.map`s `data.tables`; the six hardcoded
      `<TableDashboard>` instances are gone
- [ ] Dashboard grid uses `cols = N<=4 ? 2 : 3`, `rows = ceil(N/cols)`,
      bounded by `MAX_TABLE_MAPPINGS`
- [ ] `snapshot.test.ts` contract assertions are replaced (no `match1..match6`);
      the test asserts the array shape across varied mapping lengths (e.g. 4,
      8 with a gap)
- [ ] `dashboard-view.test.tsx` fetch mock switches to `{ tables: [...] }`;
      the test asserts cells render in Slot ASC order with the right
      `data-testid` per cell

## Blocked by

- `01-slot-existence-validation.md` (ordered, gap-preserving `getTableMappings`)