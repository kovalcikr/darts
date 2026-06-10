# Containerised test runner

The test runner is a single Docker image plus `docker-compose.test.yml`. A
`docker compose run` invocation brings up a sibling Postgres 15 container, the
test image with the host source bind-mounted **read-only** at `/app`, waits for
Postgres, regenerates the Prisma client, applies the schema, and dispatches to
Jest (unit and integration) or Playwright (UI and E2E) based on the first
positional argument (`unit | integration | ui | e2e | all`). A second positional
argument is forwarded as a test-name filter (`-t` for Jest, `-g` for
Playwright) and applies to every group when the group is `all`. Writable
subpaths (`node_modules`, `prisma/generated`, `.next-dev`, `/var/test-logs`)
are mounted as named volumes or host bind mounts so the test process can write
to them despite the read-only source root. On success the runner prints only
one summary line per group; on failure it prints the group name, the last 20
lines of the full log, and a host-path hint so the agent can `tail -n N
.testcontainer/logs/last.log` to read more without rerunning tests. A flaky
Playwright test is treated as a failure even when Playwright exits 0.
