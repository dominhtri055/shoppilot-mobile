create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null
    check (char_length(trim(session_id)) between 1 and 128),
  event_type text not null
    check (
      event_type in (
        'session_started',
        'product_viewed',
        'product_added_to_cart',
        'checkout_started',
        'checkout_completed'
      )
    ),
  product_id uuid references public.products(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analytics_events_merchant_occurred_at_idx
  on public.analytics_events (merchant_id, occurred_at desc);

create index if not exists analytics_events_merchant_event_type_idx
  on public.analytics_events (merchant_id, event_type, occurred_at desc);

create index if not exists analytics_events_merchant_session_idx
  on public.analytics_events (merchant_id, session_id);

create index if not exists analytics_events_product_idx
  on public.analytics_events (product_id, occurred_at desc)
  where product_id is not null;

alter table public.analytics_events enable row level security;

drop policy if exists "Merchants can read their own analytics" on public.analytics_events;
create policy "Merchants can read their own analytics"
on public.analytics_events
for select
to authenticated
using ((select auth.uid()) = merchant_id);

create or replace function public.record_store_event(
  p_merchant_id uuid,
  p_session_id text,
  p_event_type text,
  p_product_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_event_id uuid;
begin
  if p_merchant_id is null
    or not exists (
      select 1
      from auth.users
      where id = p_merchant_id
    ) then
    raise exception 'Merchant not found.';
  end if;

  if p_session_id is null
    or char_length(trim(p_session_id)) not between 1 and 128 then
    raise exception 'A valid analytics session ID is required.';
  end if;

  if p_event_type not in (
    'session_started',
    'product_viewed',
    'product_added_to_cart',
    'checkout_started',
    'checkout_completed'
  ) then
    raise exception 'Unsupported analytics event type.';
  end if;

  if p_product_id is not null
    and not exists (
      select 1
      from public.products
      where id = p_product_id
        and merchant_id = p_merchant_id
    ) then
    raise exception 'Product does not belong to this merchant.';
  end if;

  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'Analytics metadata must be a JSON object.';
  end if;

  if octet_length(p_metadata::text) > 4096 then
    raise exception 'Analytics metadata is too large.';
  end if;

  insert into public.analytics_events (
    merchant_id,
    session_id,
    event_type,
    product_id,
    metadata
  )
  values (
    p_merchant_id,
    trim(p_session_id),
    p_event_type,
    p_product_id,
    p_metadata
  )
  returning id into created_event_id;

  return created_event_id;
end;
$$;

revoke all on function public.record_store_event(
  uuid,
  text,
  text,
  uuid,
  jsonb
) from public;

grant execute on function public.record_store_event(
  uuid,
  text,
  text,
  uuid,
  jsonb
) to anon, authenticated;

create or replace function public.get_merchant_analytics(
  p_days integer default 7
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      greatest(1, least(coalesce(p_days, 7), 90))::integer as days,
      date_trunc('day', timezone('utc', now())) as today_start
  ),
  filtered as (
    select events.*
    from public.analytics_events as events
    cross join params
    where events.merchant_id = (select auth.uid())
      and events.occurred_at >=
        params.today_start - make_interval(days => params.days - 1)
      and events.occurred_at < params.today_start + interval '1 day'
  ),
  summary as (
    select
      count(distinct session_id)
        filter (where event_type = 'session_started') as sessions,
      count(*)
        filter (where event_type = 'product_viewed') as product_views,
      count(*)
        filter (where event_type = 'product_added_to_cart') as add_to_carts,
      count(distinct session_id)
        filter (where event_type = 'product_added_to_cart') as add_to_cart_sessions,
      count(distinct session_id)
        filter (where event_type = 'checkout_started') as checkout_started,
      count(distinct session_id)
        filter (where event_type = 'checkout_completed') as checkout_completed
    from filtered
  ),
  daily as (
    select
      day_series.day_start,
      count(distinct filtered.session_id)
        filter (where filtered.event_type = 'session_started') as sessions,
      count(filtered.id)
        filter (where filtered.event_type = 'product_viewed') as views
    from params
    cross join lateral generate_series(
      params.today_start - make_interval(days => params.days - 1),
      params.today_start,
      interval '1 day'
    ) as day_series(day_start)
    left join filtered
      on filtered.occurred_at >= day_series.day_start
      and filtered.occurred_at < day_series.day_start + interval '1 day'
    group by day_series.day_start
  ),
  product_totals as (
    select
      filtered.product_id,
      coalesce(products.title, 'Deleted product') as product_title,
      count(filtered.id)
        filter (where filtered.event_type = 'product_viewed') as views,
      count(filtered.id)
        filter (where filtered.event_type = 'product_added_to_cart') as add_to_carts
    from filtered
    left join public.products as products
      on products.id = filtered.product_id
    where filtered.product_id is not null
    group by filtered.product_id, products.title
    having count(filtered.id)
      filter (
        where filtered.event_type in (
          'product_viewed',
          'product_added_to_cart'
        )
      ) > 0
    order by
      count(filtered.id)
        filter (where filtered.event_type = 'product_viewed') desc,
      count(filtered.id)
        filter (where filtered.event_type = 'product_added_to_cart') desc
    limit 5
  )
  select jsonb_build_object(
    'days', params.days,
    'summary', jsonb_build_object(
      'sessions', summary.sessions,
      'productViews', summary.product_views,
      'addToCarts', summary.add_to_carts,
      'checkoutStarted', summary.checkout_started,
      'checkoutCompleted', summary.checkout_completed,
      'conversionRate',
        case
          when summary.sessions = 0 then 0
          else round(
            summary.checkout_completed::numeric
              * 100
              / summary.sessions::numeric,
            1
          )
        end,
      'addToCartRate',
        case
          when summary.sessions = 0 then 0
          else round(
            summary.add_to_cart_sessions::numeric
              * 100
              / summary.sessions::numeric,
            1
          )
        end,
      'checkoutCompletionRate',
        case
          when summary.checkout_started = 0 then 0
          else round(
            summary.checkout_completed::numeric
              * 100
              / summary.checkout_started::numeric,
            1
          )
        end
    ),
    'dailyTraffic', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'date', to_char(daily.day_start, 'YYYY-MM-DD'),
            'sessions', daily.sessions,
            'views', daily.views
          )
          order by daily.day_start
        ),
        '[]'::jsonb
      )
      from daily
    ),
    'topProducts', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'productId', product_totals.product_id,
            'productTitle', product_totals.product_title,
            'views', product_totals.views,
            'addToCarts', product_totals.add_to_carts
          )
          order by product_totals.views desc, product_totals.add_to_carts desc
        ),
        '[]'::jsonb
      )
      from product_totals
    )
  )
  from params
  cross join summary;
$$;

revoke all on function public.get_merchant_analytics(integer) from public;
grant execute on function public.get_merchant_analytics(integer) to authenticated;

do $$
declare
  merchant record;
  first_product_id uuid;
  second_product_id uuid;
  session_prefix text;
begin
  for merchant in
    select id
    from auth.users
  loop
    if not exists (
      select 1
      from public.analytics_events
      where merchant_id = merchant.id
    ) then
      select id
      into first_product_id
      from public.products
      where merchant_id = merchant.id
      order by created_at
      limit 1;

      select id
      into second_product_id
      from public.products
      where merchant_id = merchant.id
      order by created_at
      offset 1
      limit 1;

      session_prefix :=
        'seed-' || replace(merchant.id::text, '-', '');

      insert into public.analytics_events (
        merchant_id,
        session_id,
        event_type,
        product_id,
        metadata,
        occurred_at
      )
      values
        (merchant.id, session_prefix || '-01', 'session_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '6 days'),
        (merchant.id, session_prefix || '-01', 'product_viewed', first_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '6 days' + interval '2 minutes'),
        (merchant.id, session_prefix || '-01', 'product_added_to_cart', first_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '6 days' + interval '5 minutes'),
        (merchant.id, session_prefix || '-01', 'checkout_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '6 days' + interval '8 minutes'),
        (merchant.id, session_prefix || '-01', 'checkout_completed', null, jsonb_build_object('source', 'migration_seed'), now() - interval '6 days' + interval '11 minutes'),

        (merchant.id, session_prefix || '-02', 'session_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '5 days'),
        (merchant.id, session_prefix || '-02', 'product_viewed', second_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '5 days' + interval '3 minutes'),
        (merchant.id, session_prefix || '-02', 'product_added_to_cart', second_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '5 days' + interval '7 minutes'),

        (merchant.id, session_prefix || '-03', 'session_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '4 days'),
        (merchant.id, session_prefix || '-03', 'product_viewed', first_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '4 days' + interval '4 minutes'),

        (merchant.id, session_prefix || '-04', 'session_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '3 days'),
        (merchant.id, session_prefix || '-04', 'product_viewed', second_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '3 days' + interval '2 minutes'),
        (merchant.id, session_prefix || '-04', 'product_added_to_cart', second_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '3 days' + interval '5 minutes'),
        (merchant.id, session_prefix || '-04', 'checkout_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '3 days' + interval '9 minutes'),
        (merchant.id, session_prefix || '-04', 'checkout_completed', null, jsonb_build_object('source', 'migration_seed'), now() - interval '3 days' + interval '12 minutes'),

        (merchant.id, session_prefix || '-05', 'session_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '2 days'),
        (merchant.id, session_prefix || '-05', 'product_viewed', first_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '2 days' + interval '6 minutes'),

        (merchant.id, session_prefix || '-06', 'session_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '1 day'),
        (merchant.id, session_prefix || '-06', 'product_viewed', first_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '1 day' + interval '2 minutes'),
        (merchant.id, session_prefix || '-06', 'product_added_to_cart', first_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '1 day' + interval '5 minutes'),
        (merchant.id, session_prefix || '-06', 'checkout_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '1 day' + interval '10 minutes'),

        (merchant.id, session_prefix || '-07', 'session_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '8 hours'),
        (merchant.id, session_prefix || '-07', 'product_viewed', second_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '8 hours' + interval '3 minutes'),

        (merchant.id, session_prefix || '-08', 'session_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '3 hours'),
        (merchant.id, session_prefix || '-08', 'product_viewed', first_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '3 hours' + interval '2 minutes'),
        (merchant.id, session_prefix || '-08', 'product_added_to_cart', first_product_id, jsonb_build_object('source', 'migration_seed'), now() - interval '3 hours' + interval '5 minutes'),
        (merchant.id, session_prefix || '-08', 'checkout_started', null, jsonb_build_object('source', 'migration_seed'), now() - interval '3 hours' + interval '8 minutes'),
        (merchant.id, session_prefix || '-08', 'checkout_completed', null, jsonb_build_object('source', 'migration_seed'), now() - interval '3 hours' + interval '12 minutes');
    end if;
  end loop;
end;
$$;
