Status: completed
Labels: wayfinder:research, needs-triage
Assignee: codex

## Question

Which client/server lifecycle causes the scoreboard to freeze or navigate after OK, if the symptom is reproducible?

Trace `ScoreBoard`, `GamepadButton`, `addThrowAction`, and the table page boundary. Determine whether the submitted score is read from a stale closure/ref, whether `isSubmitting` can remain true on an exception, whether a form submit/navigation can still occur, and whether the server action's external CueScore call delays completion after the database transaction succeeds. Record the exact failure mechanism and the fix contract; do not implement it here.

## Comments

### Resolution

The scoreboard buttons are `type="button"`, and the surrounding form has no action or method, so `OK` cannot cause native form navigation. Normal `OK` calls `addThrowAction` directly; checkout equality first renders `Darts used:` and the second `OK` calls the same action with the selected dart count. The submitted score is read from `currentScoreRef.current`, which is updated together with the displayed state, so this is not a stale-closure issue. Both submit handlers reset `isSubmitting` in `finally`, including on rejection.

`addThrowAction` commits the Prisma transaction and `MatchLiveState` projection first. Only checkout then awaits external CueScore `setScore`; table path/tag revalidation occurs after that await. A slow CueScore call can therefore keep the table spinner active after database/projection truth is updated, but normal throws do not call CueScore.

The dashboard is a separate race boundary: it fetches `/api/dashboard` immediately and every second, has no cancellation or request sequence, and unconditionally calls `setData` for every successful response. An older request resolving after a newer request can overwrite the display with an older snapshot. The snapshot reads `MatchLiveState` when present but starts by reading cached upstream matches through `unstable_cache`; tag invalidation does not order already-running requests.

Fix contract: after a throw commits, the dashboard must not regress to an older displayed snapshot when polls overlap or CueScore is slow. The regression seam must control response timing and assert both response order and rendered score; a server-action unit test alone cannot cover this multi-request race.
