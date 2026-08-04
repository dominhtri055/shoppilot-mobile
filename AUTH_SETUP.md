# ShopPilot Supabase Auth Setup

## 1. Create a Supabase project

Create a project in Supabase and wait for provisioning to finish.

## 2. Configure email authentication

In **Authentication > Providers**, keep Email enabled. Choose whether users must confirm their email before signing in.

## 3. Add local environment variables

Copy `.env.example` to `.env` and replace the placeholders:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use only the publishable client key. Never put a `service_role` key in the mobile app.

## 4. Create the profiles table

Open the Supabase SQL Editor and run:

```txt
supabase/migrations/001_create_profiles.sql
```

This migration creates merchant profiles automatically when Auth users register, enables Row Level Security, and allows authenticated users to read and update only their own profile.

## 5. Test the complete flow

1. Start the Expo app.
2. Open **Create an account**.
3. Register with a new email and password.
4. Confirm the email when confirmation is enabled.
5. Sign in.
6. Close and reopen the app; the session should persist.
7. Open dashboard, products, orders, and insights.
8. Sign out; protected routes should become unavailable.

## Current scope

Authentication and merchant profiles use Supabase. Product, order, dashboard, and insight data intentionally remain in the existing typed mock API layer.
