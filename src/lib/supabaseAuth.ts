import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_STORAGE_KEY = "@shoppilot/auth-session";
const SESSION_EXPIRY_BUFFER_SECONDS = 60;

type JsonRecord = Record<string, unknown>;

export type AuthUser = {
  id: string;
  email?: string;
  created_at?: string;
  app_metadata?: JsonRecord;
  user_metadata?: JsonRecord;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: AuthUser;
};

type SessionPayload = Partial<AuthSession> & {
  user?: AuthUser;
};

type SignUpPayload = SessionPayload & Partial<AuthUser>;

export type SignUpResult = {
  user: AuthUser | null;
  session: AuthSession | null;
};

export class AuthApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

function getConfig() {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !publishableKey) {
    throw new AuthApiError(
      "Supabase is not configured. Copy .env.example to .env and add your project URL and publishable key."
    );
  }

  return {
    authUrl: `${baseUrl}/auth/v1`,
    publishableKey,
  };
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const error = payload as Record<string, unknown>;
  const candidates = [
    error.message,
    error.msg,
    error.error_description,
    error.error,
  ];

  return (
    candidates.find((value): value is string => typeof value === "string") ??
    fallback
  );
}

async function authRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const { authUrl, publishableKey } = getConfig();
  const response = await fetch(`${authUrl}${path}`, {
    ...options,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken ?? publishableKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const rawBody = await response.text();
  let payload: unknown = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as unknown;
    } catch {
      payload = { message: rawBody };
    }
  }

  if (!response.ok) {
    throw new AuthApiError(
      getErrorMessage(payload, "Authentication request failed."),
      response.status
    );
  }

  return payload as T;
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AuthUser).id === "string"
  );
}

function toSession(payload: SessionPayload): AuthSession | null {
  if (
    typeof payload.access_token !== "string" ||
    typeof payload.refresh_token !== "string" ||
    typeof payload.expires_in !== "number" ||
    !isAuthUser(payload.user)
  ) {
    return null;
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in,
    expires_at:
      typeof payload.expires_at === "number"
        ? payload.expires_at
        : Math.floor(Date.now() / 1000) + payload.expires_in,
    token_type:
      typeof payload.token_type === "string" ? payload.token_type : "bearer",
    user: payload.user,
  };
}

function isStoredSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<AuthSession>;

  return (
    typeof session.access_token === "string" &&
    typeof session.refresh_token === "string" &&
    typeof session.expires_in === "number" &&
    typeof session.expires_at === "number" &&
    typeof session.token_type === "string" &&
    isAuthUser(session.user)
  );
}

async function persistSession(session: AuthSession) {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function clearStoredSession() {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthSession> {
  const payload = await authRequest<SessionPayload>(
    "/token?grant_type=password",
    {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    }
  );

  const session = toSession(payload);

  if (!session) {
    throw new AuthApiError("Supabase returned an invalid login session.");
  }

  await persistSession(session);
  return session;
}

export async function signUpWithPassword(
  fullName: string,
  email: string,
  password: string
): Promise<SignUpResult> {
  const payload = await authRequest<SignUpPayload>("/signup", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      data: {
        full_name: fullName.trim(),
      },
    }),
  });

  const session = toSession(payload);
  const user = isAuthUser(payload.user)
    ? payload.user
    : isAuthUser(payload)
      ? payload
      : null;

  if (session) {
    await persistSession(session);
  }

  return { user, session };
}

export async function refreshSession(
  refreshToken: string
): Promise<AuthSession> {
  const payload = await authRequest<SessionPayload>(
    "/token?grant_type=refresh_token",
    {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );

  const session = toSession(payload);

  if (!session) {
    throw new AuthApiError("Supabase returned an invalid refreshed session.");
  }

  await persistSession(session);
  return session;
}

export async function restoreSession(): Promise<AuthSession | null> {
  const storedValue = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as unknown;

    if (!isStoredSession(parsed)) {
      await clearStoredSession();
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (parsed.expires_at > now + SESSION_EXPIRY_BUFFER_SECONDS) {
      return parsed;
    }

    return await refreshSession(parsed.refresh_token);
  } catch {
    await clearStoredSession();
    return null;
  }
}

export async function signOutSession(accessToken?: string) {
  if (accessToken) {
    try {
      await authRequest<null>(
        "/logout",
        {
          method: "POST",
        },
        accessToken
      );
    } catch {
      // Local logout still succeeds if the network request cannot revoke the token.
    }
  }

  await clearStoredSession();
}

export async function requestPasswordReset(
  email: string,
  redirectTo: string
): Promise<void> {
  await authRequest<Record<string, never>>(
    `/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    }
  );
}

export async function updatePasswordWithRecoveryToken(
  accessToken: string,
  newPassword: string
): Promise<AuthUser> {
  return authRequest<AuthUser>(
    "/user",
    {
      method: "PUT",
      body: JSON.stringify({
        password: newPassword,
      }),
    },
    accessToken
  );
}