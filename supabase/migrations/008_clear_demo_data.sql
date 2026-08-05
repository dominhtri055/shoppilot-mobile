begin;

-- Stop creating demo products and orders for new accounts.
drop trigger if exists
  on_auth_user_created_seed_products
  on auth.users;

drop trigger if exists
  on_auth_user_created_seed_orders
  on auth.users;

-- Remove demo commerce and analytics data while preserving schema.
truncate table
  public.order_items,
  public.analytics_events,
  public.orders,
  public.products
restart identity;

commit;