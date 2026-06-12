#!/usr/bin/env bash

set -euo pipefail

FILTER="${1:-}"

export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://app:3000}"

LOG_DIR="/var/test-logs"
LOG_FILE="$LOG_DIR/last.log"
mkdir -p "$LOG_DIR"
: > "$LOG_FILE"

TAIL_LINES=20

log() { echo "[test-runner] $*"; }
log_to_file() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >> "$LOG_FILE"; }

print_summary_or_tail() {
  local rc="$1"
  local summary="$2"
  if [ "$rc" -eq 0 ]; then
    printf '%s\n' "$summary"
    log_to_file "RESULT: PASS — $summary"
  else
    printf 'FAILED\n'
    log_to_file "RESULT: FAIL (exit $rc)"
    printf -- '--- last %s log lines (%s) ---\n' "$TAIL_LINES" "$LOG_FILE"
    tail -n "$TAIL_LINES" "$LOG_FILE" || true
    printf -- '--- end ---\n'
    printf 'Full log: %s\n' "$LOG_FILE"
    printf 'Host path: .testcontainer/logs/last.log\n'
    printf -- 'Read more: tail -n N .testcontainer/logs/last.log  (use N > %s)\n' "$TAIL_LINES"
  fi
}

wait_for_app() {
  local url="${PLAYWRIGHT_BASE_URL}/tournaments"
  local attempts="${WAIT_FOR_APP_ATTEMPTS:-90}"
  log "Waiting for app at ${url} (up to ${attempts}s)..."
  until curl -fsS -o /dev/null "$url"; do
    attempts=$((attempts - 1))
    if [ "$attempts" -le 0 ]; then
      log "app not reachable after ${WAIT_FOR_APP_ATTEMPTS:-90}s"
      return 1
    fi
    sleep 1
  done
  log "app is ready"
}

strip_ansi_carriage() {
  sed -E $'s/\033\\[[0-9;]*[A-K]//g; s/\r//g'
}

extract_playwright_summary() {
  strip_ansi_carriage | awk '/passed|failed|flaky|skipped/ { last = $0 } END { print last }' | sed -E 's/^[[:space:]]+//' | grep -E '^[0-9]+ (passed|failed|skipped|flaky)' | tail -n 1
}

run_playwright() {
  log "Running Playwright tests against ${PLAYWRIGHT_BASE_URL}..."
  set +e
  local output
  if [ -n "$FILTER" ]; then
    output=$(npx playwright test --reporter=line --output=/var/test-logs/output -g "$FILTER" 2>&1 | tee -a "$LOG_FILE")
  else
    output=$(npx playwright test --reporter=line --output=/var/test-logs/output 2>&1 | tee -a "$LOG_FILE")
  fi
  local rc=$?
  set -e
  if printf '%s\n' "$output" | strip_ansi_carriage | grep -qE '^\s*[0-9]+ flaky'; then
    rc=1
  fi
  local summary
  summary=$(printf '%s\n' "$output" | extract_playwright_summary)
  print_summary_or_tail "$rc" "playwright tests: ${summary:-no summary}"
  return $rc
}

wait_for_app
run_playwright
rc=$?

log "Done. Full log: $LOG_FILE"
exit $rc
