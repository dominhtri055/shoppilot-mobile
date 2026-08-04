import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type Provider, type Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import type { AuthSession } from "./supabaseAuth";

const SESSION_STORAGE_KEY = "@shoppilot/auth-session";

export type SocialProvider = "google" | "facebook" | "linkedin_oidc";

let oauthClient: ReturnType<typeof createClient> | null = null;

function getOAuthClient() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Add the project URL and publishable key to .env."
    );
  }

  if (!oauthClient) {
    oauthClient = createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return oauthClient;
}

function decode(value: string) {
  return decodeURIComponent(value.replace(/\+/g, " "));
}

function parseParameterString(value: string) {
  const params: Record<string, string> = {};

  value
    .replace(/^[?#]/, "")
    .split("&")
    .filter(Boolean)
    .forEach((entry) => {
      const separatorIndex = entry.indexOf("=");
      const rawKey = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry;
      const rawValue = separatorIndex >= 0 ? entry.slice(separatorIndex + 1) : "";
      params[decode(rawKey)] = decode(rawValue);
    });

  return params;
}

function parseOAuthResult(url: string) {
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");
  const query =
    queryIndex >= 0
      ? url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
      : "";
  const hash = hashIndex >= 0 ? url.slice(hashIndex + 1) : "";

  return {
    ...parseParameterString(query),
    ...parseParameterString(hash),
  };
}

function toAuthSession(session: Session): AuthSession {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at:
      session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
    token_type: session.token_type,
    user: session.user,
  };
}

async function persistSocialSession(session: Session) {
  const authSession = toAuthSession(session);
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authSession));
  return authSession;
}

export function getSocialRedirectUrl() {
  return Linking.createURL("auth/callback");
}

export async function completeSocialSignIn(url: string) {
  const params = parseOAuthResult(url);

  if (params.error || params.error_code) {
    throw new Error(
      params.error_description || params.error || "Social sign-in failed."
    );
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken || !refreshToken) {
    throw new Error("The social provider did not return a valid session.");
  }

  const client = getOAuthClient();
  const { data, error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error("Supabase did not create a social login session.");
  }

  return persistSocialSession(data.session);
}

export async function signInWithSocialProvider(provider: SocialProvider) {
  const client = getOAuthClient();
  const redirectTo = getSocialRedirectUrl();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("Supabase did not return an OAuth URL.");
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.assign(data.url);
    return null;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    return null;
  }

  return completeSocialSignIn(result.url);
}
