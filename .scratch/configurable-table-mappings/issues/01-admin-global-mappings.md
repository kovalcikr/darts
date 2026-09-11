Status: completed

# 01 — Configure global Table Mappings in admin

## What to build

Give authenticated admins a complete way to manage the global venue mapping
between stable Slots and CueScore Table Names. The admin can view existing
mappings, edit CueScore Table Names, add mappings, and remove mappings without
changing the identity of existing Slots. Saving applies immediately to the
Active Tournament.

Persist the full configuration using the existing Table Mapping storage and
retain the default six mappings (Slots 1-6 to CueScore Table Names 11-16) when
no saved configuration exists. New mappings receive the smallest unused
positive Slot. A live Slot may be remapped, but the admin must receive a
warning that its next refresh may switch upstream grouping.

Reject empty configurations, non-positive or duplicate Slots, blank or
duplicate CueScore Table Names, and configurations containing more than ten
Table Mappings. CueScore Table Names are opaque strings and are trimmed before
being stored.

## Acceptance criteria

- [x] Authenticated admins can view, edit, add, remove, and save global Table
      Mappings from the admin area.
- [x] Existing Slot numbers are readonly and remain stable; new rows receive
      the smallest unused positive Slot.
- [x] A valid configuration persists and becomes effective immediately.
- [x] The default Slots 1-6 to CueScore Table Names 11-16 mapping is used when
      no saved configuration exists.
- [x] Empty, invalid, duplicate, or over-limit configurations are rejected
      with an actionable admin error.
- [x] Configurations cannot contain more than ten Table Mappings.
- [x] Remapping a Slot with a live Match is allowed and displays a warning.
- [x] Unit and admin UI tests cover persistence, validation, defaults,
      stable Slots, and authentication visibility.

## Blocked by

None - can start immediately
