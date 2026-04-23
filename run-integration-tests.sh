#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

cleanup() {
  echo "Stopping PostgreSQL server..."
  sudo docker compose --env-file .env.test down
}

trap cleanup EXIT

# 1. Copy .env.example to .env.test if it doesn't exist
if [ ! -f .env.test ]; then
  echo "Creating .env.test from .env.example"
  cp .env.example .env.test
fi

# 2. Source environment variables from .env.test for pg_isready
if [ -f .env.test ]; then
  export $(cat .env.test | sed 's/#.*//g' | xargs)
fi

# 3. Start postgres server
echo "Starting PostgreSQL server..."
sudo docker compose --env-file .env.test up -d

# 4. Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
container_id=$(sudo docker compose --env-file .env.test ps -q | head -n 1)
until sudo docker exec "$container_id" pg_isready -U "$POSTGRES_USER" -d "darts-test" -q; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done
echo "Postgres is up - continuing..."

db_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5433/darts-test"
if ! nc -z 127.0.0.1 5433 >/dev/null 2>&1; then
  container_ip=$(sudo docker inspect "$container_id" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
  db_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${container_ip}:5432/darts-test"
  echo "Host port 5433 is unavailable, using container bridge address ${container_ip}:5432"
fi

export POSTGRES_PRISMA_URL="$db_url"
export POSTGRES_URL_NON_POOLING="$db_url"

# 5. Run tests
echo "Running integration tests..."
npm run test:integration

echo "Integration test script finished."
