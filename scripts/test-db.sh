#!/usr/bin/env bash
# Applies all migrations + seed to a throwaway database on a plain PostgreSQL server
# and runs the RLS/constraint test suite.
#   TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5432/postgres npm run test:db
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN_URL="${TEST_DATABASE_URL:-postgres://postgres@127.0.0.1:54322/postgres}"
DB="bustlab_test_$$"
BASE_URL="${ADMIN_URL%/*}"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)

"${PSQL[@]}" "$ADMIN_URL" -c "create database $DB"
trap '"${PSQL[@]}" "$ADMIN_URL" -c "drop database if exists $DB with (force)" >/dev/null' EXIT
URL="$BASE_URL/$DB"
"${PSQL[@]}" "$URL" -f "$ROOT/supabase/tests/local/00_supabase_base.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ applying $(basename "$f")"
  "${PSQL[@]}" "$URL" -f "$f"
done
echo "→ applying seed.sql"
"${PSQL[@]}" "$URL" -f "$ROOT/supabase/seed.sql"
echo "→ running RLS tests"
"${PSQL[@]}" "$URL" -f "$ROOT/supabase/tests/rls_test.sql"
