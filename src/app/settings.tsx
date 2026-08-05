import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { updateStoreSettings } from "../api/storeSettingsApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { useStoreSettings } from "../contexts/StoreSettingsContext";
import {
  deleteStoreLogo,
  getStoreLogoUrl,
  uploadStoreLogo,
} from "../lib/storeLogoStorage";
import {
  STORE_CURRENCIES,
  type StoreCurrency,
} from "../types/storeSettings";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StoreSettingsScreen() {
  const { session, user } = useAuth();
  const { settings, replaceSettings } = useStoreSettings();
  const [storeName, setStoreName] = useState(settings.storeName);
  const [businessEmail, setBusinessEmail] = useState(settings.businessEmail);
  const [description, setDescription] = useState(settings.description);
  const [currency, setCurrency] = useState<StoreCurrency>(settings.currency);
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(settings.lowStockThreshold)
  );
  const [selectedLogo, setSelectedLogo] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setStoreName(settings.storeName);
    setBusinessEmail(settings.businessEmail);
    setDescription(settings.description);
    setCurrency(settings.currency);
    setLowStockThreshold(String(settings.lowStockThreshold));
    setSelectedLogo(null);
    setRemoveLogo(false);
  }, [settings]);

  async function handlePickLogo() {
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
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setErrorMessage("The selected logo must be smaller than 5 MB.");
      return;
    }

    if (!asset.base64) {
      setErrorMessage("The selected logo could not be processed.");
      return;
    }

    setSelectedLogo(asset);
    setRemoveLogo(false);
  }

  async function handleSave() {
    setErrorMessage(null);

    if (!session?.access_token || !user?.id) {
      setErrorMessage("Your session has expired. Please sign in again.");
      return;
    }

    if (!storeName.trim()) {
      setErrorMessage("Store name is required.");
      return;
    }

    if (!businessEmail.trim() || !EMAIL_PATTERN.test(businessEmail.trim())) {
      setErrorMessage("Enter a valid business email address.");
      return;
    }

    const parsedThreshold = Number.parseInt(lowStockThreshold, 10);

    if (
      !Number.isInteger(parsedThreshold) ||
      parsedThreshold < 0 ||
      parsedThreshold > 9999
    ) {
      setErrorMessage("Low-stock threshold must be between 0 and 9999.");
      return;
    }

    if (description.trim().length > 500) {
      setErrorMessage("Store description must be 500 characters or fewer.");
      return;
    }

    const previousLogoPath = settings.logoPath;
    let uploadedLogoPath: string | null = null;
    let nextLogoPath = removeLogo ? null : previousLogoPath;

    try {
      setSaving(true);

      if (selectedLogo?.base64) {
        uploadedLogoPath = await uploadStoreLogo({
          base64: selectedLogo.base64,
          merchantId: user.id,
          accessToken: session.access_token,
          mimeType: selectedLogo.mimeType,
          fileName: selectedLogo.fileName,
        });
        nextLogoPath = uploadedLogoPath;
      }

      const updated = await updateStoreSettings(
        user.id,
        {
          storeName,
          businessEmail,
          description,
          currency,
          lowStockThreshold: parsedThreshold,
          logoPath: nextLogoPath,
        },
        session.access_token
      );

      replaceSettings(updated);

      if (previousLogoPath && previousLogoPath !== updated.logoPath) {
        try {
          await deleteStoreLogo(previousLogoPath, session.access_token);
        } catch {
          // The settings update succeeded; an orphaned old logo can be cleaned later.
        }
      }

      router.back();
    } catch (error) {
      if (uploadedLogoPath) {
        try {
          await deleteStoreLogo(uploadedLogoPath, session.access_token);
        } catch {
          // Preserve the settings error as the primary error.
        }
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Store settings could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  const logoUri = selectedLogo
    ? selectedLogo.uri
    : !removeLogo && settings.logoPath
      ? getStoreLogoUrl(settings.logoPath)
      : null;

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
          <Text style={styles.title}>Store settings</Text>
          <Text style={styles.subtitle}>
            Customize the merchant profile used throughout ShopPilot.
          </Text>

          <Text style={styles.label}>Store logo</Text>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logo} contentFit="cover" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.placeholderText}>No store logo</Text>
            </View>
          )}

          <View style={styles.logoActions}>
            <AppButton
              title={logoUri ? "Replace logo" : "Choose logo"}
              onPress={() => void handlePickLogo()}
              variant="secondary"
              disabled={saving}
            />
            {logoUri ? (
              <AppButton
                title="Remove logo"
                onPress={() => {
                  setSelectedLogo(null);
                  setRemoveLogo(true);
                }}
                variant="danger"
                disabled={saving}
              />
            ) : null}
          </View>

          <Text style={styles.label}>Store name</Text>
          <TextInput
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Tri's Store"
            style={styles.input}
            editable={!saving}
          />

          <Text style={styles.label}>Business email</Text>
          <TextInput
            value={businessEmail}
            onChangeText={setBusinessEmail}
            placeholder="hello@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            editable={!saving}
          />

          <Text style={styles.label}>Store description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your store and what it sells."
            multiline
            maxLength={500}
            style={[styles.input, styles.descriptionInput]}
            editable={!saving}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>

          <Text style={styles.label}>Currency</Text>
          <View style={styles.currencyRow}>
            {STORE_CURRENCIES.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCurrency(item)}
                disabled={saving}
                style={[
                  styles.currencyOption,
                  currency === item && styles.currencyOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.currencyText,
                    currency === item && styles.currencyTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Low-stock threshold</Text>
          <TextInput
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
            placeholder="5"
            keyboardType="number-pad"
            style={styles.input}
            editable={!saving}
          />
          <Text style={styles.helperText}>
            Products at or below this inventory level appear in low-stock alerts.
          </Text>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <AppButton
              title={saving ? "Saving..." : "Save settings"}
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
    maxWidth: 680,
    alignSelf: "center",
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
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
    marginTop: spacing.md,
  },
  input: {
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  descriptionInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "right",
    marginTop: spacing.xs,
  },
  logo: {
    width: 144,
    height: 144,
    borderRadius: 24,
    marginBottom: spacing.md,
  },
  logoPlaceholder: {
    width: 144,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  placeholderText: {
    color: colors.muted,
    fontWeight: "700",
  },
  logoActions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  currencyOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  currencyOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  currencyText: {
    color: colors.text,
    fontWeight: "800",
  },
  currencyTextActive: {
    color: "#FFFFFF",
  },
  helperText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
