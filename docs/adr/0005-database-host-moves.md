# Database host moves go through dump, restore, and a verify gate

The production database changes hosts. It did on 2026-10-25, when the Neon
project behind `darts.relaxbiliard.sk` had spent 82.7% of its monthly compute
allowance with one tournament left in the month, and Neon suspends a project's
compute at 100%. The data moved to a second Neon project and the app was
repointed. This ADR records how a host move is done, because the next one is a
question of when.

A move runs `scripts/migrate-postgres.sh` and then
`scripts/vercel-db-env-flip.sh`, then a redeploy. Nothing is repointed until
verify is green on both sides. Row counts for all 8 tables, the `AppSetting`
keys, and the newest timestamps on `PlayerThrow`, `Tournament`, and
`MatchLiveState` must match. The dump carries the schema too, so a restored
database is complete without touching `prisma db push`.

## Considered Options

- **Hand-written SQL exports.** Rejected. There is no verification contract,
  and a missed table shows up as missing data to a user.
- **Logical replication to the new host.** Rejected. More moving parts than 52
  MB of data justifies. The schema has no extensions, enums, or migration
  history, so a plain `pg_dump` copies it whole.
- **Postgres on our own server for the event.** Rejected. The scoreboard read
  path runs about 17 sequential queries per render, so host latency lands in
  every score entry, and the move would have to happen twice, there and back.
- **Keep two projects in sync and fail over.** Rejected. Two writers to
  reconcile for one event.

## Consequences

- The cutover surface is two env vars, `POSTGRES_PRISMA_URL` and
  `POSTGRES_URL_NON_POOLING`. Nothing else reads database config
  (`app/lib/database-url.ts`). Keep the query params of the values already in
  place, because the pooled URL's params are part of what works today.
- Verify compares two live databases, so run dump, restore, and verify as one
  sequence. Writes that land between those steps make the counts drift and the
  gate fails for the wrong reason.
- Rollback is repointing the two vars and redeploying. It works while the old
  project can still wake, and it discards every write made after the flip, so
  accept the move or roll back within days.
- Moving resets the meter, not the burn. A project spending about 3.3
  CU-hours per day empties a 100 CU-hour monthly allowance. Cap the compute and
  stop idle dashboard polls between events, or the next project reaches the
  same limit.
- Status codes do not prove which database the app serves. Set a temporary
  marker row in the target, read it back through the app, then remove it.
- A database that is moved between Neon projects stays on the same plan
  allowances. The new project gets its own monthly compute allowance, which is
  what made the move worth doing.
