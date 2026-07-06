import { router, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getOrders } from "../../api/merchantApi";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusPill } from "../../components/StatusPill";
import { colors, spacing } from "../../constants/theme";
import { Order, OrderStatus } from "../../types/commerce";
import { formatCurrency } from "../../utils/formatCurrency";

type Filter = "all" | OrderStatus;

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const data = await getOrders();
      setOrders(data);
      setLoading(false);
    }

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {(
          [
            "all",
            "pending",
            "paid",
            "packed",
            "shipped",
            "delivered",
          ] as Filter[]
        ).map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filter, filter === item && styles.activeFilter]}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.activeFilterText,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No orders found"
            message="Try changing the selected fulfillment filter."
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/orders/${item.id}` as Href)}>
            <Card>
              <View style={styles.row}>
                <View>
                  <Text style={styles.title}>{item.customerName}</Text>
                  <Text style={styles.meta}>
                    {item.itemCount} items · {formatCurrency(item.total)}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <StatusPill label={item.status} tone="info" />
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filter: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },
  activeFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  list: {
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  meta: {
    color: colors.text,
    marginTop: spacing.xs,
  },
  date: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
