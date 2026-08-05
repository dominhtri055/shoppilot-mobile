# Supabase Orders Setup

This branch replaces ShopPilot's mock orders with merchant-owned Supabase data.

## Included

- `orders` and `order_items` tables
- Row Level Security for merchant isolation
- starter orders and line items for existing and newly registered users
- Supabase REST order list and detail requests
- pull-to-refresh and order filters
- persisted fulfillment and refund status updates
- real Dashboard revenue, open-order count, and recent orders

Conversion rate remains mock data because the app does not have storefront traffic analytics yet.

## 1. Run the migration

Open the Supabase SQL Editor and run:

```txt
supabase/migrations/003_create_orders.sql
```

The migration is idempotent and seeds three sample orders for each existing account. It also installs a trigger that seeds orders for newly registered accounts.

## 2. Pull the branch

```bash
git fetch origin
git checkout agent/add-supabase-orders
git pull origin agent/add-supabase-orders
```

If you have uncommitted local authentication work, commit or stash it before switching branches.

## 3. Validate TypeScript

```bash
npx tsc --noEmit
```

## 4. Restart Expo

```bash
npx expo start --clear
```

Press `w` for the web build.

## 5. Test

1. Sign in with an existing merchant account.
2. Open Orders and confirm three starter orders appear.
3. Pull to refresh the list.
4. Filter by pending, paid, packed, shipped, delivered, and refunded.
5. Open an order and confirm its customer, total, and line items appear.
6. Move an order through the fulfillment workflow.
7. Return to the list and confirm the new status remains after refresh.
8. Press Refund Order once, then Confirm refund.
9. Return to Dashboard and confirm refunded orders are excluded from revenue and open-order totals.
10. Sign in with a different account and confirm it cannot see the first merchant's orders.

## Notes

- Revenue Today includes non-refunded orders created on the current local calendar day.
- Open Orders excludes delivered and refunded orders.
- Order creation is not exposed in the merchant UI yet; sample orders simulate orders arriving from a storefront.
