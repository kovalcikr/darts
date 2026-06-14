# Darts

The Relax Darts Cup tournament management and scoring system. This glossary captures
the domain language used in `DARTS.md` and the codebase, plus a few terms that
emerged from setting up a portable test environment.

## Domain

**Tournament**:
A darts event identified by a CueScore ID. Owns a set of Matches, has a season,
a date, and a name, and may be marked active for live URLs and may be excluded
from global statistics.
_Avoid_: Event, cup, competition

**Match**:
A head-to-head contest between two Players inside a Tournament, played as a
sequence of Legs. The Match result is determined by the number of Legs won.
_Avoid_: Game, round, fixture

**Leg**:
One scoring sequence within a Match, starting at a fixed remaining score and
ending when a player reaches zero with a valid checkout. A Leg is the atomic
unit of scoring.
_Avoid_: Round, set

**Throw**:
Three darts thrown by one Player in a single visit. A Throw has a score and may
finish a Leg if the remaining score reaches zero on a double or bullseye.
_Avoid_: Visit, attempt

**Player**:
A registered darts player with a CueScore profile. Identified by CueScore ID
and a name; has statistics aggregated across Tournaments.
_Avoid_: User, account, contestant

**PlayerMatchView**:
A presentation-oriented type holding a Player's name, photo URL, and live
scoring state (score remaining, darts count, match average, legs won, active
flag) within a specific Match. Distinct from the domain Player entity — a
PlayerMatchView is ephemeral and match-scoped.
_Avoid_: Player (for the match-scoped view — use the domain term for the
registered entity), PlayerCard, MatchPlayer

**Active Tournament**:
The single Tournament currently exposed at fixed live-scoring URLs
(`/tables`, `/dashboard`). Set by an admin.
_Avoid_: Current tournament, live tournament

**MatchLiveState**:
A read-optimised projection of a Match's live scoring state. Stores derived
fields (remaining score per player, totals, active player, starter, recent
throws) so live views (Dashboard, Table scoring UI) can render without
recomputing from raw PlayerThrows. Written by `refreshMatchLiveState` after
every score entry/undo/redo. Contains zero original data — everything is
computable from Match and PlayerThrow rows.
_Avoid_: Live cache, computed state (when clarity matters — it _is_ a cache,
but "projection" emphasises it's derived, not stale)

**Season**:
A year-scoped grouping of Tournaments used for aggregate statistics (e.g.
"Season 2026"). Statistics are computed per season.
_Avoid_: Year (when used as the statistics scope)

**CueScore Provider**:
The external data source for tournaments, matches, and player profiles. In
development, a local `fake` provider returns fixture data instead.
_Avoid_: API, source

## Test Environment

**Test Stack**:
The three-file Docker Compose stack used to run Playwright tests against
the production build. `docker-compose.yml` provides the shared Postgres,
`docker-compose.standalone.yaml` provides the production App image, and
`docker-compose.test.yml` overrides the App with test-mode env vars and
adds the Test Runner. All three files are composed together; services
share one network and the runner connects to the app over `app:3000`.
_Avoid_: Test compose, test setup

**Test Runner**:
A single Docker image and entrypoint script that runs all Playwright tests
against the production App image. Invoked via
`docker compose -f docker-compose.yml -f docker-compose.standalone.yaml -f
docker-compose.test.yml run --rm test [filter]`. Source is bind-mounted at
`/app` so the runner can pick up test files and the Playwright config from
the host. The image is self-contained: it pins `@playwright/test@1.59.1`
and pre-installs the matching Chromium browser. The host's own
`node_modules` (from the bind-mount) provides the Playwright library at
runtime; the image's browsers at `/root/.cache/ms-playwright/` match
because the version is pinned. The runner never generates the Prisma
client, talks to Postgres, or runs Jest — it only runs Playwright against
the App.
_Avoid_: Test container, docker-test

**App**:
The production Docker image built from `Dockerfile`, run as a standalone
container and addressed on the Compose network as `app:3000`. It runs
`prisma db push` then `node server.js` via its entrypoint. Playwright
tests target this image directly so regressions in the Dockerfile,
entrypoint, runtime env, or production build are caught end-to-end.
_Avoid_: Standalone container, prod image

**Test Filter**:
An optional positional argument to the test runner. Forwarded to Playwright
as `-g` (test-name pattern).
_Avoid_: Grep, pattern (in this context)

**Test Log**:
The full output of a test run, written to `.testcontainer/logs/last.log`
on the host (and `/var/test-logs/last.log` inside the runner). Always
preserved across runs. On success the entrypoint prints only a one-line
summary; on failure it prints the last 20 lines and a hint to read more
from the log. The agent can `tail -n N .testcontainer/logs/last.log`
after a failed run to see additional context without rerunning tests.
_Avoid_: Output, stdout (in this context)

**Shared Postgres**:
The Postgres 15 container at `docker-compose.yml`, addressed as
`postgres:5432` on the Compose network. The only Postgres in the test
stack: the App connects to it for queries and runs `prisma db push`
on startup to apply the schema; the host's dev server connects to it
when `docker compose up -d` is run. In the test stack, the App waits
for `service_healthy` before starting; the test runner waits for
`http://app:3000/tournaments` to respond before launching Playwright.
_Avoid_: Test database, sibling Postgres, dev Postgres
