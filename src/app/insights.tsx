import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getOrders } from "../api/orderApi";
import { getProducts } from "../api/productApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { StatusPill } from "../components/StatusPill";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { Product, RevenuePoint } from "../types/commerce";
import {
  buildWeeklyRevenue,
  getWeeklyRevenueSummary,
  RevenueSummary,
} from "../utils/analytics";
import { formatCurrency } from "../utils/formatCurrency";
import { isLowStock } from "../utils/inventory";

const EMPTY_SUMMARY: RevenueSummary = {
  weeklyRevenue: 0,
  averageOrderValue: 0,
  revenueOrderCount: 0,
  deliveredOrderCount: 0,
};

export default function InsightsScreen() {
  const { session } = useAuth();

  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [summary, setSummary] =
    useState<RevenueSummary>(EMPTY_SUMMARY);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    if (!session?.access_token) {
      setErrorMessage(
        "Your session has expired. Please sign in again."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const [ordersData, productsData] = await Promise.all([
        getOrders(session.access_token),
        getProducts(session.access_token),
      ]);

      setRevenue(buildWeeklyRevenue(ordersData));
      setSummary(getWeeklyRevenueSummary(ordersData));
      setLowStock(productsData.filter(isLowStock));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Insights could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useFocusEffect(
    useCallback(() => {
      void loadInsights();
    }, [loadInsights])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  if (errorMessage && revenue.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.error}>{errorMessage}</Text>

        <AppButton
          title="Try again"
          onPress={() => void loadInsights()}
        />
      </View>
    );
  }

  const maxRevenue = Math.max(
    1,
    ...revenue.map((point) => point.value)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {errorMessage ? (
        <Text style={styles.error}>{errorMessage}</Text>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>
          Weekly Revenue
        </Text>

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
                        : Math.max(
                            24,
                            (point.value / maxRevenue) * 160
                          ),
                  },
                ]}
              />

              <Text style={styles.barLabel}>
                {point.label}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>
          Store Health
        </Text>

        <Text style={styles.bigNumber}>
          {formatCurrency(summary.weeklyRevenue)}
        </Text>

        <Text style={styles.muted}>
          Revenue from the last 7 days
        </Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Average order value
          </Text>

          <Text style={styles.summaryValue}>
            {formatCurrency(summary.averageOrderValue)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Revenue orders
          </Text>

          <Text style={styles.summaryValue}>
            {summary.revenueOrderCount}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Delivered orders
          </Text>

          <Text style={styles.summaryValue}>
            {summary.deliveredOrderCount}
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>
          Inventory Risks
        </Text>

        {lowStock.length > 0 ? (
          lowStock.map((product) => (
            <View key={product.id} style={styles.row}>
              <View>
                <Text style={styles.product}>
                  {product.title}
                </Text>

                <Text style={styles.muted}>
                  {product.inventory} units remaining
                </Text>
              </View>

              <StatusPill
                label="Action needed"
                tone="warning"
              />
            </View>
          ))
        ) : (
          <Text style={styles.muted}>
            No low-stock products.
          </Text>
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
  },
  bigNumber: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
  },
  muted: {
    color: colors.muted,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    color: colors.muted,
  },
  summaryValue: {
    color: colors.text,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  product: {
    color: colors.text,
    fontWeight: "800",
  },
});