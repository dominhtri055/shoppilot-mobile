import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getProducts, getRevenuePoints } from "../src/api/merchantApi";
import { Card } from "../src/components/Card";
import { StatusPill } from "../src/components/StatusPill";
import { colors, spacing } from "../src/constants/theme";
import { Product, RevenuePoint } from "../src/types/commerce";
import { formatCurrency } from "../src/utils/formatCurrency";
import { isLowStock } from "../src/utils/inventory";

export default function InsightsScreen() {
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      const [revenueData, productsData] = await Promise.all([
        getRevenuePoints(),
        getProducts(),
      ]);

      setRevenue(revenueData);
      setLowStock(productsData.filter(isLowStock));
      setLoading(false);
    }

    loadInsights();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const maxRevenue = Math.max(...revenue.map((point) => point.value));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>Weekly Revenue</Text>
        <View style={styles.chart}>
          {revenue.map((point) => (
            <View key={point.label} style={styles.barItem}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(24, (point.value / maxRevenue) * 160) },
                ]}
              />
              <Text style={styles.barLabel}>{point.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Store Health</Text>
        <Text style={styles.bigNumber}>{formatCurrency(8238.41)}</Text>
        <Text style={styles.muted}>Projected weekly revenue</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Inventory Risks</Text>
        {lowStock.map((product) => (
          <View key={product.id} style={styles.row}>
            <View>
              <Text style={styles.product}>{product.title}</Text>
              <Text style={styles.muted}>{product.inventory} units remaining</Text>
            </View>
            <StatusPill label="Action needed" tone="warning" />
          </View>
        ))}
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