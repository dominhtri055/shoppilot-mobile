import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { getStoreLogoUrl } from "../lib/storeLogoStorage";
import { DashboardMetrics, Order, Product } from "../types/commerce";
import { formatCurrency } from "../utils/formatCurrency";
import { isLowStock } from "../utils/inventory";

type DashboardViewMetrics = DashboardMetrics & {
  sessions7d: number;
  completedCheckouts7d: number;
};

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function DashboardScreen() {
  const { session, user, signOut } = useAuth();
  const { settings, errorMessage: settingsError } = useStoreSettings();
  const [metrics, setMetrics] = useState<DashboardViewMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const [ordersData, productsData, analyticsData] = await Promise.all([
          getOrders(session.access_token),
          getProducts(session.access_token),
          getAnalyticsReport(session.access_token, 7),
        ]);

        const lowStockProducts = productsData.filter((product) =>
          isLowStock(product, settings.lowStockThreshold),
        );
        const revenueToday = ordersData
          .filter(
            (order) => isToday(order.createdAt) && order.status !== "refunded",
          )
          .reduce((total, order) => total + order.total, 0);
        const openOrders = ordersData.filter(
          (order) =>
            order.status !== "delivered" && order.status !== "refunded",
        ).length;

        setMetrics({
          revenueToday,
          openOrders,
          lowStockProducts: lowStockProducts.length,
          conversionRate: analyticsData.summary.conversionRate,
          sessions7d: analyticsData.summary.sessions,
          completedCheckouts7d: analyticsData.summary.checkoutCompleted,
        });
        setRecentOrders(ordersData.slice(0, 3));
        setLowStock(lowStockProducts);
      } catch {
        Alert.alert("Error", "Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [session?.access_token, settings.lowStockThreshold]);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut();
      router.replace("/login" as Href);
    } catch {
      Alert.alert("Sign out failed", "Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading || !metrics) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.storeHeader}>
        {settings.logoPath ? (
          <Image
            source={{ uri: getStoreLogoUrl(settings.logoPath) }}
            style={styles.logo}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoInitial}>
              {settings.storeName.charAt(0).toUpperCase() || "S"}
            </Text>
          </View>
        )}

        <View style={styles.storeInfo}>
          <Text style={styles.heading}>{settings.storeName}</Text>
          <Text style={styles.subheading}>
            {settings.businessEmail || user?.email || "merchant"}
          </Text>
          {settings.description ? (
            <Text style={styles.description}>{settings.description}</Text>
          ) : null}
        </View>
      </View>

      {settingsError ? (
        <Text style={styles.settingsWarning}>{settingsError}</Text>
      ) : null}

      <View style={styles.grid}>
        <Card>
          <Text style={styles.metricLabel}>Revenue Today</Text>
          <Text style={styles.metric}>
            {formatCurrency(metrics.revenueToday, settings.currency)}
          </Text>
        </Card>

        <Card>
          <Text style={styles.metricLabel}>Open Orders</Text>
          <Text style={styles.metric}>{metrics.openOrders}</Text>
        </Card>

        <Card>
          <Text style={styles.metricLabel}>Low Stock</Text>
          <Text style={styles.metric}>{metrics.lowStockProducts}</Text>
          <Text style={styles.metricNote}>
            Threshold: {settings.lowStockThreshold}
          </Text>
        </Card>

        <Card>
          <Text style={styles.metricLabel}>Conversion · 7 days</Text>
          <Text style={styles.metric}>
            {metrics.conversionRate.toFixed(1)}%
          </Text>
          <Text style={styles.metricNote}>
            {metrics.completedCheckouts7d} completed checkout
            {metrics.completedCheckouts7d === 1 ? "" : "s"} from{" "}
            {metrics.sessions7d} session{metrics.sessions7d === 1 ? "" : "s"}
          </Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          <AppButton
            title="Products"
            onPress={() => router.push("/products" as Href)}
          />
          <AppButton
            title="Orders"
            onPress={() => router.push("/orders" as Href)}
            variant="secondary"
          />
          <AppButton
            title="Insights"
            onPress={() => router.push("/insights" as Href)}
            variant="secondary"
          />
          <AppButton
            title="Store settings"
            onPress={() => router.push("/settings" as Href)}
            variant="secondary"
          />
          <AppButton
            title={signingOut ? "Signing out..." : "Sign out"}
            onPress={() => void handleSignOut()}
            variant="danger"
            disabled={signingOut}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.length > 0 ? (
          recentOrders.map((order) => (
            <View key={order.id} style={styles.row}>
              <View>
                <Text style={styles.orderNumber}>
                  {order.orderNumber ?? order.id}
                </Text>
                <Text style={styles.rowTitle}>{order.customerName}</Text>
                <Text style={styles.rowMeta}>
                  {formatCurrency(order.total, settings.currency)}
                </Text>
              </View>
              <StatusPill label={order.status} tone="info" />
            </View>
          ))
        ) : (
          <Text style={styles.rowMeta}>No recent orders.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
        {lowStock.length > 0 ? (
          lowStock.map((product) => (
            <View key={product.id} style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{product.title}</Text>
                <Text style={styles.rowMeta}>{product.inventory} left</Text>
              </View>
              <StatusPill label="Low stock" tone="warning" />
            </View>
          ))
        ) : (
          <Text style={styles.rowMeta}>No low-stock products.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background },
  content: { padding: spacing.lg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  storeInfo: {
    flex: 1,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  logoFallback: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  logoInitial: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
  },
  heading: { fontSize: 28, fontWeight: "900", color: colors.text },
  subheading: { color: colors.muted, marginTop: spacing.xs },
  description: { color: colors.muted, marginTop: spacing.sm },
  settingsWarning: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  grid: { gap: spacing.sm },
  metricLabel: { color: colors.muted, marginBottom: spacing.sm },
  metric: { fontSize: 24, fontWeight: "900", color: colors.text },
  metricNote: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: spacing.md,
    color: colors.text,
  },
  actions: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderNumber: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: spacing.xs,
  },
  rowTitle: { fontWeight: "800", color: colors.text },
  rowMeta: { color: colors.muted },
});
