alter table public.profiles
  add column if not exists store_name text,
  add column if not exists business_email text,
  add column if not exists store_description text,
  add column if not exists currency text not null default 'CAD',
  add column if not exists low_stock_threshold integer not null default 5,
  add column if not exists logo_path text;

alter table public.profiles
  drop constraint if exists profiles_currency_check;

alter table public.profiles
  add constraint profiles_currency_check
  check (currency in ('CAD', 'USD', 'EUR', 'GBP', 'AUD'));

alter table public.profiles
  drop constraint if exists profiles_low_stock_threshold_check;

alter table public.profiles
  add constraint profiles_low_stock_threshold_check
  check (low_stock_threshold between 0 and 9999);

update public.profiles
set
  store_name = coalesce(
    nullif(trim(store_name), ''),
    nullif(trim(full_name), ''),
    nullif(split_part(email, '@', 1), ''),
    'My Store'
  ),
  business_email = coalesce(
    nullif(trim(business_email), ''),
    email
  )
where
  store_name is null
  or trim(store_name) = ''
  or business_email is null
  or trim(business_email) = '';

alter table public.profiles
  alter column store_name set default 'My Store';

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_profiles_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  default_store_name text;
begin
  default_store_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'My Store'
  );

  insert into public.profiles as existing (
    id,
    email,
    full_name,
    store_name,
    business_email
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    default_store_name,
    new.email
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
    updated_at = timezone('utc', now());

  return new;
end;
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'store-logos',
  'store-logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Merchants can upload their store logo" on storage.objects;
create policy "Merchants can upload their store logo"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'store-logos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Merchants can read their store logo objects" on storage.objects;
create policy "Merchants can read their store logo objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'store-logos'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "Merchants can delete their store logo" on storage.objects;
create policy "Merchants can delete their store logo"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'store-logos'
  and owner_id = (select auth.uid()::text)
);
