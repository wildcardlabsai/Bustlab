-- =====================================================================
-- BUSTLAB — Row Level Security & constraint tests
-- Run with: npm run test:db  (see scripts/test-db.sh)
-- Each check raises an exception on failure; the run stops at the first failure.
-- =====================================================================
\set ON_ERROR_STOP 1
begin;

-- Test fixtures (as the database owner)
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000a001', 'admin@example.test'),
  ('00000000-0000-4000-8000-00000000b002', 'visitor@example.test');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-00000000a001';
insert into public.collections (id, name, slug, active) values ('00000000-0000-4000-8000-0000000c0001', 'Hidden', 'hidden', false);
insert into public.products (id, name, slug, published, category_id) values
  ('00000000-0000-4000-8000-0000000d0001', 'Draft bust', 'draft-bust', false, null);
insert into public.gallery_images (image_url, published) values ('/images/draft.webp', false);

do $$ begin
  assert (select count(*) from public.profiles) = 2, 'profiles should be auto-created for new auth users';
  assert (select role from public.profiles where email = 'visitor@example.test') = 'user', 'new users must default to role user';
  raise notice 'PASS fixtures & profile trigger';
end $$;

-- ===================================================== anonymous visitor
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

do $$
declare n int;
begin
  assert (select count(*) from public.products where not published) = 0, 'anon must not see unpublished products';
  assert (select count(*) from public.products) = 10, 'anon should see the 10 published seed products';
  assert (select count(*) from public.collections where not active) = 0, 'anon must not see inactive collections';
  assert (select count(*) from public.gallery_images where not published) = 0, 'anon must not see unpublished gallery images';
  assert (select count(*) from public.site_settings) = 1, 'anon can read site settings';
  assert not public.is_admin(), 'anon is not admin';

  begin
    insert into public.products (name, slug) values ('Hack', 'hack');
    raise exception 'FAIL: anon inserted a product';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.collections (name, slug) values ('Hack', 'hack');
    raise exception 'FAIL: anon inserted a collection';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.gallery_images (image_url) values ('/images/x.webp');
    raise exception 'FAIL: anon inserted a gallery image';
  exception when insufficient_privilege then null; end;

  update public.products set name = 'Hacked' where true;
  get diagnostics n = row_count;
  assert n = 0, 'anon must not update products';
  delete from public.products where true;
  get diagnostics n = row_count;
  assert n = 0, 'anon must not delete products';
  update public.site_settings set shopify_url = 'https://evil.example.com' where id = 1;
  get diagnostics n = row_count;
  assert n = 0, 'anon must not update settings';

  -- contact form: insert allowed, reading back is not
  insert into public.contact_messages (name, email, subject, message)
    values ('Ada', 'ada@example.test', 'Hello', 'A genuine enquiry about busts.');

  begin
    perform 1 from public.contact_messages;
    raise exception 'FAIL: anon read contact messages';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.contact_messages (name, email, subject, message, status)
      values ('Ada', 'ada2@example.test', 'Hello', 'Trying to set status.', 'archived');
    raise exception 'FAIL: anon set message status';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.contact_messages (name, email, subject, message) values ('Bot', 'not-an-email', 'Hi', 'Spam spam spam');
    raise exception 'FAIL: invalid email accepted';
  exception when check_violation then null; end;

  begin
    insert into public.contact_messages (name, email, subject, message) values ('Bot', 'b@example.test', 'Hi', 'short');
    raise exception 'FAIL: too-short message accepted';
  exception when check_violation then null; end;

  -- rate limit: 3 per address per hour
  insert into public.contact_messages (name, email, subject, message) values ('Ada', 'ADA@example.test', 'Again', 'Second message here.');
  insert into public.contact_messages (name, email, subject, message) values ('Ada', 'ada@example.test', 'Again', 'Third message here.');
  begin
    insert into public.contact_messages (name, email, subject, message) values ('Ada', 'ada@example.test', 'Again', 'Fourth message here.');
    raise exception 'FAIL: rate limit not enforced';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  begin
    insert into storage.objects (bucket_id, name) values ('media', 'anon.webp');
    raise exception 'FAIL: anon uploaded to storage';
  exception when insufficient_privilege then null; end;

  begin
    perform 1 from public.profiles;
    raise exception 'FAIL: anon read profiles';
  exception when insufficient_privilege then null; end;

  raise notice 'PASS anonymous visitor';
end $$;

-- ===================================================== signed-in non-admin
reset role;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"00000000-0000-4000-8000-00000000b002"}';

do $$
declare n int;
begin
  assert not public.is_admin(), 'regular user is not admin';
  assert (select count(*) from public.products where not published) = 0, 'non-admin must not see drafts';
  assert (select count(*) from public.profiles) = 1, 'user sees only own profile';
  assert (select count(*) from public.contact_messages) = 0, 'non-admin must not read messages';

  begin
    insert into public.products (name, slug) values ('Hack', 'hack');
    raise exception 'FAIL: non-admin inserted a product';
  exception when insufficient_privilege then null; end;

  update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-00000000b002';
  get diagnostics n = row_count;
  assert n = 0, 'user must not self-promote';
  assert not public.is_admin(), 'still not admin after attempted self-promotion';

  update public.site_settings set etsy_url = 'https://evil.example.com' where id = 1;
  get diagnostics n = row_count;
  assert n = 0, 'non-admin must not update settings';

  begin
    insert into storage.objects (bucket_id, name) values ('media', 'user.webp');
    raise exception 'FAIL: non-admin uploaded to storage';
  exception when insufficient_privilege then null; end;

  raise notice 'PASS signed-in non-admin';
end $$;

-- ===================================================== administrator
reset role;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"00000000-0000-4000-8000-00000000a001"}';

do $$
declare n int; pid uuid;
begin
  assert public.is_admin(), 'admin recognised';
  assert (select count(*) from public.products) = 11, 'admin sees drafts too';
  assert (select count(*) from public.collections where not active) = 1, 'admin sees inactive collections';
  assert (select count(*) from public.contact_messages) = 3, 'admin reads contact messages';
  assert (select bool_and(status = 'new') from public.contact_messages), 'new messages start as new';

  insert into public.products (name, slug, published, featured, shopify_url, gallery_images)
    values ('Test Bust', 'test-bust', true, true, 'https://shop.example.com/products/test', array['/images/a.webp', 'https://cdn.example.com/b.webp'])
    returning id into pid;
  update public.products set name = 'Test Bust II' where id = pid;
  get diagnostics n = row_count;
  assert n = 1, 'admin updates product';
  assert (select updated_at >= created_at from public.products where id = pid), 'updated_at maintained';

  begin
    update public.products set shopify_url = 'javascript:alert(1)' where id = pid;
    raise exception 'FAIL: unsafe URL accepted';
  exception when check_violation then null; end;

  begin
    update public.products set slug = 'Not A Slug!' where id = pid;
    raise exception 'FAIL: invalid slug accepted';
  exception when check_violation then null; end;

  begin
    update public.products set gallery_images = array['javascript:alert(1)'] where id = pid;
    raise exception 'FAIL: unsafe gallery image accepted';
  exception when check_violation then null; end;

  begin
    insert into public.products (name, slug) values ('Dup', 'vanguard-mk-ii');
    raise exception 'FAIL: duplicate slug accepted';
  exception when unique_violation then null; end;

  delete from public.products where id = pid;
  get diagnostics n = row_count;
  assert n = 1, 'admin deletes product';

  update public.site_settings set shopify_url = 'https://bustlab.myshopify.com', etsy_url = 'https://www.etsy.com/shop/bustlab' where id = 1;
  get diagnostics n = row_count;
  assert n = 1, 'admin updates settings';

  begin
    insert into public.site_settings (id) values (2);
    raise exception 'FAIL: second settings row';
  exception when insufficient_privilege or check_violation then null; end;

  update public.contact_messages set status = 'read' where true;
  get diagnostics n = row_count;
  assert n = 3, 'admin updates message status';

  insert into storage.objects (bucket_id, name) values ('media', 'products/test.webp');
  delete from storage.objects where name = 'products/test.webp';
  get diagnostics n = row_count;
  assert n = 1, 'admin manages storage objects';

  -- deleting a collection keeps its products (category set to null)
  delete from public.collections where slug = 'original-creations';
  assert (select category_id is null from public.products where slug = 'masked-ronin'), 'products survive collection deletion';

  update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-00000000b002';
  get diagnostics n = row_count;
  assert n = 1, 'admin can promote another user';

  raise notice 'PASS administrator';
end $$;

rollback;
\echo 'All RLS and constraint tests passed.'
