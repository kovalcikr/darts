Status: needs-triage
Labels: wayfinder:grilling, needs-triage

Blocked by:

- [Reproduce the scoreboard interaction](01-reproduce-scoreboard-interaction.md)
- [Trace the score-submit lifecycle](02-trace-score-submit-lifecycle.md)
- [Trace dashboard consistency](03-trace-dashboard-consistency.md)

## Question

What observable acceptance criteria and regression tests are needed to prove the glitch is fixed without overfitting to one timing?

Cover normal throw confirmation, checkout confirmation, repeated keypad interaction, simultaneous table/dashboard pages, slow CueScore responses, overlapping one-second dashboard polls, and the distinction between database truth, dashboard display, and upstream match score. This ticket should be finalized after tickets 01–03 expose the actual failure boundary.
