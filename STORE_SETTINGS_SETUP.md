# Store Settings Setup

## What this feature adds

- store name
- business email
- store description
- store logo upload and removal
- merchant-selected currency: CAD, USD, EUR, GBP, or AUD
- configurable low-stock threshold
- shared settings context used by Dashboard, Products, Orders, and Insights
- merchant-isolated profile updates and Storage policies

## Supabase setup

1. Open the Supabase SQL Editor.
2. Run `supabase/migrations/005_add_store_settings.sql`.
3. Confirm that the `profiles` table has these columns:
   - `store_name`
   - `business_email`
   - `store_description`
   - `currency`
   - `low_stock_threshold`
   - `logo_path`
4. Confirm that Storage contains a public bucket named `store-logos`.

## Local test steps

```bash
git fetch origin
git checkout agent/add-store-settings
git pull origin agent/add-store-settings
npx tsc --noEmit
npx expo start --clear
```

Then test:

1. Sign in and open Dashboard.
2. Open **Store settings**.
3. Change store name, business email, description, currency, and low-stock threshold.
4. Upload a JPG, PNG, or WebP logo smaller than 5 MB.
5. Save and confirm Dashboard updates immediately.
6. Confirm Products, Orders, Product Detail, Order Detail, and Insights use the selected currency.
7. Set the low-stock threshold to a different number and confirm Products, Dashboard, and Insights update their low-stock results.
8. Replace the store logo and confirm the old logo no longer appears.
9. Remove the store logo and confirm the Dashboard shows the store initial fallback.
10. Sign in with another merchant and confirm it has separate settings and cannot change the first merchant's logo or profile.

## Notes

- Conversion rate remains demo data because ShopPilot does not yet track storefront sessions or visitors.
- Store logos use merchant-ID folders in Supabase Storage.
- The bucket is public for display, while upload and delete operations still require authenticated RLS policies.
