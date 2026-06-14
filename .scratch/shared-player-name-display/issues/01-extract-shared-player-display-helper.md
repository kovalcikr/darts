Status: ready-for-agent
Type: enhancement

## What to build

The scoreboard (`app/tournaments/[id]/tables/[table]/`) and the dashboard (`app/dashboard/`) both render player names and per-throw history, but they share no display component and no name-shortening helper. This duplication is what hid the long-name bug on the dashboard — the scoreboard had a name-shortening helper and `min-w-0` clipping, the dashboard had neither, and there was no shared seam for the fix to land in.

Mirror the scoreboard's display layer on the dashboard side so the two views can't drift again.

### 1. Name shortening on the dashboard

The scoreboard already does this in `app/tournaments/[id]/tables/[table]/scoreboard-display.ts:32` via `buildScoreboardPlayerDisplayNames(playerNames, startingPlayerId)` — collapses to first name by default, disambiguates with `"First 1"` / `"First 2"` or `"First S."` when first names collide.

- Move `buildScoreboardPlayerDisplayNames` and its helpers (`getFirstName`, `getSurname`, `getDisambiguatedName`) out of `scoreboard-display.ts` into a shared module — e.g. `app/lib/display/player-display-names.ts`.
- Rename to `buildPlayerDisplayNames(playerNames, startingPlayerId)`.
- Have `scoreboard-display.ts` re-export it for backwards compatibility, or update the one caller (`app/tournaments/[id]/tables/[table]/scoreboard.tsx:100`) to import from the new path.
- Add a `buildDashboardPlayerDisplayNames` wrapper (or reuse the same helper) and apply it in `app/dashboard/dashboard-view.tsx` before passing `playerName` to each `<Player>` card. The dashboard only ever has two players per table, so the disambiguation cases reduce to "first names differ → use first; first names collide → existing disambiguation logic".

### 2. Shared `<PlayerName>` and `<ThrowList>` components

- Extract the dashboard's `<Player>` card at `app/dashboard/dashboard-view.tsx:193-238` into `app/components/PlayerCard.tsx` (or `app/dashboard/player-card.tsx`).
- Extract the player-name `<h2>` block into `<PlayerName name={...} active={...} />` that already applies `min-w-0 max-w-full overflow-hidden` + `truncate` internally. Reuse from both the dashboard and the scoreboard's `app/tournaments/[id]/tables/[table]/player-name.tsx:1-12`.
- Extract the throws `<p>` into `<ThrowList throws={...} />` that renders the comma-joined list with `truncate` + a `title` attribute carrying the full list. The scoreboard's chip-style throw history is a different visual treatment and should not be merged into this component — keep that one inline as it is.

### 3. Regression coverage

- The dashboard test added in `app/dashboard/__tests__/dashboard-view.test.tsx` ("truncates long player names and fits the throw list inside the dashboard card") already locks down the layout-class guarantee. Keep it.
- Add a unit test for `buildPlayerDisplayNames` covering: single-word name, two-word name, two players with same first name, two players with same first name and same first initial of surname, single-name player vs multi-name player. Mirror the existing `scoreboard-display` test if one exists; otherwise add it under `app/lib/display/__tests__/player-display-names.test.ts`.

## Why

The immediate trigger: a single-word very long name rendered fine on the scoreboard (because the name helper shortened it) but blew out the dashboard's 3-column grid (because the dashboard had no helper and the existing `truncate` was a no-op on a non-clipping parent).

The deeper cause: the scoreboard and dashboard each implement their own "render a player" layout with no shared component, no shared name-shortening helper, and no shared clipping convention. The scoreboard is the more mature pattern (data-layer shortening + layout clipping) and the dashboard is a regression of it.

## Acceptance criteria

- [ ] `buildPlayerDisplayNames` lives in `app/lib/display/` (or similar) and is the single source of truth for first-name + disambiguation logic.
- [ ] `app/tournaments/[id]/tables/[table]/scoreboard-display.ts` re-exports or delegates to the shared helper; behaviour unchanged.
- [ ] `app/dashboard/dashboard-view.tsx` uses the shared helper to shorten player names before rendering.
- [ ] A `<PlayerName>` component (or equivalent) exists and is used by both the dashboard and the scoreboard's `player-name.tsx`.
- [ ] The dashboard's throws `<p>` is replaced by a `<ThrowList>` component that owns the `truncate` + `title` convention.
- [ ] The existing dashboard test `truncates long player names and fits the throw list inside the dashboard card` still passes.
- [ ] A new test suite covers `buildPlayerDisplayNames` with the cases listed above.
- [ ] `npm test` and `npm run lint` are clean.

## Out of scope

- Visual changes to the scoreboard's chip-style throw history. It uses a different layout (6 fixed grid cells with player accent) and merging it into `<ThrowList>` would force the dashboard to drag in the accent class machinery. Leave the scoreboard's `ThrowHistory` inline.
- Changing the data shape of `Match.playerA.name` / `Match.playerB.name`. The shortening is display-only.
- Generalising to N-player matches. The dashboard and the scoreboard are both 1v1.

## Blocked by

None — can start immediately. The bug that motivated this is already fixed in `app/dashboard/dashboard-view.tsx` (CSS-only `min-w-0` / `truncate` patch) and locked down by the regression test, so this issue is purely about preventing the next regression of the same class.

## Comments

> *This was generated by AI during triage.*

## Agent Brief

**Category:** enhancement

**Summary:** Extract shared display helpers (`buildPlayerDisplayNames`, `<PlayerName>`, `<ThrowList>`) from the scoreboard so the dashboard reuses them instead of duplicating layout logic.

**Current behavior:**
The scoreboard and dashboard each render player names and throw history independently. The scoreboard has a name-shortening helper (`buildScoreboardPlayerDisplayNames`) that collapses to first name and disambiguates collisions, plus a `<PlayerName>` component with `min-w-0`/`truncate` clipping. The dashboard has neither — it passes raw `match.playerA.name` to an inline `<Player>` card with no shortening layer. This caused a long-name bug where the dashboard's 3-column grid blew out (since fixed with CSS-only `min-w-0` patch).

**Desired behavior:**
Move the name-shortening logic and two display components into shared modules so both views can't drift again:
- `buildPlayerDisplayNames` in `app/lib/display/` as the single source of truth for first-name + disambiguation logic
- `<PlayerName>` component that applies `min-w-0 max-w-full overflow-hidden truncate` internally, reused by both the dashboard and the scoreboard
- `<ThrowList>` component that renders comma-joined throws with `truncate` + `title` attribute, replacing the dashboard's inline throws `<p>`
- The scoreboard's existing `buildScoreboardPlayerDisplayNames` re-exports from the shared helper for backwards compatibility
- The dashboard applies name-shortening before passing `playerName` to each `<Player>` card

**Key interfaces:**
- `buildScoreboardPlayerDisplayNames(playerNames, startingPlayerId)` in `scoreboard-display.ts` — three internal helpers (`getFirstName`, `getSurname`, `getDisambiguatedName`) should be extracted alongside it
- The scoreboard's `<PlayerName>` component at `player-name.tsx` — renders `img` + name `<div>` with `min-w-0`/`truncate`/`whitespace-nowrap` plus active-state colour
- The dashboard's inline `<Player>` card — its `<h2>` block (name display) and throws `<p>` (comma-joined list with `title`) are the extraction targets
- The existing test suite at `scoreboard-display.test.ts` covers name disambiguation and should be preserved or migrated alongside the shared helper

**Acceptance criteria:**
- [ ] `buildPlayerDisplayNames` lives in `app/lib/display/` (or similar) and is the single source of truth for first-name + disambiguation logic
- [ ] `scoreboard-display.ts` re-exports or delegates to the shared helper; behaviour unchanged
- [ ] `dashboard-view.tsx` uses the shared helper to shorten player names before rendering
- [ ] A `<PlayerName>` component exists and is used by both the dashboard and the scoreboard's `player-name.tsx`
- [ ] The dashboard's throws `<p>` is replaced by a `<ThrowList>` component that owns the `truncate` + `title` convention
- [ ] The existing dashboard test `truncates long player names and fits the throw list inside the dashboard card` still passes
- [ ] A new test suite covers `buildPlayerDisplayNames` with: single-word name, two-word name, two players with same first name, two players with same first name and same first initial of surname, single-name player vs multi-name player
- [ ] `npm test` and `npm run lint` are clean

**Out of scope:**
- Visual changes to the scoreboard's chip-style throw history (different layout, keep inline)
- Changing the data shape of `Match.playerA.name` / `Match.playerB.name`
- Generalising to N-player matches (both views are 1v1)
- The CSS-only `min-w-0` bugfix in the dashboard — that patch is already applied and tested; this issue is the structural fix
