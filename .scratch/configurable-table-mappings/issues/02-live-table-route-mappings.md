Status: completed

# 02 — Apply Table Mappings to live Table routes

## What to build

Make each live Table route resolve its CueScore Table Name from the current
global Table Mappings. A configured Slot continues to render its scoreboard,
and a remapping is reflected on the next live refresh without changing
existing Match data.

If a Slot is absent from the saved configuration, treat it as removed. Its
stable `/tables/<slot>` URL must render a clear “Table not available” view rather
than a generic 404 or silently falling back to a default CueScore Table Name.

## Acceptance criteria

- [x] A configured Slot resolves and renders using its configured CueScore
      Table Name.
- [x] Changing a mapping is observed by the live route on its next refresh.
- [x] An unmapped Slot renders a clear “Table not available” view.
- [x] An unmapped Slot never falls back to the default mapping.
- [x] Existing configured Slot URLs continue working after another Slot is
      removed.
- [x] Tests cover configured, remapped, and removed Slot behavior.

## Blocked by

- `.scratch/configurable-table-mappings/issues/01-admin-global-mappings.md` (completed)
