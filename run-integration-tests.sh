#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

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
container_id=$(sudo docker compose --env-file .env.test ps -q postgres)
until sudo docker exec "$container_id" pg_isready -U "$POSTGRES_USER" -d "darts-test" -q; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done
echo "Postgres is up - continuing..."

# 5. Run db migrations
echo "Running database migrations..."
npm run migrate:test

# 6. Run tests
echo "Running integration tests..."
npm run test:integration

# 7. Stop postgres server
echo "Stopping PostgreSQL server..."
sudo docker compose --env-file .env.test down

echo "Integration test script finished."