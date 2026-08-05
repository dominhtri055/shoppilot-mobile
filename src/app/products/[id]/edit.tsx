import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getProductById,
  updateProductDetails,
} from "../../../api/productApi";
import { AppButton } from "../../../components/AppButton";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { colors, spacing } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import {
  deleteProductImage,
  getProductImageUrl,
  uploadProductImage,
} from "../../../lib/supabaseStorage";
import { Product } from "../../../types/commerce";

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("0");
  const [tags, setTags] = useState("");
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

        if (!active) {
          return;
        }

        setProduct(data);
        setTitle(data.title);
        setVendor(data.vendor);
        setPrice(String(data.price));
        setInventory(String(data.inventory));
        setTags(data.tags.join(", "));
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

  async function handlePickImage() {
    setErrorMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage("Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
      base64: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setErrorMessage("The selected image must be smaller than 5 MB.");
      return;
    }

    if (!asset.base64) {
      setErrorMessage("The selected image could not be processed.");
      return;
    }

    setSelectedImage(asset);
    setRemoveCurrentImage(false);
  }

  function handleRemoveImage() {
    setSelectedImage(null);
    setRemoveCurrentImage(true);
  }

  async function handleSave() {
    setErrorMessage(null);

    if (!product || !session?.access_token || !user?.id) {
      setErrorMessage("Your session has expired. Please sign in again.");
      return;
    }

    if (!title.trim() || !vendor.trim() || !price.trim()) {
      setErrorMessage("Title, vendor, and price are required.");
      return;
    }

    const parsedPrice = Number(price.replace(",", "."));
    const parsedInventory = Number.parseInt(inventory || "0", 10);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setErrorMessage("Enter a valid price of zero or more.");
      return;
    }

    if (!Number.isInteger(parsedInventory) || parsedInventory < 0) {
      setErrorMessage("Inventory must be a whole number of zero or more.");
      return;
    }

    const previousImagePath = product.imagePath;
    let nextImagePath = removeCurrentImage ? null : previousImagePath;
    let uploadedImagePath: string | null = null;

    try {
      setSaving(true);

      if (selectedImage?.base64) {
        uploadedImagePath = await uploadProductImage({
          base64: selectedImage.base64,
          merchantId: user.id,
          accessToken: session.access_token,
          mimeType: selectedImage.mimeType,
          fileName: selectedImage.fileName,
        });
        nextImagePath = uploadedImagePath;
      }

      await updateProductDetails(
        product.id,
        {
          title,
          vendor,
          price: parsedPrice,
          inventory: parsedInventory,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          imagePath: nextImagePath,
        },
        session.access_token,
      );

      if (previousImagePath && previousImagePath !== nextImagePath) {
        try {
          await deleteProductImage(previousImagePath, session.access_token);
        } catch {
          // The product update succeeded; an old orphaned image can be cleaned later.
        }
      }

      router.back();
    } catch (error) {
      if (uploadedImagePath) {
        try {
          await deleteProductImage(uploadedImagePath, session.access_token);
        } catch {
          // The update error remains the primary error.
        }
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Product could not be updated.",
      );
    } finally {
      setSaving(false);
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
        <AppButton title="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  const previewUri = selectedImage?.uri
    ?? (!removeCurrentImage && product.imagePath
      ? getProductImageUrl(product.imagePath)
      : null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text style={styles.title}>Edit product</Text>
          <Text style={styles.subtitle}>
            Update product details, inventory, tags, or image.
          </Text>

          <Text style={styles.label}>Product image</Text>

          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.preview}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No product image</Text>
            </View>
          )}

          <View style={styles.imageActions}>
            <AppButton
              title={previewUri ? "Replace image" : "Choose image"}
              onPress={() => void handlePickImage()}
              variant="secondary"
              disabled={saving}
            />
            {previewUri ? (
              <AppButton
                title="Remove image"
                onPress={handleRemoveImage}
                variant="danger"
                disabled={saving}
              />
            ) : null}
          </View>

          <Text style={styles.label}>Product title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Classic Hoodie"
            style={styles.input}
            editable={!saving}
          />

          <Text style={styles.label}>Vendor</Text>
          <TextInput
            value={vendor}
            onChangeText={setVendor}
            placeholder="ShopPilot Apparel"
            style={styles.input}
            editable={!saving}
          />

          <Text style={styles.label}>Price</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="64.99"
            style={styles.input}
            editable={!saving}
          />

          <Text style={styles.label}>Inventory</Text>
          <TextInput
            value={inventory}
            onChangeText={setInventory}
            keyboardType="number-pad"
            placeholder="0"
            style={styles.input}
            editable={!saving}
          />

          <Text style={styles.label}>Tags</Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="hoodie, apparel"
            style={styles.input}
            editable={!saving}
          />

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              title={saving ? "Saving..." : "Save changes"}
              onPress={() => void handleSave()}
              disabled={saving}
            />
            <AppButton
              title="Cancel"
              onPress={() => router.back()}
              variant="secondary"
              disabled={saving}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.text,
  },
  preview: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  imagePlaceholder: {
    width: "100%",
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  placeholderText: {
    color: colors.muted,
    fontWeight: "700",
  },
  imageActions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});
