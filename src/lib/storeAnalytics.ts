import {
  AnalyticsEventType,
  TrackStoreEventInput,
} from "../types/analytics";

function getConfig() {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !publishableKey) {
    throw new Error(
      "Supabase analytics is not configured. Add the project URL and publishable key to .env.",
    );
  }

  return {
    rpcUrl: `${baseUrl}/rest/v1/rpc/record_store_event`,
    publishableKey,
  };
}

async function getErrorMessage(response: Response): Promise<string> {
  const fallback = "The analytics event could not be recorded.";

  try {
    const payload = (await response.json()) as {
      message?: string;
      details?: string;
      hint?: string;
    };

    return payload.message ?? payload.details ?? payload.hint ?? fallback;
  } catch {
    return fallback;
  }
}

export function createAnalyticsSessionId(): string {
  return [
    "session",
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 12),
  ].join("-");
}

export async function trackStoreEvent({
  merchantId,
  sessionId,
  eventType,
  productId = null,
  metadata = {},
}: TrackStoreEventInput): Promise<string> {
  const { rpcUrl, publishableKey } = getConfig();

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_merchant_id: merchantId,
      p_session_id: sessionId,
      p_event_type: eventType,
      p_product_id: productId,
      p_metadata: metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const eventId = (await response.json()) as unknown;

  if (typeof eventId !== "string" || !eventId) {
    throw new Error("The analytics event was recorded without an event ID.");
  }

  return eventId;
}

export type { AnalyticsEventType };
