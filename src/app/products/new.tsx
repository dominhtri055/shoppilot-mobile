import { router, type Href } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import {
  deleteProductImage,
  uploadProductImage,
} from "../../lib/supabaseStorage";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createProduct } from "../../api/productApi";
import { AppButton } from "../../components/AppButton";
import { Card } from "../../components/Card";
import { colors, spacing } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";

export default function NewProductScreen() {
  const { session, user } = useAuth();
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("0");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

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
  }

  async function handleCreate() {
    setErrorMessage(null);

    if (!session?.access_token || !user?.id) {
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
      }

      const product = await createProduct(
        {
          title,
          vendor,
          price: parsedPrice,
          inventory: parsedInventory,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          imagePath: uploadedImagePath,
        },
        user.id,
        session.access_token,
      );

      router.replace(`/products/${product.id}` as Href);
    } catch (error) {
      if (uploadedImagePath) {
        try {
          await deleteProductImage(uploadedImagePath, session.access_token);
        } catch {
          // Product creation error remains the primary error.
        }
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Product could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

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
          <Text style={styles.title}>Add a product</Text>
          <Text style={styles.subtitle}>
            Create a product for the signed-in merchant account.
          </Text>
          <Text style={styles.label}>Product image</Text>

          {selectedImage ? (
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.preview}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}

          <AppButton
            title={selectedImage ? "Choose another image" : "Choose image"}
            onPress={() => void handlePickImage()}
            variant="secondary"
            disabled={saving}
          />
          <Text style={styles.label}>Product title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Classic Hoodie"
            style={styles.input}
          />

          <Text style={styles.label}>Vendor</Text>
          <TextInput
            value={vendor}
            onChangeText={setVendor}
            placeholder="ShopPilot Apparel"
            style={styles.input}
          />

          <Text style={styles.label}>Price</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="64.99"
            style={styles.input}
          />

          <Text style={styles.label}>Starting inventory</Text>
          <TextInput
            value={inventory}
            onChangeText={setInventory}
            keyboardType="number-pad"
            placeholder="0"
            style={styles.input}
          />

          <Text style={styles.label}>Tags</Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="hoodie, apparel"
            style={styles.input}
          />

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              title={saving ? "Creating..." : "Create product"}
              onPress={() => void handleCreate()}
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
  error: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.sm,
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
});
