#!/usr/bin/env bash

set -euo pipefail

GROUP="${1:-all}"
shift || true

FILTER="${1:-}"
if [ "$#" -gt 0 ]; then
  shift
fi

export POSTGRES_PRISMA_URL="postgresql://${POSTGRES_USER:-testuser}:${POSTGRES_PASSWORD:-testpassword}@postgres:5432/darts-test"
export POSTGRES_URL_NON_POOLING="$POSTGRES_PRISMA_URL"
export CUESCORE_PROVIDER="${CUESCORE_PROVIDER:-fake}"
export ENABLE_TEST_API="${ENABLE_TEST_API:-true}"
export ENABLE_TEST_ROUTES_IN_PRODUCTION="${ENABLE_TEST_ROUTES_IN_PRODUCTION:-true}"
export NODE_OPTIONS="${NODE_OPTIONS:---experimental-vm-modules}"

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

wait_for_postgres() {
  local host="${1:-postgres}"
  local port="${2:-5432}"
  local attempts=30
  log "Waiting for postgres at ${host}:${port}..."
  until nc -z "$host" "$port" >/dev/null 2>&1; do
    attempts=$((attempts - 1))
    if [ "$attempts" -le 0 ]; then
      log "postgres not reachable after 30s"
      return 1
    fi
    sleep 1
  done
  until pg_isready -h "$host" -p "$port" -U "${POSTGRES_USER:-testuser}" -d "darts-test" -q; do
    attempts=$((attempts - 1))
    if [ "$attempts" -le 0 ]; then
      log "pg_isready never succeeded"
      return 1
    fi
    sleep 1
  done
  log "postgres is ready"
}

install_deps_if_needed() {
  if [ -d /app/node_modules/.prisma ] || [ -d /app/node_modules/@prisma/client ]; then
    return 0
  fi
  log "Installing dependencies into /app/node_modules..."
  local tmp
  tmp=$(mktemp -d)
  cp /app/package.json /app/package-lock.json "$tmp/"
  (cd "$tmp" && npm ci --no-audit --no-fund --prefix /app)
  rm -rf "$tmp"
}

generate_prisma_client() {
  install_deps_if_needed
  log "Generating Prisma client..."
  npx prisma generate
}

migrate_database() {
  log "Applying Prisma schema to test database..."
  npx prisma db push
}

extract_jest_summary() {
  awk '/^Tests:[[:space:]]/ { last = $0 } END { print last }'
}

strip_ansi_carriage() {
  sed -E $'s/\033\\[[0-9;]*[A-K]//g; s/\r//g'
}

extract_playwright_summary() {
  strip_ansi_carriage | awk '/passed|failed|flaky|skipped/ { last = $0 } END { print last }' | sed -E 's/^[[:space:]]+//' | grep -E '^[0-9]+ (passed|failed|skipped|flaky)' | tail -n 1
}

run_unit() {
  log "Running unit tests (Jest)..."
  set +e
  local output
  if [ -n "$FILTER" ]; then
    output=$(npx jest --silent --testPathIgnorePatterns='/node_modules/|/__integration_tests__/|/tests/ui/|/tests/e2e/|/playwright-report/|/test-results/' -t "$FILTER" 2>&1)
  else
    output=$(npx jest --silent --testPathIgnorePatterns='/node_modules/|/__integration_tests__/|/tests/ui/|/tests/e2e/|/playwright-report/|/test-results/' 2>&1)
  fi
  local rc=$?
  set -e
  printf '%s\n' "$output" >> "$LOG_FILE"
  local summary
  summary=$(printf '%s\n' "$output" | extract_jest_summary)
  print_summary_or_tail unit "$rc" "unit tests: ${summary:-no summary}"
  return $rc
}

run_integration() {
  local prev="$NODE_OPTIONS"
  export NODE_OPTIONS="--experimental-vm-modules"
  log "Running integration tests (Jest)..."
  set +e
  local output
  if [ -n "$FILTER" ]; then
    output=$(JEST_ENV=integration npx jest --runInBand --silent -t "$FILTER" 2>&1)
  else
    output=$(JEST_ENV=integration npx jest --runInBand --silent 2>&1)
  fi
  local rc=$?
  set -e
  export NODE_OPTIONS="$prev"
  printf '%s\n' "$output" >> "$LOG_FILE"
  local summary
  summary=$(printf '%s\n' "$output" | extract_jest_summary)
  print_summary_or_tail integration "$rc" "integration tests: ${summary:-no summary}"
  return $rc
}

run_ui() {
  log "Running Playwright UI tests..."
  set +e
  local output
  if [ -n "$FILTER" ]; then
    output=$(npx playwright test --reporter=line --output=/var/test-logs/ui-output -g "$FILTER" tests/ui 2>&1)
  else
    output=$(npx playwright test --reporter=line --output=/var/test-logs/ui-output tests/ui 2>&1)
  fi
  local rc=$?
  set -e
  printf '%s\n' "$output" >> "$LOG_FILE"
  if printf '%s\n' "$output" | strip_ansi_carriage | grep -qE '^\s*[0-9]+ flaky'; then
    rc=1
  fi
  local summary
  summary=$(printf '%s\n' "$output" | extract_playwright_summary)
  print_summary_or_tail ui "$rc" "ui tests: ${summary:-no summary}"
  return $rc
}

build_next_for_e2e() {
  local build_dir="/app/.next"
  if [ -f "$build_dir/BUILD_ID" ]; then
    log "Reusing existing Next.js production build at $build_dir"
    return 0
  fi
  log "Building Next.js app for E2E into $build_dir (cached in .next-test on host)..."
  set +e
  local output
  output=$(NODE_ENV=production npx next build 2>&1)
  local rc=$?
  set -e
  printf '%s\n' "$output" >> "$LOG_FILE"
  if [ "$rc" -ne 0 ]; then
    log "next build failed (exit $rc); see $LOG_FILE"
    return "$rc"
  fi
}

run_e2e() {
  build_next_for_e2e
  log "Running Playwright E2E tests..."
  set +e
  local output
  if [ -n "$FILTER" ]; then
    output=$(npx playwright test --config=playwright.e2e.config.ts --reporter=line --output=/var/test-logs/e2e-output -g "$FILTER" 2>&1)
  else
    output=$(npx playwright test --config=playwright.e2e.config.ts --reporter=line --output=/var/test-logs/e2e-output 2>&1)
  fi
  local rc=$?
  set -e
  printf '%s\n' "$output" >> "$LOG_FILE"
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
    unit)        run_unit ;;
    integration) run_integration ;;
    ui)          run_ui ;;
    e2e)         run_e2e ;;
    *)
      log "Unknown group: $group"
      log "Valid groups: unit | integration | ui | e2e | all"
      exit 2
      ;;
  esac
}

case "$GROUP" in
  all)
    wait_for_postgres
    generate_prisma_client
    migrate_database
    overall=0
    for g in unit integration ui e2e; do
      log "=== $g ==="
      log_to_file "=== $g ==="
      run_group "$g" || overall=$?
    done
    if [ "$overall" -ne 0 ]; then
      log "Some groups failed. Log: $LOG_FILE"
      exit $overall
    fi
    ;;
  unit|integration|ui|e2e)
    wait_for_postgres
    generate_prisma_client
    if [ "$GROUP" = "integration" ] || [ "$GROUP" = "e2e" ]; then
      migrate_database
    fi
    run_group "$GROUP"
    ;;
  *)
    log "First argument must be a group: unit | integration | ui | e2e | all"
    exit 2
    ;;
esac

log "Done. Full log: $LOG_FILE"
