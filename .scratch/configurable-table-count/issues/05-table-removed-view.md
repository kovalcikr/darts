Status: ready-for-agent

# 05 — /tables/<slot> "Table removed" view for unknown Slots

## Parent

`.scratch/configurable-table-count/PRD.md`

## What to build

`table-scoreboard-page.tsx` currently calls `getTableIdBySlot(slot)` and,
for an unknown Slot, silently falls back to a default CueScore Table Name.
Switch it to the 01 "slot exists vs. unknown" helper:
- For a known Slot: behaviour is unchanged — resolve the CueScore Table Name
  via `getTableIdBySlot` and render the scoreboard.
- For an unknown Slot: render a small "Table removed" view (new component
  mirroring the `<NoActiveTournament>` shape — title + message) instead of
  silently falling back to a default mapping.

This slice makes the grilling's URL-degradation promise hold: when an admin
removes Table 3, `/tables/3` renders "Table removed" and the surviving
Tablets (e.g. `/tables/4`) keep working.

## Acceptance criteria

- [ ] `/tables/<slot>` for a still-configured Slot renders the scoreboard as
      before (no behaviour change)
- [ ] `/tables/<slot>` for an unknown Slot renders a "Table removed" view,
      not a generic 404 and not a fallback to a default CueScore Table Name
- [ ] The "Table removed" view reuses the `<NoActiveTournament>` visual shape
      (title + message) for consistency
- [ ] Existing `app/tournaments/[id]/tables/[table]/__tests__/` render tests
      are extended to cover both the known-Slot and unknown-Slot cases

## Blocked by

- `01-slot-existence-validation.md` (the "slot exists vs. unknown" helper)