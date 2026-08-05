export type AnalyticsEventType =
  | "session_started"
  | "product_viewed"
  | "product_added_to_cart"
  | "checkout_started"
  | "checkout_completed";

export type AnalyticsSummary = {
  sessions: number;
  productViews: number;
  addToCarts: number;
  checkoutStarted: number;
  checkoutCompleted: number;
  conversionRate: number;
  addToCartRate: number;
  checkoutCompletionRate: number;
};

export type DailyTrafficPoint = {
  date: string;
  sessions: number;
  views: number;
};

export type ProductAnalytics = {
  productId: string;
  productTitle: string;
  views: number;
  addToCarts: number;
};

export type AnalyticsReport = {
  days: number;
  summary: AnalyticsSummary;
  dailyTraffic: DailyTrafficPoint[];
  topProducts: ProductAnalytics[];
};

export type TrackStoreEventInput = {
  merchantId: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  productId?: string | null;
  metadata?: Record<string, unknown>;
};

export const EMPTY_ANALYTICS_REPORT: AnalyticsReport = {
  days: 7,
  summary: {
    sessions: 0,
    productViews: 0,
    addToCarts: 0,
    checkoutStarted: 0,
    checkoutCompleted: 0,
    conversionRate: 0,
    addToCartRate: 0,
    checkoutCompletionRate: 0,
  },
  dailyTraffic: [],
  topProducts: [],
};
