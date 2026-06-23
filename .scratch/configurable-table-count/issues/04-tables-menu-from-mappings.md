Status: ready-for-agent

# 04 — /tables menu renders from Table Mappings

## Parent

`.scratch/configurable-table-count/PRD.md`

## What to build

Remove the hardcoded six-entry list in `app/tables/page.tsx`. Read
`getTableMappings()` and render one card per mapping, ordered by Slot ASC,
linking to `/tables/<slot>` using the Slot. Gaps do not render as cards.

With 01 + 03 done, this is the first spectator-visible effect of an admin
editing the mappings: the menu updates to reflect the configured Tables.
With only 01 done, the menu still consumes real mappings even before the
admin UI exists (it just reads whatever is in the `tableMappings` AppSetting).

## Acceptance criteria

- [ ] `/tables` renders one card per Table Mapping returned by
      `getTableMappings()`, ordered by Slot ASC
- [ ] Cards link to `/tables/<slot>` using the mapping's Slot
- [ ] Gaps in the Slot sequence do not render as cards
- [ ] The hardcoded six-entry list is removed
- [ ] Existing `app/tables/__tests__/page.test.tsx` is extended to cover the
      above (mock `getTableMappings` and assert one card per mapping, ordered
      by Slot ASC, gaps don't render)

## Blocked by

- `01-slot-existence-validation.md` (ordered, gap-preserving `getTableMappings`)