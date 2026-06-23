Status: ready-for-agent

# 01 — Slot existence + validation in table-mappings

## Parent

`.scratch/configurable-table-count/PRD.md`

## What to build

Extend the read-side of the Table Mappings library so the rest of the feature
can consume a single, validated, ordered source of truth. This slice touches
no UI and no API contract — only the library helpers and their unit tests.

`getTableMappings()` must return mappings sorted by Slot ASC, with gaps
preserved (a removed Slot leaves a hole rather than renumbering survivors).
It must validate the stored JSON shape (array of `{ slot: positive integer,
cuescoreTableName: non-empty string }`) and fall back to `defaultTableMappings`
on any validation failure, matching the current fallback behaviour.

Add a companion helper that distinguishes "slot exists" from "slot unknown" so
pages can render "Table removed" rather than silently falling back to a
default CueScore Table Name (replacing today's silent fallback in
`getTableIdBySlot`).

Add a `MAX_TABLE_MAPPINGS = 12` constant used by both the editor validation
(in a later slice) and any read-side rendering that needs to bound work.

## Acceptance criteria

- [ ] `getTableMappings` returns mappings sorted by Slot ASC, gaps preserved
- [ ] `getTableMappings` validates the parsed shape and falls back to
      `defaultTableMappings` on invalid JSON, non-array, missing fields,
      non-positive Slots, or empty names
- [ ] A new "slot exists vs. unknown" helper discriminates configured Slots,
      unknown Slots, and Slots that fall in a gap; `getTableIdBySlot` no
      longer silently falls back to a default mapping for an unknown Slot
- [ ] `MAX_TABLE_MAPPINGS = 12` constant is exported
- [ ] Existing `table-mappings.test.ts` is extended to cover the above;
      prior art (defaults, parsing, fallback) stays green

## Blocked by

- None — can start immediately