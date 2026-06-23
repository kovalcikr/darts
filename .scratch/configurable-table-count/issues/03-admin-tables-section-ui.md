Status: ready-for-agent

# 03 — Admin "Tables" section UI on /admin

## Parent

`.scratch/configurable-table-count/PRD.md`

## What to build

New authenticated-only "Tables" section on `app/admin/page.tsx`, rendered
below the Tournaments list. Unauthenticated visitors do not see it.

Inside an `EditDisclosure` (matching the tournament card edit pattern),
renders a single `<form action={saveTableMappingsAction}>` listing the
current Table Mappings as rows:
- Slot (readonly display — stable identity)
- CueScore Table Name (text input)
- Remove (button that drops that row from the form)

Plus an "Add row" button (appends a row without a Slot; the server assigns
the next free Slot on submit) and a "Save Table Mappings" submit. Uses the
existing `ActionButton`, `TextField`, `EditDisclosure`, `SectionShell`
primitives from `app/admin/ui.tsx`.

This is the visible admin surface that makes the feature demoable end-to-end:
form → DB → reads on `/tables` and `/dashboard`.

## Acceptance criteria

- [ ] When authenticated, `/admin` renders a "Tables" section below the
      Tournaments list containing the current mappings inside an
      `EditDisclosure`
- [ ] When unauthenticated, `/admin` does not render the Tables section
- [ ] Each existing mapping row shows Slot readonly + CueScore Table Name
      input + Remove control
- [ ] "Add row" appends a new row; "Save Table Mappings" submits the form to
      `saveTableMappingsAction`
- [ ] A `returnTo` hidden input is included so the action can redirect back
      to the admin view
- [ ] Existing `page.test.tsx` static-markup test is extended to cover both
      the authenticated (section present) and unauthenticated (section
      absent) cases

## Blocked by

- `02-save-table-mappings-action.md` (the action the form submits to)