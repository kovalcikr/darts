Status: completed

# 04 — Verify the admin mapping flow end to end

## What to build

Add production-container Playwright coverage for the complete user-visible
workflow. An admin logs in, edits the global Table Mappings by removing one
Table and adding or changing another, and the application reflects the result
across the Tables menu, live Table URL, and Dashboard.

## Acceptance criteria

- [ ] The test authenticates as an admin and saves a valid mapping change.
- [ ] The Tables menu shows the new configured set in Slot order.
- [ ] The removed Slot is absent from the menu and shows “Table removed” when
      its stable URL is opened.
- [ ] The Dashboard renders exactly one cell per surviving Mapping.
- [ ] The test proves the user-visible flow against the production app
      container, not only isolated mocks.

## Blocked by

- `.scratch/configurable-table-mappings/issues/01-admin-global-mappings.md`
- `.scratch/configurable-table-mappings/issues/02-live-table-route-mappings.md`
- `.scratch/configurable-table-mappings/issues/03-dynamic-table-views.md`
