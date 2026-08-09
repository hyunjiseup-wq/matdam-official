const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort();
assert.ok(files.length > 0, '표준 Supabase 마이그레이션이 필요합니다.');

const sql = files.map((name) => fs.readFileSync(path.join(migrationsDir, name), 'utf8')).join('\n');
const hardeningFile = files.find((name) => name.endsWith('_harden_rls_and_function_permissions.sql'));
assert.ok(hardeningFile, 'RLS/함수 권한 보강 마이그레이션이 필요합니다.');
const hardeningSql = fs.readFileSync(path.join(migrationsDir, hardeningFile), 'utf8');

assert.match(sql, /alter table public\.profile_view_events enable row level security/i);
assert.match(sql, /revoke all on table public\.profile_view_events from anon, authenticated/i);
assert.match(sql, /primary key \(viewer_id, profile_id\)/i);
assert.match(sql, /profile_view_events_profile_id_idx[\s\S]*\(profile_id\)/i);
assert.match(sql, /on conflict \(viewer_id, profile_id\) do update/i);
assert.match(sql, /where events\.viewed_on < excluded\.viewed_on/i);
assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
assert.match(
  sql,
  /revoke all on function public\.increment_profile_view\(uuid\) from public, anon, authenticated/i,
);
assert.match(sql, /grant execute on function public\.increment_profile_view\(uuid\) to authenticated/i);
assert.doesNotMatch(sql, /auth\.role\s*\(/i);

assert.match(
  hardeningSql,
  /revoke all on function public\.on_restaurant_adopted\(\) from public, anon, authenticated, service_role/i,
);
assert.match(
  hardeningSql,
  /revoke all on function public\.on_feedback_replied\(\) from public, anon, authenticated, service_role/i,
);
assert.match(hardeningSql, /alter function public\.is_admin\(\) set search_path = ''/i);
assert.match(hardeningSql, /seoul_restaurants_source_owner_id_idx[\s\S]*\(source_owner_id\)/i);
assert.match(hardeningSql, /alter policy "sr insert"[\s\S]*\(select auth\.uid\(\)\)/i);
assert.match(
  hardeningSql,
  /where feedback\.id = feedback_replies\.feedback_id/i,
);
assert.match(
  hardeningSql,
  /alter policy "rp update admin"[\s\S]*using[\s\S]*with check/i,
);
assert.match(hardeningSql, /drop policy if exists "col write"/i);
assert.match(hardeningSql, /drop policy if exists "ci write"/i);
assert.match(hardeningSql, /create policy "col update admin"[\s\S]*with check/i);
assert.match(hardeningSql, /create policy "ci update admin"[\s\S]*with check/i);

console.log('Supabase security migration tests passed');
