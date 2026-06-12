# UI and E2E tests target the standalone container

UI and E2E tests no longer spin up a dev or production server inside the
test container — they connect over the Compose network to the standalone
App image (`docker-compose.standalone.yaml`), so the production build
itself is what gets exercised end-to-end. The test stack is now three
files composed together (`docker-compose.yml` for Postgres,
`docker-compose.standalone.yaml` for the App, `docker-compose.test.yml`
for the test-env override and the Test Runner), and the Test Runner is
stripped to Playwright and a curl healthcheck — no Prisma, no Jest, no
project-wide `node_modules`. Unit and integration tests are run natively
on the host and are no longer the runner's concern.

## Considered options

**Keep the dev/prod server inside the test container.**
The previous setup spawned `next dev` (UI) and `next start` from a
test-container-internal `next build` (E2E) via Playwright's `webServer`
config. This was fast but meant the Dockerfile, its entrypoint, and
the production build's runtime image never appeared in the test path —
a broken `entrypoint.sh` or a missing `prisma` binary in the runner
stage would not be caught. Rejected: the whole point of the
containerised runner is to test what ships, and the only thing that
ships is the standalone image.

**Move only E2E to the standalone container; keep UI on a dev server.**
Sounded appealing for iteration speed, but the dev server's hot-reload
behaviour (timing, error overlay, HMR) would diverge from the prod
image's behaviour enough that UI tests would silently stop guarding
production behaviour. Rejected: the boundary is "what does the
shipped app do", not "what is fast to iterate on locally" — the local
workflow already has `npm run dev` for that.

**Keep the test runner image as a generic Node image with `npm ci`.**
This is what the previous `.testcontainer/Dockerfile` did. It still
works once the runner talks to an external App, but the image swallows
the whole project's `node_modules` (Prisma, Next.js, React, Jest, ESLint,
the Vercel CLI, etc.) when the runner only needs Playwright. The
shipped choice is to install only `@playwright/test@1.59.1`
(pinned to the exact version from `package-lock.json`) via
`npm install --no-save`, so the image carries a minimal layer and the
pre-installed Chromium browsers match the Playwright library that
the host's bind-mount provides at runtime. The image is
self-contained: it has `curl` for the healthcheck, the Playwright
library and browsers, and nothing else. Its purpose is honest: it is a
Playwright runner, nothing more.

## Consequences

- `playwright.config.ts` and `playwright.e2e.config.ts` lose their
  `webServer` blocks; `baseURL` is supplied via `PLAYWRIGHT_BASE_URL`,
  defaulting to `http://app:3000` inside the test stack and overridable
  for native runs. The two configs were later merged into a single
  `playwright.config.ts` with `testDir: './tests'`, both desktop and
  mobile projects, serial execution (`workers: 1`, `fullyParallel:
  false`), and a 90-second global timeout. The E2E config was deleted.
- `run-playwright-e2e-tests.sh`, `run-integration-tests.sh`,
  `dev:playwright`, `dev:playwright:e2e`, and the `npm run test:ui`
  shortcut are no longer the supported entry points — Playwright is
  run only from inside the test container. The host-side scripts and
  `package.json` entries are removed.
- `docker-compose.test.yml` no longer defines its own Postgres or
  uses a named `node_modules` volume. The runner binds the host
  source at `/app` and uses the host's `node_modules` (which provides
  `@playwright/test` at the lockfile-pinned version); the image's own
  `npm install @playwright/test@1.59.1` at build time ensures the
  pre-downloaded Chromium browsers match the runtime library exactly.
- The App's `depends_on: postgres` becomes
  `condition: service_healthy`, and the App gains its own healthcheck
  hitting `http://localhost:3000/tournaments` so the test runner can
  depend on a real readiness signal.
- The Test Runner image is slimmed to `node:22-bookworm-slim` +
  Playwright (pinned to `@playwright/test@1.59.1`) + `curl`. `apt`
  installs of `postgresql-client` and `netcat-openbsd` go away, and
  the source-mount dance is reduced to binding the host source at
  `/app` so the runner picks up test files and configs without a
  rebuild. The image self-contains both the Playwright library and
  matching Chromium browsers.
- Unit and integration tests are out of the runner's scope. They are
  run natively via `npm test` and `npm run test:integration`, which
  read `.env.test` and use the same Postgres on `127.0.0.1:5432` that
  `docker-compose.yml` exposes for dev.
