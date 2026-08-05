import { router, type Href, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  deleteProduct,
  getProductById,
  updateProductInventory,
  updateProductStatus,
} from "../../api/productApi";
import { AppButton } from "../../components/AppButton";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusPill } from "../../components/StatusPill";
import { colors, spacing } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { Product } from "../../types/commerce";
import { formatCurrency } from "../../utils/formatCurrency";
import { Image } from "expo-image";
import { getProductImageUrl } from "../../lib/supabaseStorage";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      if (!id || !session?.access_token) {
        if (active) {
          setErrorMessage("Product or session information is missing.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await getProductById(id, session.access_token);

        if (active) {
          setProduct(data);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Product could not be loaded.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      active = false;
    };
  }, [id, session?.access_token]);

  async function handleInventoryChange(amount: number) {
    if (!product || !session?.access_token) return;

    const nextInventory = product.inventory + amount;

    if (nextInventory < 0) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      const updated = await updateProductInventory(
        product.id,
        nextInventory,
        session.access_token,
      );
      setProduct(updated);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Inventory could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusToggle() {
    if (!product || !session?.access_token) return;

    const nextStatus = product.status === "active" ? "draft" : "active";

    try {
      setSaving(true);
      setErrorMessage(null);
      const updated = await updateProductStatus(
        product.id,
        nextStatus,
        session.access_token,
      );
      setProduct(updated);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Product status could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!product || !session?.access_token) return;

    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    try {
      setDeleting(true);
      setErrorMessage(null);
      await deleteProduct(product.id, session.access_token);
      router.replace("/products" as Href);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Product could not be deleted.",
      );
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          title="Product unavailable"
          message={errorMessage ?? "This product could not be found."}
        />
        <AppButton
          title="Back to products"
          onPress={() => router.replace("/products" as Href)}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {product.imagePath ? (
        <Image
          source={{
            uri: getProductImageUrl(product.imagePath),
          }}
          style={styles.productImage}
          contentFit="cover"
        />
      ) : (
        <Text style={styles.noImageText}>No product image</Text>
      )}
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
            onPress={() => void handleInventoryChange(-1)}
            variant="secondary"
            disabled={saving || product.inventory === 0}
          />
          <AppButton
            title="+1"
            onPress={() => void handleInventoryChange(1)}
            disabled={saving}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Product Tags</Text>
        <View style={styles.tags}>
          {product.tags.length > 0 ? (
            product.tags.map((tag) => (
              <StatusPill key={tag} label={tag} tone="neutral" />
            ))
          ) : (
            <Text style={styles.description}>No tags added.</Text>
          )}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Publishing</Text>
        <Text style={styles.description}>
          Toggle product visibility between active and draft.
        </Text>
        <AppButton
          title={
            product.status === "active" ? "Move to Draft" : "Publish Product"
          }
          onPress={() => void handleStatusToggle()}
          disabled={saving || deleting}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <Text style={styles.description}>
          {confirmingDelete
            ? "Press delete again to permanently remove this product."
            : "Deleting a product cannot be undone."}
        </Text>
        <AppButton
          title={
            deleting
              ? "Deleting..."
              : confirmingDelete
                ? "Confirm delete"
                : "Delete product"
          }
          onPress={() => void handleDelete()}
          variant="danger"
          disabled={saving || deleting}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.md,
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
  productImage: {
    width: "100%",
    height: 320,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  noImageText: {
    color: colors.muted,
    fontStyle: "italic",
    marginBottom: spacing.md,
  },
});
