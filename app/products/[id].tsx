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
  getProductById,
  updateProductInventory,
  updateProductStatus,
} from "../../src/api/merchantApi";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { StatusPill } from "../../src/components/StatusPill";
import { colors, spacing } from "../../src/constants/theme";
import { Product } from "../../src/types/commerce";
import { formatCurrency } from "../../src/utils/formatCurrency";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch {
        Alert.alert("Error", "Product could not be loaded.");
      }
    }

    loadProduct();
  }, [id]);

  async function handleInventoryChange(amount: number) {
    if (!product) return;

    try {
      setSaving(true);
      const updated = await updateProductInventory(
        product.id,
        product.inventory + amount
      );
      setProduct({ ...updated });
    } catch {
      Alert.alert("Error", "Inventory could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusToggle() {
    if (!product) return;

    const nextStatus = product.status === "active" ? "draft" : "active";

    try {
      setSaving(true);
      const updated = await updateProductStatus(product.id, nextStatus);
      setProduct({ ...updated });
    } catch {
      Alert.alert("Error", "Product status could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <StatusPill
          label={product.status}
          tone={product.status === "active" ? "success" : "neutral"}
        />
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.vendor}>{product.vendor}</Text>
        <Text style={styles.price}>{formatCurrency(product.price)}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Inventory</Text>
        <Text style={styles.inventory}>{product.inventory}</Text>

        <View style={styles.actions}>
          <AppButton
            title="-1"
            onPress={() => handleInventoryChange(-1)}
            variant="secondary"
            disabled={saving}
          />
          <AppButton
            title="+1"
            onPress={() => handleInventoryChange(1)}
            disabled={saving}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Product Tags</Text>
        <View style={styles.tags}>
          {product.tags.map((tag) => (
            <StatusPill key={tag} label={tag} tone="neutral" />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Publishing</Text>
        <Text style={styles.description}>
          Toggle product visibility between active and draft.
        </Text>
        <AppButton
          title={product.status === "active" ? "Move to Draft" : "Publish Product"}
          onPress={handleStatusToggle}
          disabled={saving}
        />
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
  vendor: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  price: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  inventory: {
    color: colors.text,
    fontSize: 48,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  description: {
    color: colors.muted,
    marginBottom: spacing.md,
  },
});