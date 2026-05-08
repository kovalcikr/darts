# Darts Domain Glossary

## Dashboard

**Dashboard** — 6-table real-time match overview projection combining CueScore match data with local live state. Displays current matches, scores, leg counts, and averages across all tournament tables. Updated every second via auto-refresh.

**Dashboard Projection** — Module at `app/lib/dashboard/snapshot.ts` that produces the Dashboard's data contract from MatchLiveState and CueScore matches. Owns the interface `getDashboardSnapshot(tournamentId, fetcher?)` which returns pre-projected match/liveState/tableId arrays.

**Dashboard Tournament Fetcher** — Seam module at `app/lib/dashboard/tournament-fetcher.ts` that abstracts how tournament matches are retrieved. Default implementation uses the CueScore Gateway; tests can inject FakeCueScoreGateway for deterministic behavior.

## Match Live State

**MatchLiveState** — Projected state derived from the durable throw log. Contains current leg, remaining scores, total scores, dart counts, active player, starting player, and last 6 throws. Stored in `matchLiveState` table for fast dashboard reads. Rebuilt from `playerThrow` records via `refreshMatchLiveState()`.