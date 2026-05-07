# Darts Domain Glossary

## Dashboard

**Dashboard** — 6-table real-time match overview projection combining CueScore match data with local live state. Displays current matches, scores, leg counts, and averages across all tournament tables. Updated every second via auto-refresh.

## Match Live State

**MatchLiveState** — Projected state derived from the durable throw log. Contains current leg, remaining scores, total scores, dart counts, active player, starting player, and last 6 throws. Stored in `matchLiveState` table for fast dashboard reads. Rebuilt from `playerThrow` records via `refreshMatchLiveState()`.