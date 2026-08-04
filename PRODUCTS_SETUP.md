# Supabase Products Setup

The Products module now reads and writes merchant-owned data through Supabase.

## 1. Run the migration

Open your Supabase project and go to:

```txt
SQL Editor -> New query
```

Copy and run:

```txt
supabase/migrations/002_create_products.sql
```

The migration creates:

- `public.products`
- merchant ownership through `merchant_id`
- Row Level Security policies for select, insert, update, and delete
- an `updated_at` trigger
- starter products for existing users
- starter products for newly registered users

## 2. Confirm environment variables

Your local `.env` must contain:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Restart Expo after changing `.env`:

```bash
npx expo start --clear
```

## 3. Test the product flow

1. Sign in.
2. Open Products.
3. Confirm the starter products load.
4. Pull to refresh.
5. Create a product.
6. Open its detail page.
7. Increase and decrease inventory.
8. Toggle active/draft status.
9. Delete the product by pressing the delete button twice.
10. Confirm another merchant account cannot access the first merchant's products.

Orders, revenue, and conversion metrics remain on the mock service layer for the next implementation phase.
