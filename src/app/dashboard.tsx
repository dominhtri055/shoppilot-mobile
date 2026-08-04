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
import { getDashboardMetrics, getOrders } from "../api/merchantApi";
import { getProducts } from "../api/productApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { StatusPill } from "../components/StatusPill";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { DashboardMetrics, Order, Product } from "../types/commerce";
import { formatCurrency } from "../utils/formatCurrency";
import { isLowStock } from "../utils/inventory";

export default function DashboardScreen() {
  const { session, user, signOut } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
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
        const [metricsData, ordersData, productsData] = await Promise.all([
          getDashboardMetrics(),
          getOrders(),
          getProducts(session.access_token),
        ]);

        const lowStockProducts = productsData.filter(isLowStock);
        setMetrics({
          ...metricsData,
          lowStockProducts: lowStockProducts.length,
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
  }, [session?.access_token]);

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
      <Text style={styles.heading}>Merchant dashboard</Text>
      <Text style={styles.subheading}>
        Signed in as {user?.email ?? "merchant"}
      </Text>

      <View style={styles.grid}>
        <Card>
          <Text style={styles.metricLabel}>Revenue Today</Text>
          <Text style={styles.metric}>
            {formatCurrency(metrics.revenueToday)}
          </Text>
        </Card>

        <Card>
          <Text style={styles.metricLabel}>Open Orders</Text>
          <Text style={styles.metric}>{metrics.openOrders}</Text>
        </Card>

        <Card>
          <Text style={styles.metricLabel}>Low Stock</Text>
          <Text style={styles.metric}>{metrics.lowStockProducts}</Text>
        </Card>

        <Card>
          <Text style={styles.metricLabel}>Conversion</Text>
          <Text style={styles.metric}>{metrics.conversionRate}%</Text>
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
            title={signingOut ? "Signing out..." : "Sign out"}
            onPress={() => void handleSignOut()}
            variant="danger"
            disabled={signingOut}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.map((order) => (
          <View key={order.id} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{order.customerName}</Text>
              <Text style={styles.rowMeta}>{formatCurrency(order.total)}</Text>
            </View>
            <StatusPill label={order.status} tone="info" />
          </View>
        ))}
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
  heading: { fontSize: 28, fontWeight: "900", color: colors.text },
  subheading: { color: colors.muted, marginBottom: spacing.lg },
  grid: { gap: spacing.sm },
  metricLabel: { color: colors.muted, marginBottom: spacing.sm },
  metric: { fontSize: 24, fontWeight: "900", color: colors.text },
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
  rowTitle: { fontWeight: "800", color: colors.text },
  rowMeta: { color: colors.muted },
});
