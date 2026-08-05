import { router, type Href, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getOrders } from "../../api/orderApi";
import { AppButton } from "../../components/AppButton";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusPill } from "../../components/StatusPill";
import { colors, spacing } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useStoreSettings } from "../../contexts/StoreSettingsContext";
import { Order, OrderStatus } from "../../types/commerce";
import { formatCurrency } from "../../utils/formatCurrency";

type Filter = "all" | OrderStatus;

export default function OrdersScreen() {
  const { session } = useAuth();
  const { settings } = useStoreSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      if (!session?.access_token) {
        setErrorMessage("Your session has expired. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage(null);
        const data = await getOrders(session.access_token);
        setOrders(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Orders could not be loaded."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session?.access_token]
  );

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders])
  );

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorMessage && orders.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState title="Orders unavailable" message={errorMessage} />
        <AppButton title="Try again" onPress={() => void loadOrders()} />
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
            "refunded",
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

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => void loadOrders(true)}
        ListEmptyComponent={
          <EmptyState
            title="No orders found"
            message={
              orders.length === 0
                ? "No customer orders have been created yet."
                : "Try changing the selected fulfillment filter."
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/orders/${item.id}` as Href)}>
            <Card>
              <View style={styles.row}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>
                    {item.orderNumber ?? item.id}
                  </Text>
                  <Text style={styles.title}>{item.customerName}</Text>
                  <Text style={styles.meta}>
                    {item.itemCount} items · {formatCurrency(item.total, settings.currency)}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
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
  error: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: spacing.xs,
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
