create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  vendor text not null check (char_length(trim(vendor)) > 0),
  price numeric(12, 2) not null default 0 check (price >= 0),
  inventory integer not null default 0 check (inventory >= 0),
  status text not null default 'active'
    check (status in ('active', 'draft', 'archived')),
  tags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_merchant_id_idx
  on public.products (merchant_id);

create index if not exists products_merchant_updated_at_idx
  on public.products (merchant_id, updated_at desc);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute procedure public.set_products_updated_at();

alter table public.products enable row level security;

drop policy if exists "Merchants can read their own products" on public.products;
create policy "Merchants can read their own products"
on public.products for select to authenticated
using ((select auth.uid()) = merchant_id);

drop policy if exists "Merchants can create their own products" on public.products;
create policy "Merchants can create their own products"
on public.products for insert to authenticated
with check ((select auth.uid()) = merchant_id);

drop policy if exists "Merchants can update their own products" on public.products;
create policy "Merchants can update their own products"
on public.products for update to authenticated
using ((select auth.uid()) = merchant_id)
with check ((select auth.uid()) = merchant_id);

drop policy if exists "Merchants can delete their own products" on public.products;
create policy "Merchants can delete their own products"
on public.products for delete to authenticated
using ((select auth.uid()) = merchant_id);

create or replace function public.seed_products_for_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.products
    (merchant_id, title, vendor, price, inventory, status, tags)
  values
    (new.id, 'Classic Hoodie', 'ShopPilot Apparel', 64.99, 18, 'active', array['hoodie', 'apparel']),
    (new.id, 'Canvas Backpack', 'Northline Goods', 89.00, 7, 'active', array['bag', 'travel']),
    (new.id, 'Wireless Desk Lamp', 'BrightWorks', 54.50, 4, 'active', array['home', 'office']),
    (new.id, 'Ceramic Travel Mug', 'Daily Brew', 28.00, 0, 'draft', array['drinkware']),
    (new.id, 'Minimalist Notebook', 'Paper & Co.', 16.75, 25, 'active', array['stationery']);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed_products on auth.users;
create trigger on_auth_user_created_seed_products
after insert on auth.users
for each row execute procedure public.seed_products_for_new_user();

insert into public.products
  (merchant_id, title, vendor, price, inventory, status, tags)
select
  users.id,
  seed.title,
  seed.vendor,
  seed.price,
  seed.inventory,
  seed.status,
  seed.tags
from auth.users as users
cross join (
  values
    ('Classic Hoodie', 'ShopPilot Apparel', 64.99::numeric, 18, 'active', array['hoodie', 'apparel']::text[]),
    ('Canvas Backpack', 'Northline Goods', 89.00::numeric, 7, 'active', array['bag', 'travel']::text[]),
    ('Wireless Desk Lamp', 'BrightWorks', 54.50::numeric, 4, 'active', array['home', 'office']::text[]),
    ('Ceramic Travel Mug', 'Daily Brew', 28.00::numeric, 0, 'draft', array['drinkware']::text[]),
    ('Minimalist Notebook', 'Paper & Co.', 16.75::numeric, 25, 'active', array['stationery']::text[])
) as seed(title, vendor, price, inventory, status, tags)
where not exists (
  select 1
  from public.products existing
  where existing.merchant_id = users.id
    and existing.title = seed.title
);
