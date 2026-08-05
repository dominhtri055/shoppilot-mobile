# ShopPilot Analytics Setup

ShopPilot analytics records storefront traffic in Supabase and aggregates the report on the database server.

## 1. Run the migration

Open the Supabase SQL Editor and run:

```text
supabase/migrations/006_create_analytics.sql
```

The migration creates:

- `public.analytics_events`
- `public.record_store_event(...)`
- `public.get_merchant_analytics(...)`
- merchant-only read access through RLS
- validated public event recording through the RPC
- sample seven-day analytics for existing merchant accounts

The migration is safe to run more than once. Sample events are only inserted for merchants who have no analytics events.

## 2. Verify the app

```bash
npx tsc --noEmit
npx expo start --clear
```

Open the Dashboard and confirm that Conversion is no longer hard-coded.

Open Insights and verify:

- weekly revenue
- traffic and conversion funnel
- daily sessions
- product views
- add-to-cart events
- checkout starts and completions
- top products
- inventory risks

## 3. Storefront tracking

Use the helper in `src/lib/storeAnalytics.ts` from the future customer storefront.

Create one session ID when a shopper enters the store and reuse it during that visit:

```ts
import {
  createAnalyticsSessionId,
  trackStoreEvent,
} from "./src/lib/storeAnalytics";

const analyticsSessionId = createAnalyticsSessionId();

await trackStoreEvent({
  merchantId,
  sessionId: analyticsSessionId,
  eventType: "session_started",
  metadata: {
    source: "storefront",
  },
});
```

Record product and checkout steps with the same session ID:

```ts
await trackStoreEvent({
  merchantId,
  sessionId: analyticsSessionId,
  eventType: "product_viewed",
  productId,
});

await trackStoreEvent({
  merchantId,
  sessionId: analyticsSessionId,
  eventType: "product_added_to_cart",
  productId,
});

await trackStoreEvent({
  merchantId,
  sessionId: analyticsSessionId,
  eventType: "checkout_started",
});

await trackStoreEvent({
  merchantId,
  sessionId: analyticsSessionId,
  eventType: "checkout_completed",
});
```

## Metric definitions

- **Sessions:** unique sessions with a `session_started` event
- **Product views:** total `product_viewed` events
- **Add to carts:** total `product_added_to_cart` events
- **Conversion rate:** unique completed-checkout sessions divided by store sessions
- **Session to cart:** unique add-to-cart sessions divided by store sessions
- **Checkout completion:** completed-checkout sessions divided by checkout-started sessions

## Production note

The public event RPC validates merchant IDs, product ownership, event types, session length, and metadata size. For a high-traffic public storefront, place event recording behind an Edge Function or API gateway with rate limiting and bot filtering.
