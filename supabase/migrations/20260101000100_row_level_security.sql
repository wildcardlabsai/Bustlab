-- =====================================================================
-- BUSTLAB — Row Level Security
-- Visitors (anon) can read published/active content and submit contact
-- messages. Only profiles with role = 'admin' can create, edit or delete.
-- =====================================================================

alter table public.profiles         enable row level security;
alter table public.collections      enable row level security;
alter table public.products         enable row level security;
alter table public.gallery_images   enable row level security;
alter table public.site_settings    enable row level security;
alter table public.contact_messages enable row level security;

-- ---------------------------------------------------------------- profiles
create policy "Users read own profile; admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "Admins update profiles"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke insert, delete on public.profiles from anon, authenticated;
revoke all on public.profiles from anon;

-- ------------------------------------------------------------- collections
create policy "Anyone reads active collections; admins read all"
  on public.collections for select to anon, authenticated
  using (active or public.is_admin());

create policy "Admins insert collections"
  on public.collections for insert to authenticated with check (public.is_admin());
create policy "Admins update collections"
  on public.collections for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete collections"
  on public.collections for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- products
create policy "Anyone reads published products; admins read all"
  on public.products for select to anon, authenticated
  using (published or public.is_admin());

create policy "Admins insert products"
  on public.products for insert to authenticated with check (public.is_admin());
create policy "Admins update products"
  on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete products"
  on public.products for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------- gallery_images
create policy "Anyone reads published gallery images; admins read all"
  on public.gallery_images for select to anon, authenticated
  using (published or public.is_admin());

create policy "Admins insert gallery images"
  on public.gallery_images for insert to authenticated with check (public.is_admin());
create policy "Admins update gallery images"
  on public.gallery_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete gallery images"
  on public.gallery_images for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------- site_settings
create policy "Anyone reads site settings"
  on public.site_settings for select to anon, authenticated using (true);

create policy "Admins update site settings"
  on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke insert, delete on public.site_settings from anon, authenticated;

-- -------------------------------------------------------- contact_messages
-- Visitors may only INSERT the four message fields; they can never read messages back.
create policy "Anyone can submit a contact message"
  on public.contact_messages for insert to anon, authenticated with check (true);

create policy "Admins read contact messages"
  on public.contact_messages for select to authenticated using (public.is_admin());
create policy "Admins update contact messages"
  on public.contact_messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete contact messages"
  on public.contact_messages for delete to authenticated using (public.is_admin());

revoke all on public.contact_messages from anon;
revoke insert on public.contact_messages from authenticated;
grant insert (name, email, subject, message) on public.contact_messages to anon, authenticated;
