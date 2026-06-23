Status: ready-for-agent

# 02 — saveTableMappingsAction admin server action

## Parent

`.scratch/configurable-table-count/PRD.md`

## What to build

New auth-gated server action in `app/admin/actions.ts` that persists the full
list of Table Mappings. This slice is the write side only — no form, no UI;
the admin section comes in a later slice.

The action accepts the full list of mappings from the (future) single-form
editor and server-side validates:
- Slots are unique positive integers
- CueScore Table Names are unique and non-empty
- Count ≤ `MAX_TABLE_MAPPINGS` (12)

New rows the admin added (no Slot assigned by the client) are assigned the
smallest unused positive Slot on submit. The validated list is serialised
back to the `tableMappings` `AppSetting` value and the `/tables` and
`/dashboard` paths are revalidated.

On validation failure the action redirects back to `/admin` with an `error`
query param, matching the existing admin error banner pattern. The action is
auth-gated exactly like the other admin actions.

## Acceptance criteria

- [ ] `saveTableMappingsAction` is auth-gated identically to existing admin
      actions (unauthenticated call rejects/redirects)
- [ ] A valid list is serialised to the `tableMappings` AppSetting and
      `/tables`, `/dashboard` are revalidated
- [ ] New rows receive the smallest unused positive Slot on submit
- [ ] Duplicate Slots, duplicate CueScore Table Names, non-positive Slots,
      empty names, and counts > 12 each redirect to `/admin?error=...`
- [ ] Existing `actions.test.ts` is extended to cover the above using the
      existing `mockDeep<PrismaClient>` + `mockRedirect` pattern

## Blocked by

- `01-slot-existence-validation.md` (validation rules + `MAX_TABLE_MAPPINGS`)