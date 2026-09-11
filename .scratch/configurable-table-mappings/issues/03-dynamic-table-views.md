Status: completed

# 03 — Render dynamic Tables and Dashboard

## What to build

Make the Tables menu and Dashboard derive their visible physical stations from
the global Table Mappings instead of assuming six fixed Tables. The dashboard
API and its sole client should use an ordered array of per-Table records, and
the UI should render one card or cell for each configured Mapping.

Preserve Slot identity in links, labels, test IDs, and cache identity. Gaps do
not render. Derive the grid layout from the number of configured Tables and
bound the supported configuration at ten Tables.

## Acceptance criteria

- [ ] The Tables menu renders one card per configured Mapping in Slot order.
- [ ] Table links and labels use the stable Slot, and gaps do not render.
- [ ] The dashboard API exposes ordered `tables` records rather than fixed
      `match1` through `match6` fields.
- [ ] The Dashboard client maps the array and renders one cell per Mapping.
- [ ] Dashboard layout is derived from the configured count and supports 1-10
      Tables without empty hardcoded cells.
- [ ] Snapshot, Dashboard, and Tables tests cover varying counts and gaps.

## Blocked by

- `.scratch/configurable-table-mappings/issues/01-admin-global-mappings.md`
