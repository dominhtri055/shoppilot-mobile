import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getAnalyticsReport } from "../api/analyticsApi";
import { getOrders } from "../api/orderApi";
import { getProducts } from "../api/productApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { StatusPill } from "../components/StatusPill";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { useStoreSettings } from "../contexts/StoreSettingsContext";
import {
  AnalyticsReport,
  EMPTY_ANALYTICS_REPORT,
} from "../types/analytics";
import { Product, RevenuePoint } from "../types/commerce";
import {
  buildWeeklyRevenue,
  getWeeklyRevenueSummary,
  RevenueSummary,
} from "../utils/analytics";
import { formatCurrency } from "../utils/formatCurrency";
import { isLowStock } from "../utils/inventory";

const EMPTY_REVENUE_SUMMARY: RevenueSummary = {
  weeklyRevenue: 0,
  averageOrderValue: 0,
  revenueOrderCount: 0,
  deliveredOrderCount: 0,
};

function getDayLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

export default function InsightsScreen() {
  const { session } = useAuth();
  const { settings } = useStoreSettings();
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [summary, setSummary] =
    useState<RevenueSummary>(EMPTY_REVENUE_SUMMARY);
  const [analytics, setAnalytics] =
    useState<AnalyticsReport>(EMPTY_ANALYTICS_REPORT);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    if (!session?.access_token) {
      setErrorMessage("Your session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const [ordersData, productsData, analyticsData] = await Promise.all([
        getOrders(session.access_token),
        getProducts(session.access_token),
        getAnalyticsReport(session.access_token, 7),
      ]);

      setRevenue(buildWeeklyRevenue(ordersData));
      setSummary(getWeeklyRevenueSummary(ordersData));
      setAnalytics(analyticsData);
      setLowStock(
        productsData.filter((product) =>
          isLowStock(product, settings.lowStockThreshold),
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Insights could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, settings.lowStockThreshold]);

  useFocusEffect(
    useCallback(() => {
      void loadInsights();
    }, [loadInsights]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorMessage && revenue.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.error}>{errorMessage}</Text>
        <AppButton title="Try again" onPress={() => void loadInsights()} />
      </View>
    );
  }

  const maxRevenue = Math.max(1, ...revenue.map((point) => point.value));
  const maxSessions = Math.max(
    1,
    ...analytics.dailyTraffic.map((point) => point.sessions),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Card>
        <Text style={styles.sectionTitle}>Weekly Revenue</Text>
        <View style={styles.chart}>
          {revenue.map((point) => (
            <View key={point.label} style={styles.barItem}>
              <View
                style={[
                  styles.bar,
                  {
                    height:
                      point.value === 0
                        ? 4
                        : Math.max(24, (point.value / maxRevenue) * 160),
                  },
                ]}
              />
              <Text style={styles.barLabel}>{point.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Traffic & Conversion</Text>
        <Text style={styles.bigNumber}>
          {analytics.summary.conversionRate.toFixed(1)}%
        </Text>
        <Text style={styles.muted}>
          Completed checkout conversion over the last {analytics.days} days
        </Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Store sessions</Text>
          <Text style={styles.summaryValue}>{analytics.summary.sessions}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Product views</Text>
          <Text style={styles.summaryValue}>
            {analytics.summary.productViews}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Add to carts</Text>
          <Text style={styles.summaryValue}>
            {analytics.summary.addToCarts}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Checkout started</Text>
          <Text style={styles.summaryValue}>
            {analytics.summary.checkoutStarted}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Checkout completed</Text>
          <Text style={styles.summaryValue}>
            {analytics.summary.checkoutCompleted}
          </Text>
        </View>

        <View style={styles.rateGrid}>
          <View style={styles.rateItem}>
            <Text style={styles.rateValue}>
              {analytics.summary.addToCartRate.toFixed(1)}%
            </Text>
            <Text style={styles.rateLabel}>Session → cart</Text>
          </View>

          <View style={styles.rateItem}>
            <Text style={styles.rateValue}>
              {analytics.summary.checkoutCompletionRate.toFixed(1)}%
            </Text>
            <Text style={styles.rateLabel}>Checkout completion</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Daily Sessions</Text>
        <View style={styles.trafficChart}>
          {analytics.dailyTraffic.map((point) => (
            <View key={point.date} style={styles.trafficBarItem}>
              <Text style={styles.trafficValue}>{point.sessions}</Text>
              <View
                style={[
                  styles.trafficBar,
                  {
                    height:
                      point.sessions === 0
                        ? 4
                        : Math.max(20, (point.sessions / maxSessions) * 130),
                  },
                ]}
              />
              <Text style={styles.barLabel}>{getDayLabel(point.date)}</Text>
              <Text style={styles.viewsLabel}>{point.views} views</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Top Products</Text>
        {analytics.topProducts.length > 0 ? (
          analytics.topProducts.map((product) => (
            <View key={product.productId} style={styles.row}>
              <Text style={styles.product}>{product.productTitle}</Text>
              <View style={styles.productMetrics}>
                <Text style={styles.summaryValue}>{product.views} views</Text>
                <Text style={styles.muted}>{product.addToCarts} carts</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>
            Product traffic will appear after storefront events are recorded.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Store Health</Text>
        <Text style={styles.bigNumber}>
          {formatCurrency(summary.weeklyRevenue, settings.currency)}
        </Text>
        <Text style={styles.muted}>Revenue from the last 7 days</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Average order value</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary.averageOrderValue, settings.currency)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Revenue orders</Text>
          <Text style={styles.summaryValue}>{summary.revenueOrderCount}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivered orders</Text>
          <Text style={styles.summaryValue}>{summary.deliveredOrderCount}</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Inventory Risks</Text>
        <Text style={styles.thresholdNote}>
          Alert threshold: {settings.lowStockThreshold} units
        </Text>

        {lowStock.length > 0 ? (
          lowStock.map((product) => (
            <View key={product.id} style={styles.row}>
              <View>
                <Text style={styles.product}>{product.title}</Text>
                <Text style={styles.muted}>
                  {product.inventory} units remaining
                </Text>
              </View>
              <StatusPill label="Action needed" tone="warning" />
            </View>
          ))
        ) : (
          <Text style={styles.muted}>No low-stock products.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  content: {
    width: "100%",
    maxWidth: 840,
    alignSelf: "center",
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  chart: {
    height: 210,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  barItem: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  barLabel: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  bigNumber: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
  },
  muted: {
    color: colors.muted,
  },
  thresholdNote: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    color: colors.muted,
    flex: 1,
  },
  summaryValue: {
    color: colors.text,
    fontWeight: "800",
  },
  rateGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  rateItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  rateValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  rateLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  trafficChart: {
    height: 210,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  trafficBarItem: {
    flex: 1,
    alignItems: "center",
  },
  trafficValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  trafficBar: {
    width: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  viewsLabel: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  product: {
    color: colors.text,
    fontWeight: "800",
    flex: 1,
  },
  productMetrics: {
    alignItems: "flex-end",
  },
});
