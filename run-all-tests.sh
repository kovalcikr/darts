#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Parse arguments
VERBOSE=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -v|--verbose) VERBOSE=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

log() {
    if [ "$VERBOSE" = true ]; then
        echo "$@"
    fi
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo "[INFO] $@"
    fi
}

# Stage exit codes: 1=build, 2=unit, 3=integration, 4=UI, 5=E2E
STAGE_FAILED=0

# Track what we started
started_db=false

cleanup() {
    local exit_code=$?
    log_verbose "Cleaning up..."

    # Kill any processes on test ports
    if command -v fuser &> /dev/null; then
        fuser -k 3001/tcp 2>/dev/null || true
        fuser -k 3002/tcp 2>/dev/null || true
    fi

    # Stop DB only if we started it
    if [ "$started_db" = true ]; then
        log_verbose "Stopping PostgreSQL server..."
        podman stop darts-postgres-test >/dev/null 2>&1 || true
        podman rm darts-postgres-test >/dev/null 2>&1 || true
    fi

    if [ $STAGE_FAILED -ne 0 ]; then
        exit $STAGE_FAILED
    fi
    exit $exit_code
}

trap cleanup EXIT

# Create .env.test if missing
if [ ! -f .env.test ]; then
    echo "Creating .env.test from .env.example"
    cp .env.example .env.test
fi

# Source environment variables
if [ -f .env.test ]; then
    export $(cat .env.test | sed 's/#.*//g' | xargs)
fi

# Find an available port
find_free_port() {
    local port
    while true; do
        port=$((RANDOM % 10000 + 10000))
        if ! nc -z 127.0.0.1 $port 2>/dev/null; then
            echo $port
            return
        fi
    done
}

# Detect or start DB
DB_PORT=$(find_free_port)
log_verbose "Using database port: $DB_PORT"
db_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${DB_PORT}/darts-test"
if nc -z 127.0.0.1 $DB_PORT >/dev/null 2>&1; then
    log_verbose "Using existing PostgreSQL server on 127.0.0.1:$DB_PORT"
    started_db=false
else
    log "Starting PostgreSQL server on port $DB_PORT..."
    started_db=true
    podman run -d --name darts-postgres-test -e POSTGRES_USER="${POSTGRES_USER}" -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" -e POSTGRES_DB=darts-test -p ${DB_PORT}:5432 --rm postgres:15-alpine

    log "Waiting for PostgreSQL to be ready..."
    until nc -z 127.0.0.1 $DB_PORT >/dev/null 2>&1; do
        >&2 echo "Postgres is unavailable - sleeping"
        sleep 1
    done
    echo "Postgres is up - continuing..."
fi

export POSTGRES_PRISMA_URL="$db_url"
export POSTGRES_URL_NON_POOLING="$db_url"

# Kill any existing servers on test ports
log_verbose "Checking for existing servers on ports 3001/3002..."
if command -v fuser &> /dev/null; then
    fuser -k 3001/tcp 2>/dev/null || true
    fuser -k 3002/tcp 2>/dev/null || true
fi

# === BUILD ===
log "Building..."
if ! npm run build; then
    STAGE_FAILED=1
    exit 1
fi

# === UNIT TESTS ===
log "Running unit tests..."
if ! npm run test; then
    STAGE_FAILED=2
    exit 1
fi

# === INTEGRATION TESTS ===
log "Running integration tests..."
if ! npm run test:integration; then
    STAGE_FAILED=3
    exit 1
fi

# === UI TESTS ===
log "Running UI tests..."
if ! npm run test:ui; then
    STAGE_FAILED=4
    exit 1
fi

# Kill any lingering servers after UI tests
log_verbose "Cleaning up servers after UI tests..."
if command -v fuser &> /dev/null; then
    fuser -k 3001/tcp 2>/dev/null || true
fi

# === E2E TESTS ===
log "Running E2E tests..."
if ! npm run migrate:test; then
    STAGE_FAILED=5
    exit 1
fi
if ! npm run test:ui:e2e:runner; then
    STAGE_FAILED=5
    exit 1
fi

echo "All tests completed successfully."