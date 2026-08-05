create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null check (char_length(trim(order_number)) > 0),
  customer_name text not null check (char_length(trim(customer_name)) > 0),
  customer_email text not null check (char_length(trim(customer_email)) > 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'packed', 'shipped', 'delivered', 'refunded')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (merchant_id, order_number)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_title text not null check (char_length(trim(product_title)) > 0),
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (order_id, product_title)
);

create index if not exists orders_merchant_created_at_idx
  on public.orders (merchant_id, created_at desc);

create index if not exists orders_merchant_status_idx
  on public.orders (merchant_id, status);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute procedure public.set_orders_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Merchants can read their own orders" on public.orders;
create policy "Merchants can read their own orders"
on public.orders for select to authenticated
using ((select auth.uid()) = merchant_id);

drop policy if exists "Merchants can create their own orders" on public.orders;
create policy "Merchants can create their own orders"
on public.orders for insert to authenticated
with check ((select auth.uid()) = merchant_id);

drop policy if exists "Merchants can update their own orders" on public.orders;
create policy "Merchants can update their own orders"
on public.orders for update to authenticated
using ((select auth.uid()) = merchant_id)
with check ((select auth.uid()) = merchant_id);

drop policy if exists "Merchants can delete their own orders" on public.orders;
create policy "Merchants can delete their own orders"
on public.orders for delete to authenticated
using ((select auth.uid()) = merchant_id);

drop policy if exists "Merchants can read items from their own orders" on public.order_items;
create policy "Merchants can read items from their own orders"
on public.order_items for select to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.merchant_id = (select auth.uid())
  )
);

drop policy if exists "Merchants can create items for their own orders" on public.order_items;
create policy "Merchants can create items for their own orders"
on public.order_items for insert to authenticated
with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.merchant_id = (select auth.uid())
  )
);

drop policy if exists "Merchants can update items from their own orders" on public.order_items;
create policy "Merchants can update items from their own orders"
on public.order_items for update to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.merchant_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.merchant_id = (select auth.uid())
  )
);

drop policy if exists "Merchants can delete items from their own orders" on public.order_items;
create policy "Merchants can delete items from their own orders"
on public.order_items for delete to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.merchant_id = (select auth.uid())
  )
);

create or replace function public.seed_orders_for_user(target_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.orders
    (merchant_id, order_number, customer_name, customer_email, total, status, created_at)
  values
    (target_user_id, 'SP-1001', 'Mia Chen', 'mia.chen@example.com', 154.98, 'paid', timezone('utc', now()) - interval '2 hours'),
    (target_user_id, 'SP-1002', 'Lucas Martin', 'lucas.martin@example.com', 79.99, 'packed', timezone('utc', now()) - interval '5 hours'),
    (target_user_id, 'SP-1003', 'Ava Nguyen', 'ava.nguyen@example.com', 249.97, 'pending', timezone('utc', now()) - interval '1 day')
  on conflict (merchant_id, order_number) do nothing;

  insert into public.order_items (order_id, product_title, quantity, unit_price)
  select orders.id, seed.product_title, seed.quantity, seed.unit_price
  from public.orders as orders
  join (
    values
      ('SP-1001', 'Classic Hoodie', 1, 64.99::numeric),
      ('SP-1001', 'Canvas Backpack', 1, 89.99::numeric),
      ('SP-1002', 'Classic Hoodie', 1, 79.99::numeric),
      ('SP-1003', 'Wireless Desk Lamp', 2, 54.50::numeric),
      ('SP-1003', 'Ceramic Travel Mug', 2, 70.485::numeric)
  ) as seed(order_number, product_title, quantity, unit_price)
    on seed.order_number = orders.order_number
  where orders.merchant_id = target_user_id
  on conflict (order_id, product_title) do nothing;
end;
$$;

create or replace function public.seed_orders_for_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform public.seed_orders_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed_orders on auth.users;
create trigger on_auth_user_created_seed_orders
after insert on auth.users
for each row execute procedure public.seed_orders_for_new_user();

do $$
declare
  existing_user record;
begin
  for existing_user in select id from auth.users loop
    perform public.seed_orders_for_user(existing_user.id);
  end loop;
end;
$$;
