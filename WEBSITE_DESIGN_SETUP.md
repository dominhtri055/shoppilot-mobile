# Website designer

Merchants can now open **Dashboard → Design website** (or **Storefront → Design website**) using their existing authenticated session. The `/design` route is protected by the same router guard as products and orders.

## Capabilities

- Studio, Editorial and Electric starting styles.
- Brand/background colors, typography and card corners.
- Announcement, hero heading/body, HTTPS banner image and story text.
- Split/centered hero, product columns, section order and visibility.
- Desktop/mobile layout preview with the merchant's active, in-stock products, including before the store is public.
- Separate Save draft and Publish design actions, reset/restore controls and an unsaved-changes warning.
- Store name and logo are edited in the existing Store settings screen.

The native/web dashboard preview is a layout preview. The Next.js `/customize` editor provides the storefront's exact web rendering. Both editors read and write the same `storefront_themes` records and schema. Banner images currently use HTTPS URLs; file uploads remain in the existing product/logo settings.

## Release both applications

1. Apply **only** `supabase/migrations/009_storefront_customization.sql` to the existing shared Supabase project, after foundation migrations 001–007. It adds the owner-protected `storefront_themes` table and `get_public_store_theme` RPC without changing store or product records. If the earlier storefront migration 008 was already applied, 009 can be applied safely to the same table. **Do not run `008_clear_demo_data.sql` for this feature**; it is unrelated data cleanup.
2. Deploy the matching `shoppilot-storefront` branch containing `StoreView`, `StoreSurface`, `theme-api.ts` and `/customize`. Public store routes then read the published design. The pre-migration storefront falls back to its default design when the theme RPC is unavailable.
3. Deploy this merchant app. No new environment variables or service-role keys are needed. Both apps must point to the same Supabase project using their existing public configuration.
4. Sign in with a merchant account, open **Design website**, edit a heading and save a draft. Reopen the editor and confirm persistence. The public website must still show its previous design.
5. Publish the design and refresh `/shop/<store-slug>`. A store must also be enabled in **Storefront publishing** before customers can see it. Publishing a design does not make a private store public.

## Data and access

The draft and published designs are JSON objects stored per authenticated merchant ID. Row-level security enforces ownership regardless of the ID passed by a client. Anonymous clients can only call an RPC that returns the published design of a published store. Drafts are never returned by that RPC.

`src/types/storeTheme.ts` has the same JSON contract as `shoppilot-storefront/src/lib/store-theme.ts`. Keep these files synchronized when adding theme fields. The SQL file is mirrored in both repositories for setup; apply it once to the shared database.

The dashboard renews the existing session before loading/saving and preserves edited fields after a failed save. It never sends access tokens in URLs and does not use another merchant's public slug as authorization.

## Validation

```sh
npx tsc --noEmit
npx expo export --platform web
```

The companion storefront contains theme-validation and isolated PostgreSQL RLS tests under `tests/`. Live Supabase sign-in, migration application and visual browser checks still need validation in the deployment environment. Repository-wide lint currently reports pre-existing React Compiler/hook errors outside the new designer files.
