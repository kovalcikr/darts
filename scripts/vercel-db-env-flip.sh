#!/usr/bin/env bash
# Repoints the two database env vars the app reads at a new Postgres host.
# The new values come from an env file in KEY=value lines, the shape
# `vercel env pull` writes. Run `vercel login` and `vercel link` first.
#
#   scripts/vercel-db-env-flip.sh <new-env-file> [current-env-file]
#
# The current env file is only read to print the hosts in place before the
# change, since the Vercel API never returns values for these vars.
set -euo pipefail

NEW_ENV_FILE=${1:?usage: vercel-db-env-flip.sh <new-env-file> [current-env-file]}
CURRENT_ENV_FILE=${2:-}

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
PROJECT_JSON="$REPO_ROOT/.vercel/project.json"
AUTH_JSON="$HOME/.local/share/com.vercel.cli/auth.json"

for f in "$PROJECT_JSON" "$AUTH_JSON"; do
  [ -f "$f" ] || { echo "missing $f, run vercel link and vercel login first" >&2; exit 3; }
done

PROJ=$(jq -r .projectId "$PROJECT_JSON")
TEAM=$(jq -r .orgId "$PROJECT_JSON")
TOKEN=$(jq -r .token "$AUTH_JSON")

# app/lib/database-url.ts reads only these two, so they are the whole cutover surface
KEYS=(POSTGRES_PRISMA_URL POSTGRES_URL_NON_POOLING)

value_from() {
  local line
  line=$(grep -m1 "^$2=" "$1" || true)
  if [ -z "$line" ]; then
    echo "missing $2 in $1" >&2
    exit 5
  fi
  line="${line#*=}"
  line="${line%\"}"
  line="${line#\"}"
  printf '%s' "$line"
}

host_of() {
  printf '%s' "$1" | sed -E 's|.*@||; s|/.*||; s|:.*||'
}

ENVS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v9/projects/$PROJ/env?teamId=$TEAM")

flip() {
  local key="$1" val="$2" id type res
  id=$(printf '%s' "$ENVS" | jq -r --arg k "$key" '.envs[] | select(.key==$k) | .id')
  type=$(printf '%s' "$ENVS" | jq -r --arg k "$key" '.envs[] | select(.key==$k) | .type')
  if [ -z "$id" ] || [ "$id" = "null" ]; then
    echo "env var $key not found in project $PROJ" >&2
    exit 3
  fi
  res=$(curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "$(jq -n --arg v "$val" --arg t "$type" '{value:$v, type:$t}')" \
    "https://api.vercel.com/v9/projects/$PROJ/env/$id?teamId=$TEAM")
  if ! printf '%s' "$res" | jq -e '.id' >/dev/null 2>&1; then
    echo "update of $key failed: $(printf '%s' "$res" | cut -c1-200)" >&2
    exit 4
  fi
  echo "$key now points at host $(host_of "$val")"
}

for key in "${KEYS[@]}"; do
  val=$(value_from "$NEW_ENV_FILE" "$key")
  if [ -n "$CURRENT_ENV_FILE" ]; then
    echo "$key pointed at host $(host_of "$(value_from "$CURRENT_ENV_FILE" "$key")")"
  fi
  flip "$key" "$val"
done
echo "a redeploy is needed for the change to reach running functions"
