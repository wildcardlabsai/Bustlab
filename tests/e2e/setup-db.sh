#!/usr/bin/env bash
# Creates a fresh e2e database: Supabase base stub + migrations + seed + test users.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ADMIN_URL="${TEST_DATABASE_URL:-postgres://postgres@127.0.0.1:54322/postgres}"
DB="${E2E_DB:-bustlab_e2e}"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" "$ADMIN_URL" -c "drop database if exists $DB with (force)" -c "create database $DB"
URL="${ADMIN_URL%/*}/$DB"
"${PSQL[@]}" "$URL" -f "$ROOT/supabase/tests/local/00_supabase_base.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do "${PSQL[@]}" "$URL" -f "$f"; done
"${PSQL[@]}" "$URL" -f "$ROOT/supabase/seed.sql"
"${PSQL[@]}" "$URL" <<'SQL'
alter table auth.users add column if not exists encrypted_password text;
create table if not exists auth.refresh_tokens_e2e (token text primary key, user_id uuid references auth.users(id) on delete cascade);
insert into auth.users (id, email, encrypted_password) values
  ('00000000-0000-4000-8000-0000000000a1', 'admin@bustlab.test', extensions.crypt('admin-password-123', extensions.gen_salt('bf'))),
  ('00000000-0000-4000-8000-0000000000b2', 'fan@bustlab.test', extensions.crypt('fan-password-123', extensions.gen_salt('bf')));
update public.profiles set role = 'admin' where email = 'admin@bustlab.test';
SQL
echo "e2e database ready: $URL"
