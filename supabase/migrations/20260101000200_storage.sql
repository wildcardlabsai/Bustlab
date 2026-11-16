-- =====================================================================
-- BUSTLAB — Storage bucket for uploaded images
-- Public read (images are served on the public website); only admins
-- can upload, replace or delete files.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public files are served via the public object URL without needing a SELECT
-- policy; listing objects is restricted to admins.
create policy "Admins list media"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_admin());

create policy "Admins upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "Admins update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "Admins delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
