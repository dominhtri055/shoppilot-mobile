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
import { getOrderById, updateOrderStatus } from "../../api/orderApi";
import { AppButton } from "../../components/AppButton";
import { Card } from "../../components/Card";
import { StatusPill } from "../../components/StatusPill";
import { colors, spacing } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { Order } from "../../types/commerce";
import { formatCurrency } from "../../utils/formatCurrency";
import { getNextOrderStatus } from "../../utils/inventory";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!id || !session?.access_token) {
        setErrorMessage("The order or session is unavailable.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await getOrderById(id, session.access_token);
        setOrder(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Order could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [id, session?.access_token]);

  async function changeStatus(nextStatus: Order["status"]) {
    if (!order || !session?.access_token) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      const updated = await updateOrderStatus(
        order.id,
        nextStatus,
        session.access_token
      );
      setOrder(updated);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Order status could not be updated."
      );
    } finally {
      setSaving(false);
    }
  }

  async function moveToNextStatus() {
    if (!order) {
      return;
    }

    const nextStatus = getNextOrderStatus(order.status);

    if (nextStatus === order.status) {
      Alert.alert("No next step", "This order is already at its final status.");
      return;
    }

    await changeStatus(nextStatus);
  }

  function refundOrder() {
    if (!order || order.status === "refunded") {
      return;
    }

    Alert.alert(
      "Refund order",
      `Refund ${order.orderNumber ?? order.id}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Refund",
          style: "destructive",
          onPress: () => void changeStatus("refunded"),
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Order unavailable</Text>
        <Text style={styles.errorText}>
          {errorMessage ?? "This order could not be found."}
        </Text>
      </View>
    );
  }

  const nextStatus = getNextOrderStatus(order.status);
  const canAdvance =
    nextStatus !== order.status && order.status !== "refunded";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <StatusPill label={order.status} tone="info" />
        <Text style={styles.title}>
          Order {order.orderNumber ?? order.id}
        </Text>
        <Text style={styles.customer}>{order.customerName}</Text>
        {order.customerEmail ? (
          <Text style={styles.customerEmail}>{order.customerEmail}</Text>
        ) : null}
        <Text style={styles.total}>{formatCurrency(order.total)}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items?.length ? (
          order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.productTitle}</Text>
                <Text style={styles.detail}>Quantity: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.unitPrice * item.quantity)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.detail}>No line items are available.</Text>
        )}
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
          Move the order through the merchant fulfillment process.
        </Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.actions}>
          <AppButton
            title={
              canAdvance ? `Move to ${nextStatus}` : "Final Status Reached"
            }
            onPress={() => void moveToNextStatus()}
            disabled={saving || !canAdvance}
          />
          <AppButton
            title={saving ? "Updating..." : "Refund Order"}
            onPress={refundOrder}
            variant="danger"
            disabled={saving || order.status === "refunded"}
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: spacing.md,
  },
  customer: {
    color: colors.text,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  customerEmail: {
    color: colors.muted,
    marginTop: spacing.xs,
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
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  itemPrice: {
    color: colors.text,
    fontWeight: "900",
  },
  actions: {
    gap: spacing.md,
  },
});
