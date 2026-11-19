#!/usr/bin/env bash
# Moves the darts database between Postgres hosts with pg_dump/pg_restore and verifies every table.
# pg tools run in Docker so no postgresql-client is needed on the machine.
#
#   OLD_URL=... NEW_URL=... scripts/migrate-postgres.sh [preflight|dump|restore|verify|all]
#
# preflight and dump read only the source, so NEW_URL may stay empty for them.
set -euo pipefail

MODE="${1:-all}"
OLD_URL="${OLD_URL:?set OLD_URL to the source database}"
NEW_URL="${NEW_URL:-}"
WORKDIR="${WORKDIR:-$PWD}"
case "${1:-all}" in
  dump|all) DUMP="${DUMP:-$WORKDIR/darts-$(date -u +%Y%m%d-%H%M%SZ).dump}" ;;
  restore)  DUMP="${DUMP:-$( (ls -t "$WORKDIR"/*.dump 2>/dev/null || true) | head -1)}" ;;
  *)        DUMP="${DUMP:-}" ;;
esac

TABLES=(PlayerThrow MatchLiveState AppSetting Match Tournament TournamentAudit MatchAudit ThrowAudit)
PROBE_IMAGE="postgres:17-alpine"

pg() {
  local image="$1"; shift
  docker run --rm -i --network host "$image" "$@"
}

sql() {
  pg "$CLIENT_IMAGE" psql -v ON_ERROR_STOP=1 -Atc "$2" "$1"
}

require_target() {
  if [ -z "$NEW_URL" ]; then
    echo "this mode writes or compares the target, set NEW_URL" >&2
    exit 64
  fi
}

server_major() {
  local label="$1" url="$2" v
  if ! v=$(pg "$PROBE_IMAGE" psql -Atc 'show server_version' "$url" 2>/dev/null | head -1) || [ -z "$v" ]; then
    echo "cannot connect to $label with psql, aborting" >&2
    exit 3
  fi
  echo "${v%%.*}"
}

detect_client() {
  local old_major major
  old_major=$(server_major source "$OLD_URL")
  OLD_MAJOR="$old_major"
  if [ -n "$NEW_URL" ]; then
    NEW_MAJOR=$(server_major target "$NEW_URL")
    if [ "$NEW_MAJOR" -lt "$old_major" ]; then
      echo "target is Postgres $NEW_MAJOR but the source is $old_major, a dump cannot be restored into an older major" >&2
      exit 3
    fi
    major=$(( old_major > NEW_MAJOR ? old_major : NEW_MAJOR ))
    echo "source is Postgres $old_major, target is Postgres $NEW_MAJOR, client image postgres:${major}-alpine"
  else
    NEW_MAJOR=""
    major=$old_major
    echo "target unknown (NEW_URL unset), source is Postgres $old_major, client image postgres:${major}-alpine"
  fi
  CLIENT_IMAGE="postgres:${major}-alpine"
}

preflight() {
  detect_client
  echo "source database size $(sql "$OLD_URL" 'select pg_size_pretty(pg_database_size(current_database()))')"
  local t
  for t in "${TABLES[@]}"; do
    echo "source $t $(sql "$OLD_URL" "select count(*) from \"$t\"")"
  done
}

dump() {
  pg "$CLIENT_IMAGE" pg_dump --no-owner --no-privileges -Fc "$OLD_URL" > "$DUMP.partial"
  mv "$DUMP.partial" "$DUMP"
  echo "dumped $(du -h "$DUMP" | cut -f1) to $DUMP"
}

restore() {
  local t n
  if [ ! -f "$DUMP" ]; then
    echo "dump archive $DUMP does not exist" >&2
    exit 66
  fi
  if ! sql "$NEW_URL" 'select 1' >/dev/null 2>&1; then
    echo "cannot connect to the target, refusing to guess whether it is empty" >&2
    exit 3
  fi
  if [ "${FORCE:-0}" = "1" ]; then
    echo "FORCE=1, dropping schema public on the target before restore"
    sql "$NEW_URL" 'drop schema public cascade; create schema public;'
  fi
  for t in "${TABLES[@]}"; do
    n=$(sql "$NEW_URL" "select count(*) from \"$t\"" 2>/dev/null || echo missing)
    if [ "$n" != "0" ] && [ "$n" != "missing" ]; then
      if [ "${FORCE:-0}" = "1" ]; then
        echo "target $t already has $n rows, continuing because FORCE=1"
      else
        echo "target $t already has $n rows, refusing to restore over it. Set FORCE=1 to drop the target schema first."
        exit 2
      fi
    fi
  done
  pg "$CLIENT_IMAGE" pg_restore --single-transaction --no-owner --no-privileges --exit-on-error -d "$NEW_URL" < "$DUMP"
  echo "restored $DUMP into target"
}

verify() {
  local failed=0 t old new
  for t in "${TABLES[@]}"; do
    old=$(sql "$OLD_URL" "select count(*) from \"$t\"")
    new=$(sql "$NEW_URL" "select count(*) from \"$t\"")
    if [ "$old" = "$new" ]; then
      echo "PASS $t old=$old new=$new"
    else
      echo "FAIL $t old=$old new=$new"
      failed=1
    fi
  done
  if diff <(sql "$OLD_URL" 'select key from "AppSetting" order by key') \
          <(sql "$NEW_URL" 'select key from "AppSetting" order by key') >/dev/null; then
    echo "PASS AppSetting keys identical"
  else
    echo "FAIL AppSetting keys differ"
    failed=1
  fi
  for t in "PlayerThrow:time" "Tournament:eventDate" "MatchLiveState:updatedAt"; do
    old=$(sql "$OLD_URL" "select max(\"${t#*:}\") from \"${t%%:*}\"")
    new=$(sql "$NEW_URL" "select max(\"${t#*:}\") from \"${t%%:*}\"")
    if [ "$old" = "$new" ]; then
      echo "PASS ${t%%:*} newest ${t#*:} is $old on both sides"
    else
      echo "FAIL ${t%%:*} newest ${t#*:} old=$old new=$new"
      failed=1
    fi
  done
  return $failed
}

CLIENT_IMAGE="$PROBE_IMAGE"
case "$MODE" in
  preflight) preflight ;;
  dump)      detect_client; dump ;;
  restore)   require_target; detect_client; restore ;;
  verify)    require_target; detect_client; verify ;;
  all)
    require_target
    preflight
    dump
    restore
    verify
    ;;
  *)
    echo "usage: [OLD_URL=.. NEW_URL=..] $0 [preflight|dump|restore|verify|all]"
    exit 64
    ;;
esac
