# ShopPilot Screenshot Capture Guide

Use this checklist when refreshing the screenshots displayed in the repository README.

## Recommended capture environment

- Run the Expo web build at a desktop width between 1280 and 1440 pixels.
- Use browser zoom at 100%.
- Keep the browser DevTools closed.
- Use the same merchant account and store branding in every image.
- Use realistic portfolio-safe products and customer names.
- Do not expose Supabase keys, access tokens, personal email addresses, or browser bookmarks.
- Capture PNG files.
- Crop browser chrome unless it adds useful responsive context.

## Required files

Replace the files below without changing their names. The README will update automatically.

### `login.png`

Show:

- ShopPilot branding
- Email and password fields
- Forgot-password link
- Sign-in and create-account actions

Do not show:

- Social-login placeholders
- Validation errors
- Real personal credentials

### `dashboard.png`

Show:

- Store name and logo
- Revenue today
- Open orders
- Low-stock products
- Seven-day conversion rate
- Recent orders or inventory alerts

### `products.png`

Show:

- Search and filters
- A mix of active and draft products
- Product images
- Prices using the selected store currency
- At least one low-stock item

### `product-detail.png`

Show:

- Product image
- Product title, vendor, price, tags, and inventory
- Publishing status
- Edit-product action

### `orders.png`

Show:

- Multiple orders
- Different fulfillment statuses
- Customer names
- Currency-formatted totals
- Status filters

### `order-detail.png`

Show:

- Customer details
- Order line items
- Total
- Current status
- Fulfillment action

Avoid highlighting the destructive refund action unless the confirmation dialog is part of the screenshot story.

### `insights.png`

Show:

- Weekly revenue
- Traffic and conversion funnel
- Daily sessions
- Top products
- Store health or inventory risks

## Optional additional images

These are useful for a portfolio case study even though the main README does not require them yet:

- `store-settings.png`
- `add-product.png`
- `edit-product.png`
- `forgot-password.png`

## Final review

Before committing screenshots:

1. Confirm text is readable at GitHub README width.
2. Confirm every image reflects the current UI.
3. Confirm no credentials or private customer information are visible.
4. Confirm the filenames exactly match the README paths.
5. Preview `README.md` on GitHub before merging.
