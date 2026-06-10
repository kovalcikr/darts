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

**Active Tournament**:
The single Tournament currently exposed at fixed live-scoring URLs
(`/tables`, `/dashboard`). Set by an admin.
_Avoid_: Current tournament, live tournament

**Season**:
A year-scoped grouping of Tournaments used for aggregate statistics (e.g.
"Season 2026"). Statistics are computed per season.
_Avoid_: Year (when used as the statistics scope)

**CueScore Provider**:
The external data source for tournaments, matches, and player profiles. In
development, a local `fake` provider returns fixture data instead.
_Avoid_: API, source

## Test Environment

**Test Runner**:
The single Docker image and entrypoint script that executes all four test
families (unit, integration, ui, e2e) for this project. Invoked via
`docker compose -f docker-compose.test.yml run --rm test <group> [filter]`.
Sources are bind-mounted read-only at `/app`; writable subpaths are volumes.
_Avoid_: Test container, docker-test

**Test Group**:
One of `unit | integration | ui | e2e | all`, selected as the first positional
argument to the test runner. Each group maps to one underlying test tool
(Jest unit, Jest integration with `JEST_ENV=integration`, Playwright UI,
Playwright E2E).
_Avoid_: Suite, test type

**Test Filter**:
An optional second positional argument to the test runner. Forwarded to the
underlying tool as a test-name pattern: `-t` for Jest, `-g` for Playwright.
Applies to every group when used with `all`.
_Avoid_: Grep, pattern (in this context)

**Test Log**:
The full output of a test run, written to `.testcontainer/logs/last.log` on
the host (and `/var/test-logs/last.log` inside the container). Always
preserved across runs. On success the entrypoint prints only a one-line
summary; on failure it prints the last 20 lines and a hint to read more from
the log. The agent can `tail -n N .testcontainer/logs/last.log` after a
failed run to see additional context without rerunning tests.
_Avoid_: Output, stdout (in this context)

**Sibling Postgres**:
The Postgres 15 container that the test runner talks to over a user-defined
Docker network, addressed as `postgres:5432`. Started by
`docker-compose.test.yml`, not the host. Distinct from the host's
`docker-compose.yml` Postgres, which is for ad-hoc local development.
_Avoid_: Test database, postgres service
