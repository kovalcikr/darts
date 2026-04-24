#!/bin/bash

set -e

started_compose=false

cleanup() {
  if [ "$started_compose" = true ]; then
    echo "Stopping PostgreSQL server..."
    sudo docker compose --env-file .env.test down
  fi
}

trap cleanup EXIT

if [ ! -f .env.test ]; then
  echo "Creating .env.test from .env.example"
  cp .env.example .env.test
fi

if [ -f .env.test ]; then
  export $(cat .env.test | sed 's/#.*//g' | xargs)
fi

db_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5433/darts-test"
if nc -z 127.0.0.1 5433 >/dev/null 2>&1 && psql "$db_url" -c 'select 1;' >/dev/null 2>&1; then
  echo "Using existing PostgreSQL server on 127.0.0.1:5433"
else
  echo "Starting PostgreSQL server..."
  sudo docker compose --env-file .env.test up -d
  started_compose=true

  echo "Waiting for PostgreSQL to be ready..."
  container_id=$(sudo docker compose --env-file .env.test ps -q | head -n 1)
  until sudo docker exec "$container_id" pg_isready -U "$POSTGRES_USER" -d "darts-test" -q; do
    >&2 echo "Postgres is unavailable - sleeping"
    sleep 1
  done
  echo "Postgres is up - continuing..."

  if ! nc -z 127.0.0.1 5433 >/dev/null 2>&1; then
    container_ip=$(sudo docker inspect "$container_id" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
    db_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${container_ip}:5432/darts-test"
    echo "Host port 5433 is unavailable, using container bridge address ${container_ip}:5432"
  fi
fi

export POSTGRES_PRISMA_URL="$db_url"
export POSTGRES_URL_NON_POOLING="$db_url"

echo "Running Prisma migrations for Playwright E2E..."
npm run migrate:test

echo "Running Playwright E2E tests..."
npm run test:ui:e2e:runner

echo "Playwright E2E test script finished."
