import { Image } from "expo-image";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { Product } from "../types/commerce";
import type { StoreSettings } from "../types/storeSettings";
import { contrastText, type StoreTheme } from "../types/storeTheme";
import { getStoreLogoUrl } from "../lib/storeLogoStorage";
import { getProductImageUrl } from "../lib/supabaseStorage";

export function WebsitePreview({
  theme,
  settings,
  products,
  compact,
}: {
  theme: StoreTheme;
  settings: StoreSettings;
  products: Product[];
  compact: boolean;
}) {
  const textColor = contrastText(theme.background);
  const heading = {
    color: textColor,
    fontFamily:
      theme.font === "serif"
        ? Platform.select({
            ios: "Georgia",
            android: "serif",
            web: "Georgia, serif",
          })
        : undefined,
  };
  const corner = theme.corners === "soft" ? 18 : 0;
  const columns = compact ? 2 : theme.columns;
  return (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      {theme.announcement ? (
        <Text
          style={[
            styles.announcement,
            {
              backgroundColor: theme.accent,
              color: contrastText(theme.accent),
            },
          ]}
        >
          {theme.announcement}
        </Text>
      ) : null}
      <View style={styles.header}>
        {settings.logoPath ? (
          <Image
            source={{ uri: getStoreLogoUrl(settings.logoPath) }}
            style={styles.logo}
          />
        ) : null}
        <Text style={[styles.brand, heading]}>{settings.storeName}</Text>
        <Text style={{ color: textColor }}>Cart (0)</Text>
      </View>
      {theme.sections.map((section) => {
        if (section === "hero")
          return theme.showHero ? (
            <View
              key={section}
              style={[
                styles.section,
                theme.layout === "split" &&
                  !compact &&
                  !!theme.banner &&
                  styles.split,
              ]}
            >
              <View style={styles.heroText}>
                <Text style={[styles.eyebrow, { color: textColor }]}>
                  Welcome to {settings.storeName}
                </Text>
                <Text
                  style={[
                    styles.headline,
                    heading,
                    theme.layout === "centered" && styles.centered,
                  ]}
                >
                  {theme.heading || settings.storeName}
                </Text>
                <Text
                  style={[
                    styles.body,
                    { color: textColor },
                    theme.layout === "centered" && styles.centered,
                  ]}
                >
                  {theme.description ||
                    settings.description ||
                    "Find your next favorite. Explore our collection."}
                </Text>
                <Text
                  style={[
                    styles.cta,
                    {
                      backgroundColor: theme.accent,
                      color: contrastText(theme.accent),
                      borderRadius: corner,
                    },
                    theme.layout === "centered" && { alignSelf: "center" },
                  ]}
                >
                  Explore collection
                </Text>
              </View>
              {theme.banner ? (
                <Image
                  source={{ uri: theme.banner }}
                  contentFit="cover"
                  style={[
                    styles.banner,
                    { borderRadius: corner },
                    theme.layout === "split" && !compact && { flex: 1 },
                  ]}
                  accessibilityLabel="Store banner"
                />
              ) : null}
            </View>
          ) : null;
        if (section === "about")
          return theme.showAbout ? (
            <View key={section} style={styles.section}>
              <Text style={[styles.sectionTitle, heading]}>Our story</Text>
              <Text style={[styles.body, { color: textColor }]}>
                {theme.about || settings.description}
              </Text>
            </View>
          ) : null;
        return (
          <View key={section} style={styles.section}>
            <Text style={[styles.sectionTitle, heading]}>The collection</Text>
            <View style={styles.grid}>
              {products.map((product) => (
                <View
                  key={product.id}
                  style={[styles.product, { width: `${100 / columns}%` }]}
                >
                  <View style={[styles.productImage, { borderRadius: corner }]}>
                    {product.imagePath ? (
                      <Image
                        source={{ uri: getProductImageUrl(product.imagePath) }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.placeholder}>No product image</Text>
                    )}
                  </View>
                  <Text style={[styles.productName, heading]}>
                    {product.title}
                  </Text>
                  <Text style={{ color: textColor }}>
                    {new Intl.NumberFormat("en-CA", {
                      style: "currency",
                      currency: settings.currency,
                    }).format(product.price)}
                  </Text>
                  {theme.showInventory ? (
                    <Text style={[styles.stock, { color: textColor }]}>
                      {product.inventory} available
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
            {!products.length ? (
              <Text style={[styles.body, { color: textColor }]}>
                Add active, in-stock products to fill your collection.
              </Text>
            ) : null}
          </View>
        );
      })}
      <View style={styles.footer}>
        <Text style={[styles.brand, heading]}>{settings.storeName}</Text>
        <Text style={{ color: textColor }}>Powered by ShopPilot</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { overflow: "hidden", minHeight: 600, borderRadius: 12 },
  announcement: { textAlign: "center", padding: 12, fontSize: 14 },
  header: {
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    borderBottomWidth: 1,
    borderBottomColor: "#94A3B840",
  },
  logo: { width: 38, height: 38, borderRadius: 8 },
  brand: { fontSize: 18, fontWeight: "700", flex: 1 },
  section: { padding: 24, gap: 16 },
  split: { flexDirection: "row", alignItems: "center" },
  heroText: { flex: 1, gap: 16 },
  eyebrow: { fontSize: 14 },
  headline: { fontSize: 36, fontWeight: "800", lineHeight: 42 },
  centered: { textAlign: "center" },
  body: { fontSize: 16, lineHeight: 26 },
  cta: {
    alignSelf: "flex-start",
    padding: 14,
    fontSize: 14,
    fontWeight: "700",
  },
  banner: { width: "100%", height: 230 },
  sectionTitle: { fontSize: 25, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  product: { padding: 6, gap: 8 },
  productImage: {
    aspectRatio: 1,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholder: { color: "#475569", fontSize: 14 },
  productName: { fontSize: 17, fontWeight: "700" },
  stock: { fontSize: 14 },
  footer: {
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#94A3B840",
  },
});
