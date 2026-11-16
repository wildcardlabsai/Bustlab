-- =====================================================================
-- BUSTLAB — initial schema
-- Tables: profiles, collections, products, gallery_images, site_settings, contact_messages
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- An http(s) URL with a host. Used for store and social links.
create or replace function public.is_http_url(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value ~* '^https?://[a-z0-9-]+(\.[a-z0-9-]+)+(:[0-9]+)?(/[^\s]*)?$';
$$;

-- An image reference: an http(s) URL, or a site-relative path such as /images/foo.webp.
create or replace function public.is_image_ref(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select char_length(value) <= 2048
     and (public.is_http_url(value) or value ~ '^/[A-Za-z0-9._~/%-]+$');
$$;

create or replace function public.all_image_refs(values_ text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(public.is_image_ref(v)), true) from unnest(values_) as v;
$$;

-- ---------------------------------------------------------------------
-- profiles — one row per auth user; `role` controls admin access
-- ---------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text check (char_length(full_name) <= 120),
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Per-user profile. Only role = admin may manage site content.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Security-definer check used by RLS policies (avoids recursive policy evaluation).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Create a profile automatically for every new auth user (always as a normal user).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard against privilege escalation: only existing admins (or the database
-- owner / service role, e.g. via the SQL editor) can change a role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'Only administrators can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------
-- collections
-- ---------------------------------------------------------------------

create table public.collections (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(btrim(name)) between 1 and 120),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  description    text check (char_length(description) <= 2000),
  cover_image    text check (cover_image is null or public.is_image_ref(cover_image)),
  display_order  integer not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index collections_active_order_idx on public.collections (active, display_order, name);

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- products — showcase only (no prices, stock or checkout)
-- ---------------------------------------------------------------------

create table public.products (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null check (char_length(btrim(name)) between 1 and 160),
  slug                  text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
  short_description     text check (char_length(short_description) <= 300),
  description           text check (char_length(description) <= 8000),
  category_id           uuid references public.collections (id) on delete set null,
  main_image            text check (main_image is null or public.is_image_ref(main_image)),
  gallery_images        text[] not null default '{}'
                          check (cardinality(gallery_images) <= 24 and public.all_image_refs(gallery_images)),
  dimensions            text check (char_length(dimensions) <= 200),
  material_description  text check (char_length(material_description) <= 1000),
  ready_to_paint        boolean not null default true,
  featured              boolean not null default false,
  shopify_url           text check (shopify_url is null or public.is_http_url(shopify_url)),
  etsy_url              text check (etsy_url is null or public.is_http_url(etsy_url)),
  published             boolean not null default false,
  display_order         integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_listing_idx on public.products (published, featured desc, display_order, created_at desc);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- gallery_images
-- ---------------------------------------------------------------------

create table public.gallery_images (
  id                  uuid primary key default gen_random_uuid(),
  image_url           text not null check (public.is_image_ref(image_url)),
  caption             text check (char_length(caption) <= 300),
  alt_text            text check (char_length(alt_text) <= 300),
  collection_id       uuid references public.collections (id) on delete set null,
  is_painted_example  boolean not null default false,
  display_order       integer not null default 0,
  published           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on column public.gallery_images.is_painted_example is
  'True for painted inspiration imagery. Products are supplied unpainted; painted images are labelled on the site.';

create index gallery_images_collection_idx on public.gallery_images (collection_id);
create index gallery_images_listing_idx on public.gallery_images (published, display_order, created_at desc);

create trigger gallery_images_set_updated_at
  before update on public.gallery_images
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- site_settings — single row (id = 1)
-- ---------------------------------------------------------------------

create table public.site_settings (
  id                    smallint primary key default 1 check (id = 1),
  shopify_url           text check (shopify_url is null or public.is_http_url(shopify_url)),
  etsy_url              text check (etsy_url is null or public.is_http_url(etsy_url)),
  instagram_url         text check (instagram_url is null or public.is_http_url(instagram_url)),
  facebook_url          text check (facebook_url is null or public.is_http_url(facebook_url)),
  tiktok_url            text check (tiktok_url is null or public.is_http_url(tiktok_url)),
  youtube_url           text check (youtube_url is null or public.is_http_url(youtube_url)),
  contact_email         text check (contact_email is null or contact_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  logo_url              text check (logo_url is null or public.is_image_ref(logo_url)),
  announcement_enabled  boolean not null default false,
  announcement_text     text check (char_length(announcement_text) <= 200),
  announcement_link     text check (
                          announcement_link is null
                          or public.is_http_url(announcement_link)
                          or announcement_link ~ '^/[A-Za-z0-9._~/?=&%-]*$'
                        ),
  hero_image_url        text check (hero_image_url is null or public.is_image_ref(hero_image_url)),
  footer_tagline        text check (char_length(footer_tagline) <= 300),
  updated_at            timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- contact_messages — written by visitors, read by admins only
-- ---------------------------------------------------------------------

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  email       text not null check (char_length(email) <= 254 and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  subject     text not null check (char_length(btrim(subject)) between 1 and 150),
  message     text not null check (char_length(btrim(message)) between 10 and 5000),
  status      text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at  timestamptz not null default now()
);

create index contact_messages_created_idx on public.contact_messages (created_at desc);
create index contact_messages_email_idx on public.contact_messages (lower(email), created_at desc);

-- Basic abuse protection: per-address and global rate limits on new messages.
create or replace function public.contact_messages_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.contact_messages
       where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many messages from this address. Please try again later.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.contact_messages where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Too many messages right now. Please try again later.' using errcode = 'P0001';
  end if;
  new.status := 'new';
  new.created_at := now();
  return new;
end;
$$;

create trigger contact_messages_rate_limit
  before insert on public.contact_messages
  for each row execute function public.contact_messages_rate_limit();
