Status: ready-for-agent

# 07 — E2E: admin edits mappings → menu + dashboard + removed slot

## Parent

`.scratch/configurable-table-count/PRD.md`

## What to build

One Playwright spec extending `tests/e2e/` that proves the feature
end-to-end across all user-facing slices:

1. Admin logs in and edits Table Mappings on `/admin` (add a new Table and
   remove an existing one via the 03 form).
2. The `/tables` menu updates to reflect the new set of Tables, ordered by
   Slot ASC, with the removed Slot absent.
3. `/tables/<removed-slot>` renders the "Table removed" view.
4. The dashboard renders the new count of cells (one per surviving Table
   Mapping), laid out in the dynamically-derived grid.

This is the integration proof. It cannot run until every user-facing slice
(03, 04, 05, 06) has landed.

## Acceptance criteria

- [ ] Spec exercises the full flow: admin edits mappings → menu updates →
      removed slot shows "Table removed" → dashboard renders the new count
- [ ] Spec asserts the `/tables` menu reflects the edited mappings (correct
      count, correct order, removed Slot absent)
- [ ] Spec asserts `/tables/<removed-slot>` shows "Table removed"
- [ ] Spec asserts the dashboard renders one cell per surviving Table
      Mapping in the dynamically-derived grid

## Blocked by

- `03-admin-tables-section-ui.md`
- `04-tables-menu-from-mappings.md`
- `05-table-removed-view.md`
- `06-dashboard-array-contract-grid.md`