import { router, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getProducts } from "../../api/merchantApi";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusPill } from "../../components/StatusPill";
import { colors, spacing } from "../../constants/theme";
import { Product, ProductStatus } from "../../types/commerce";
import { formatCurrency } from "../../utils/formatCurrency";
import { isLowStock } from "../../utils/inventory";

type Filter = "all" | ProductStatus | "low-stock";

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.vendor.toLowerCase().includes(query.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        product.status === filter ||
        (filter === "low-stock" && isLowStock(product));

      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search products..."
        style={styles.input}
      />

      <View style={styles.filters}>
        {(["all", "active", "draft", "low-stock"] as Filter[]).map((item) => (
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
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No products found"
            message="Try changing your search or filter."
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
                  <Text style={styles.price}>{formatCurrency(item.price)}</Text>
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
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
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
