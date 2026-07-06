import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  getOrderById,
  updateOrderStatus,
} from "../../src/api/merchantApi";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { StatusPill } from "../../src/components/StatusPill";
import { colors, spacing } from "../../src/constants/theme";
import { Order } from "../../src/types/commerce";
import { formatCurrency } from "../../src/utils/formatCurrency";
import { getNextOrderStatus } from "../../src/utils/inventory";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await getOrderById(id);
        setOrder(data);
      } catch {
        Alert.alert("Error", "Order could not be loaded.");
      }
    }

    loadOrder();
  }, [id]);

  async function moveToNextStatus() {
    if (!order) return;

    const nextStatus = getNextOrderStatus(order.status);

    if (nextStatus === order.status) {
      Alert.alert("No next step", "This order is already at its final status.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateOrderStatus(order.id, nextStatus);
      setOrder({ ...updated });
    } catch {
      Alert.alert("Error", "Order status could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function refundOrder() {
    if (!order) return;

    try {
      setSaving(true);
      const updated = await updateOrderStatus(order.id, "refunded");
      setOrder({ ...updated });
    } catch {
      Alert.alert("Error", "Order could not be refunded.");
    } finally {
      setSaving(false);
    }
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const nextStatus = getNextOrderStatus(order.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <StatusPill label={order.status} tone="info" />
        <Text style={styles.title}>Order {order.id}</Text>
        <Text style={styles.customer}>{order.customerName}</Text>
        <Text style={styles.total}>{formatCurrency(order.total)}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <Text style={styles.detail}>Items: {order.itemCount}</Text>
        <Text style={styles.detail}>
          Created: {new Date(order.createdAt).toLocaleString()}
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Fulfillment Workflow</Text>
        <Text style={styles.description}>
          Move the order through a commerce fulfillment flow.
        </Text>

        <View style={styles.actions}>
          <AppButton
            title={
              nextStatus === order.status
                ? "Final Status Reached"
                : `Move to ${nextStatus}`
            }
            onPress={moveToNextStatus}
            disabled={saving || nextStatus === order.status}
          />
          <AppButton
            title="Refund Order"
            onPress={refundOrder}
            variant="danger"
            disabled={saving}
          />
        </View>
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
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: spacing.md,
  },
  customer: {
    color: colors.muted,
    marginTop: spacing.sm,
  },
  total: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  detail: {
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.muted,
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
});