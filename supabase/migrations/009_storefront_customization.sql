-- Apply after ShopPilot Mobile migrations 001–007 in the shared Supabase project.
-- Migration 008_clear_demo_data is NOT required for this feature.
begin;
create table if not exists public.storefront_themes (
  merchant_id uuid primary key references public.profiles(id) on delete cascade,
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object' and octet_length(draft::text) <= 20000),
  published jsonb check (published is null or (jsonb_typeof(published) = 'object' and octet_length(published::text) <= 20000)),
  updated_at timestamptz not null default now()
);
alter table public.storefront_themes enable row level security;
revoke all on public.storefront_themes from anon;
grant select, insert, update on public.storefront_themes to authenticated;
drop policy if exists "Owner reads appearance" on public.storefront_themes;
drop policy if exists "Owner creates appearance" on public.storefront_themes;
drop policy if exists "Owner updates appearance" on public.storefront_themes;
create policy "Owner reads appearance" on public.storefront_themes for select to authenticated using (merchant_id = (select auth.uid()));
create policy "Owner creates appearance" on public.storefront_themes for insert to authenticated with check (merchant_id = (select auth.uid()));
create policy "Owner updates appearance" on public.storefront_themes for update to authenticated using (merchant_id = (select auth.uid())) with check (merchant_id = (select auth.uid()));
create or replace function public.get_public_store_theme(p_store_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(t.published, '{}'::jsonb) from public.profiles p
  left join public.storefront_themes t on t.merchant_id = p.id
  where p.store_slug = lower(trim(p_store_slug)) and p.is_store_published = true limit 1;
$$;
revoke all on function public.get_public_store_theme(text) from public;
grant execute on function public.get_public_store_theme(text) to anon, authenticated;
commit;
