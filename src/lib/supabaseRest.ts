type ErrorPayload = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

export class SupabaseRestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = "SupabaseRestError";
    this.status = status;
    this.code = code;
  }
}

function getConfig() {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !publishableKey) {
    throw new SupabaseRestError(
      "Supabase is not configured. Add the project URL and publishable key to .env."
    );
  }

  return {
    restUrl: `${baseUrl}/rest/v1`,
    publishableKey,
  };
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const error = payload as ErrorPayload;
  return error.message ?? error.details ?? error.hint ?? fallback;
}

export async function supabaseRestRequest<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const { restUrl, publishableKey } = getConfig();
  const response = await fetch(`${restUrl}${path}`, {
    ...options,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
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
    const errorPayload = payload as ErrorPayload | null;
    throw new SupabaseRestError(
      getErrorMessage(payload, "Database request failed."),
      response.status,
      errorPayload?.code
    );
  }

  return payload as T;
}
