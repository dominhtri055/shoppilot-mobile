import { router, type Href, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getProducts } from "../../api/productApi";
import { AppButton } from "../../components/AppButton";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusPill } from "../../components/StatusPill";
import { colors, spacing } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useStoreSettings } from "../../contexts/StoreSettingsContext";
import { Product, ProductStatus } from "../../types/commerce";
import { formatCurrency } from "../../utils/formatCurrency";
import { isLowStock } from "../../utils/inventory";

type Filter = "all" | ProductStatus | "low-stock";

export default function ProductsScreen() {
  const { session } = useAuth();
  const { settings } = useStoreSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProducts = useCallback(
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
        const data = await getProducts(session.access_token);
        setProducts(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Products could not be loaded."
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
      void loadProducts();
    }, [loadProducts])
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.vendor.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        filter === "all" ||
        product.status === filter ||
        (filter === "low-stock" &&
          isLowStock(product, settings.lowStockThreshold));

      return matchesQuery && matchesFilter;
    });
  }, [filter, products, query, settings.lowStockThreshold]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorMessage && products.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState title="Products unavailable" message={errorMessage} />
        <AppButton title="Try again" onPress={() => void loadProducts()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppButton
        title="Add product"
        onPress={() => router.push("/products/new" as Href)}
      />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search products..."
        style={styles.input}
      />

      <View style={styles.filters}>
        {(
          ["all", "active", "draft", "archived", "low-stock"] as Filter[]
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

      <Text style={styles.thresholdNote}>
        Low stock means {settings.lowStockThreshold} units or fewer.
      </Text>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => void loadProducts(true)}
        ListEmptyComponent={
          <EmptyState
            title="No products found"
            message={
              products.length === 0
                ? "Add your first product to start managing inventory."
                : "Try changing your search or filter."
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/products/${item.id}` as Href)}
          >
            <Card>
              <View style={styles.row}>
                <View style={styles.productInfo}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.vendor}>{item.vendor}</Text>
                  <Text style={styles.price}>
                    {formatCurrency(item.price, settings.currency)}
                  </Text>
                </View>
                <View style={styles.right}>
                  <StatusPill
                    label={item.status}
                    tone={item.status === "active" ? "success" : "neutral"}
                  />
                  <Text style={styles.inventory}>{item.inventory} left</Text>
                </View>
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
    gap: spacing.md,
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
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
  thresholdNote: {
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
  },
  list: {
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  vendor: {
    color: colors.muted,
    marginTop: 2,
  },
  price: {
    color: colors.text,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  inventory: {
    color: colors.muted,
    fontWeight: "700",
  },
});
