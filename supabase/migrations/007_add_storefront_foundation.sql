alter table public.profiles
  add column if not exists store_slug text,
  add column if not exists is_store_published boolean not null default false;

create or replace function public.make_store_slug(
  source_value text,
  user_id uuid
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  base_slug text;
  id_suffix text;
begin
  base_slug := trim(
    both '-'
    from regexp_replace(
      lower(coalesce(source_value, '')),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );

  if char_length(base_slug) < 3 then
    base_slug := 'store';
  end if;

  id_suffix := left(replace(user_id::text, '-', ''), 8);

  return left(base_slug, 51) || '-' || id_suffix;
end;
$$;

update public.profiles
set store_slug = public.make_store_slug(
  coalesce(
    nullif(trim(store_name), ''),
    nullif(split_part(email, '@', 1), ''),
    'store'
  ),
  id
)
where store_slug is null or trim(store_slug) = '';

alter table public.profiles
  drop constraint if exists profiles_store_slug_check;

alter table public.profiles
  add constraint profiles_store_slug_check
  check (
    char_length(store_slug) between 3 and 60
    and store_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  );

alter table public.profiles
  alter column store_slug set not null;

create unique index if not exists profiles_store_slug_unique_idx
  on public.profiles (store_slug);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_store_name text;
  default_store_slug text;
begin
  default_store_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'My Store'
  );

  default_store_slug := public.make_store_slug(
    default_store_name,
    new.id
  );

  insert into public.profiles as existing (
    id,
    email,
    full_name,
    store_name,
    business_email,
    store_slug,
    is_store_published
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    default_store_name,
    new.email,
    default_store_slug,
    false
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    store_name = coalesce(
      nullif(trim(existing.store_name), ''),
      excluded.store_name
    ),
    business_email = coalesce(
      nullif(trim(existing.business_email), ''),
      excluded.business_email
    ),
    store_slug = coalesce(
      nullif(trim(existing.store_slug), ''),
      excluded.store_slug
    ),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.get_public_store(
  p_store_slug text
)
returns table (
  merchant_id uuid,
  store_slug text,
  store_name text,
  business_email text,
  store_description text,
  currency text,
  logo_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.id as merchant_id,
    profile.store_slug,
    profile.store_name,
    profile.business_email,
    profile.store_description,
    profile.currency,
    profile.logo_path
  from public.profiles as profile
  where profile.store_slug = lower(trim(p_store_slug))
    and profile.is_store_published = true
  limit 1;
$$;

create or replace function public.get_public_products(
  p_store_slug text
)
returns table (
  id uuid,
  merchant_id uuid,
  title text,
  vendor text,
  price numeric,
  inventory integer,
  tags text[],
  image_path text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    product.id,
    product.merchant_id,
    product.title,
    product.vendor,
    product.price,
    product.inventory,
    product.tags,
    product.image_path,
    product.updated_at
  from public.products as product
  join public.profiles as profile
    on profile.id = product.merchant_id
  where profile.store_slug = lower(trim(p_store_slug))
    and profile.is_store_published = true
    and product.status = 'active'
    and product.inventory > 0
  order by product.updated_at desc;
$$;

create or replace function public.get_public_product(
  p_store_slug text,
  p_product_id uuid
)
returns table (
  id uuid,
  merchant_id uuid,
  title text,
  vendor text,
  price numeric,
  inventory integer,
  tags text[],
  image_path text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    product.id,
    product.merchant_id,
    product.title,
    product.vendor,
    product.price,
    product.inventory,
    product.tags,
    product.image_path,
    product.updated_at
  from public.products as product
  join public.profiles as profile
    on profile.id = product.merchant_id
  where profile.store_slug = lower(trim(p_store_slug))
    and profile.is_store_published = true
    and product.id = p_product_id
    and product.status = 'active'
    and product.inventory > 0
  limit 1;
$$;

revoke all on function public.get_public_store(text) from public;
revoke all on function public.get_public_products(text) from public;
revoke all on function public.get_public_product(text, uuid) from public;

grant execute on function public.get_public_store(text)
  to anon, authenticated, service_role;
grant execute on function public.get_public_products(text)
  to anon, authenticated, service_role;
grant execute on function public.get_public_product(text, uuid)
  to anon, authenticated, service_role;
