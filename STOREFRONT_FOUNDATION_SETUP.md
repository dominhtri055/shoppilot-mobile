# ShopPilot Storefront Foundation

This phase prepares the merchant dashboard and Supabase backend for a separate customer-facing Next.js storefront.

## What this migration adds

- `profiles.store_slug`
- `profiles.is_store_published`
- automatic unique slug generation for existing and new merchants
- merchant storefront publishing screen in the dashboard
- public read-only RPCs for published stores and in-stock active products

## Required setup

Run this migration in the Supabase SQL Editor:

```text
supabase/migrations/007_add_storefront_foundation.sql
```

Then check out the dashboard branch and validate it:

```bash
git fetch origin
git checkout agent/add-storefront-foundation-v2
git pull origin agent/add-storefront-foundation-v2
npx tsc --noEmit
npx expo start --clear
```

## Dashboard test

1. Open Dashboard.
2. Select **Storefront · Draft**.
3. Confirm a default unique slug is present.
4. Change the slug to another valid value.
5. Set the store to **Published**.
6. Save.
7. Return to Dashboard and confirm the action reads **Storefront · Live**.
8. Unpublish and confirm the action returns to **Storefront · Draft**.

Valid slugs:

```text
tri-store
shop123
moncton-apparel
```

Invalid slugs:

```text
Tri Store
-tri-store
tri--store
tri_store
```

## Public RPC tests

Replace `tri-store` with the slug saved in the dashboard.

```sql
select * from public.get_public_store('tri-store');
select * from public.get_public_products('tri-store');
```

For one visible product:

```sql
select *
from public.get_public_product(
  'tri-store',
  'PRODUCT_UUID_HERE'::uuid
);
```

Expected behavior:

- published store: profile RPC returns one row
- unpublished store: all storefront RPCs return zero rows
- active product with inventory above zero: included
- draft, archived, or out-of-stock product: excluded
- anonymous users do not receive direct table access

## Storefront project

The separate website should use this repository name:

```text
shoppilot-storefront
```

Recommended bootstrap command:

```bash
npx create-next-app@latest shoppilot-storefront \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --use-npm \
  --import-alias "@/*"
```

Use the same Supabase project values as the dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_DEFAULT_STORE_SLUG=your-store-slug
```

The storefront must use the public RPCs rather than selecting from `profiles` or `products` directly.

## Security boundary

The public RPCs only expose:

- published store identity and branding
- active products
- products with inventory above zero
- fields required by the customer website

Order creation is intentionally not included in this phase. Checkout will be implemented with a transactional server-side function so customers cannot modify prices, totals, or inventory updates in the browser.
