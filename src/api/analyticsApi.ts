import { supabaseRestRequest } from "../lib/supabaseRest";
import {
  AnalyticsReport,
  AnalyticsSummary,
  DailyTrafficPoint,
  EMPTY_ANALYTICS_REPORT,
  ProductAnalytics,
} from "../types/analytics";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeSummary(value: unknown): AnalyticsSummary {
  if (!isRecord(value)) {
    return EMPTY_ANALYTICS_REPORT.summary;
  }

  return {
    sessions: toNumber(value.sessions),
    productViews: toNumber(value.productViews),
    addToCarts: toNumber(value.addToCarts),
    checkoutStarted: toNumber(value.checkoutStarted),
    checkoutCompleted: toNumber(value.checkoutCompleted),
    conversionRate: toNumber(value.conversionRate),
    addToCartRate: toNumber(value.addToCartRate),
    checkoutCompletionRate: toNumber(value.checkoutCompletionRate),
  };
}

function normalizeDailyTraffic(value: unknown): DailyTrafficPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const date = toString(item.date);

    if (!date) {
      return [];
    }

    return [
      {
        date,
        sessions: toNumber(item.sessions),
        views: toNumber(item.views),
      },
    ];
  });
}

function normalizeTopProducts(value: unknown): ProductAnalytics[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const productId = toString(item.productId);

    if (!productId) {
      return [];
    }

    return [
      {
        productId,
        productTitle: toString(item.productTitle) || "Unknown product",
        views: toNumber(item.views),
        addToCarts: toNumber(item.addToCarts),
      },
    ];
  });
}

function normalizeReport(value: unknown): AnalyticsReport {
  if (!isRecord(value)) {
    return EMPTY_ANALYTICS_REPORT;
  }

  return {
    days: Math.max(1, toNumber(value.days) || 7),
    summary: normalizeSummary(value.summary),
    dailyTraffic: normalizeDailyTraffic(value.dailyTraffic),
    topProducts: normalizeTopProducts(value.topProducts),
  };
}

export async function getAnalyticsReport(
  accessToken: string,
  days = 7,
): Promise<AnalyticsReport> {
  const normalizedDays = Math.max(1, Math.min(Math.trunc(days), 90));

  const response = await supabaseRestRequest<unknown>(
    "/rpc/get_merchant_analytics",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        p_days: normalizedDays,
      }),
    },
  );

  return normalizeReport(response);
}
