Status: completed
Labels: wayfinder:task, needs-triage
Assignee: codex

## Question

Can the two reported UI symptoms be reproduced against the current app, and what exact browser-visible/network sequence occurs?

Capture the route, initial match/leg/player state, score entered, whether the first OK is a normal throw or checkout confirmation, whether the page navigates or reloads, the client console, and the relevant requests/responses. Test keypad number clicks, OK, and clicks on the scoreboard surface itself. Compare a normal browser interaction with the existing Playwright flow.

## Comments

### Resolution

The normal throw flow was reproduced against the running app using `tests/e2e/dashboard-cache-revalidate.spec.ts` with `PLAYWRIGHT_BASE_URL=http://localhost:3000`:

- Chromium desktop passed: entering `180` and clicking `OK` caused the dashboard to show `Score: 321` within the 10-second assertion window.
- Chromium mobile passed with the same result.

No navigation, freeze, or stale dashboard score occurred in either baseline run. The reported behavior remains unreproduced and is likely confined to an untested timing/error path, a different route/browser/device interaction, or an environment-specific condition. The next tickets should instrument slow CueScore responses, overlapping dashboard polls, and client/server errors.

### Supplemental browser evidence

An isolated manual run on 2026-09-17 used local production at `http://localhost:3000`, Table 1, Round 1, first to 3 legs, Fero Hruska vs Jozo Mrkva, both initially at 501; the leg was started with Fero Hruska. Keypad clicks `1`, `8`, `0` changed the input from `0` to `180`. The first `OK` took the normal-throw path and the UI settled at Fero `321`, `Last: 180`, `Darts: 3`, `Avg: 180.00`, with the throw in history.

The pathname stayed `/tables/1`, while the URL retained the existing start-match query marker as `/tables/1?_=1789656001811`. The scoreboard buttons are `type="button"`, so this was not native form navigation; `addThrowAction` revalidates the table path and `match1` tag, causing the table data refresh. Clicking the rendered `321` surface itself caused no state or URL change and no console error. Console output contained only unrelated Vercel Analytics/Speed Insights script-load logs.

The checkout branch was confirmed from the live component and established Playwright flow: when the entered score equals the remaining score, the first `OK` opens `Darts used:`; the second `OK` submits with the selected dart count. The focused unchanged Playwright test passed on Chromium desktop: `1 passed (12.0s)`. Neither freeze symptom nor a hard browser navigation was reproduced; the remaining investigation belongs to timing/error and overlapping-poll paths.
