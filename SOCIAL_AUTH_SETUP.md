# Social Authentication Setup

ShopPilot now supports these Supabase OAuth providers:

- Google
- Facebook
- LinkedIn OpenID Connect (`linkedin_oidc`)

The application code is complete, but each provider must be enabled in its own developer dashboard and in Supabase. Provider client secrets must stay in Supabase and must never be committed to this repository.

## 1. Run the profile metadata migration

Open the Supabase SQL Editor and run:

```txt
supabase/migrations/003_social_profile_metadata.sql
```

This lets the existing `profiles` trigger accept names returned as `full_name`, `name`, or `given_name` by different providers.

## 2. Add application redirect URLs in Supabase

Open:

```txt
Supabase Dashboard -> Authentication -> URL Configuration
```

Add these redirect URLs for local development:

```txt
http://localhost:8081/auth/callback
shoppilotmobile://auth/callback
```

You may also use these development wildcards:

```txt
http://localhost:8081/**
shoppilotmobile://**
```

Add the deployed web callback URL when the web application is hosted:

```txt
https://YOUR_DOMAIN/auth/callback
```

The custom mobile scheme is already configured in `app.json` as:

```txt
shoppilotmobile
```

After changing a custom scheme, create a new development/native build. Expo Go does not provide a stable production-style redirect URL for OAuth.

## 3. Provider callback URL

Google, Meta, and LinkedIn must redirect to Supabase first. Use this callback in each provider dashboard:

```txt
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Replace `YOUR_PROJECT_REF` with the identifier from your Supabase project URL.

## 4. Google

1. Open Google Cloud Console.
2. Configure the OAuth consent screen.
3. Create an OAuth Client ID with application type `Web application`.
4. Add the Supabase callback URL as an Authorized redirect URI.
5. Copy the Google Client ID and Client Secret.
6. Open `Supabase -> Authentication -> Providers -> Google`.
7. Enable Google and paste the Client ID and Client Secret.

## 5. Facebook

1. Open Meta for Developers and create an app.
2. Add the Facebook Login product.
3. Add the Supabase callback URL under Valid OAuth Redirect URIs.
4. Ensure the app can request `email` and `public_profile`.
5. Copy the Facebook App ID and App Secret.
6. Open `Supabase -> Authentication -> Providers -> Facebook`.
7. Enable Facebook and paste the App ID and App Secret.

While the Meta app is in Development mode, only its administrators, developers, and testers can sign in.

## 6. LinkedIn

1. Open the LinkedIn Developer Portal and create an app.
2. Request the `Sign In with LinkedIn using OpenID Connect` product.
3. Add the Supabase callback URL as an Authorized redirect URL.
4. Copy the LinkedIn Client ID and Client Secret.
5. Open `Supabase -> Authentication -> Providers -> LinkedIn (OIDC)`.
6. Enable the provider and paste the credentials.

The application uses the current Supabase provider name:

```txt
linkedin_oidc
```

## 7. Test

Pull the branch and restart Expo:

```bash
git checkout agent/add-social-auth
git pull origin agent/add-social-auth
npx expo start --clear
```

Test web first at `http://localhost:8081`:

1. Click Google, Facebook, or LinkedIn.
2. Complete the provider login.
3. Confirm the browser returns to `/auth/callback` and then Dashboard.
4. Confirm the session remains after refreshing or reopening the app.
5. Confirm the social account receives its own products through RLS.
6. Sign out and confirm protected routes are no longer accessible.

For Android or iOS, create a development build after the provider and custom-scheme configuration is complete.
