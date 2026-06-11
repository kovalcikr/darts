#!/usr/bin/env bash

set -euo pipefail

GROUP="${1:-all}"
if [ "$#" -gt 0 ]; then
  shift
fi

FILTER="${1:-}"
if [ "$#" -gt 0 ]; then
  shift
fi

export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://app:3000}"

LOG_DIR="/var/test-logs"
LOG_FILE="$LOG_DIR/last.log"
mkdir -p "$LOG_DIR"
: > "$LOG_FILE"

TAIL_LINES=20

log() { echo "[test-runner] $*"; }
log_to_file() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >> "$LOG_FILE"; }

print_summary_or_tail() {
  local group="$1"
  local rc="$2"
  local summary="$3"
  if [ "$rc" -eq 0 ]; then
    printf '%s\n' "$summary"
    log_to_file "RESULT: PASS — $summary"
  else
    printf 'FAILED: %s\n' "$group"
    log_to_file "RESULT: FAIL (exit $rc) — $group"
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

run_ui() {
  log "Running Playwright UI tests against ${PLAYWRIGHT_BASE_URL}..."
  set +e
  local output
  if [ -n "$FILTER" ]; then
    output=$(npx playwright test --reporter=line --output=/var/test-logs/ui-output -g "$FILTER" tests/ui 2>&1 | tee -a "$LOG_FILE")
  else
    output=$(npx playwright test --reporter=line --output=/var/test-logs/ui-output tests/ui 2>&1 | tee -a "$LOG_FILE")
  fi
  local rc=$?
  set -e
  if printf '%s\n' "$output" | strip_ansi_carriage | grep -qE '^\s*[0-9]+ flaky'; then
    rc=1
  fi
  local summary
  summary=$(printf '%s\n' "$output" | extract_playwright_summary)
  print_summary_or_tail ui "$rc" "ui tests: ${summary:-no summary}"
  return $rc
}

run_e2e() {
  log "Running Playwright E2E tests against ${PLAYWRIGHT_BASE_URL}..."
  set +e
  local output
  if [ -n "$FILTER" ]; then
    output=$(npx playwright test --config=playwright.e2e.config.ts --reporter=line --output=/var/test-logs/e2e-output -g "$FILTER" 2>&1 | tee -a "$LOG_FILE")
  else
    output=$(npx playwright test --config=playwright.e2e.config.ts --reporter=line --output=/var/test-logs/e2e-output 2>&1 | tee -a "$LOG_FILE")
  fi
  local rc=$?
  set -e
  if printf '%s\n' "$output" | strip_ansi_carriage | grep -qE '^\s*[0-9]+ flaky'; then
    rc=1
  fi
  local summary
  summary=$(printf '%s\n' "$output" | extract_playwright_summary)
  print_summary_or_tail e2e "$rc" "e2e tests: ${summary:-no summary}"
  return $rc
}

run_group() {
  local group="$1"
  case "$group" in
    ui)  run_ui ;;
    e2e) run_e2e ;;
    *)
      log "Unknown group: $group"
      log "Valid groups: ui | e2e | all"
      exit 2
      ;;
  esac
}

case "$GROUP" in
  all)
    wait_for_app
    overall=0
    for g in ui e2e; do
      log "=== $g ==="
      log_to_file "=== $g ==="
      run_group "$g" || overall=$?
    done
    if [ "$overall" -ne 0 ]; then
      log "Some groups failed. Log: $LOG_FILE"
      exit $overall
    fi
    ;;
  ui|e2e)
    wait_for_app
    run_group "$GROUP"
    ;;
  *)
    log "First argument must be a group: ui | e2e | all"
    exit 2
    ;;
esac

log "Done. Full log: $LOG_FILE"
