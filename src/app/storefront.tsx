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

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function StorefrontPublishingScreen() {
  const { session, user } = useAuth();
  const { settings, replaceSettings } = useStoreSettings();
  const [storeSlug, setStoreSlug] = useState(settings.storeSlug);
  const [isPublished, setIsPublished] = useState(settings.isPublished);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setStoreSlug(settings.storeSlug);
    setIsPublished(settings.isPublished);
  }, [settings.isPublished, settings.storeSlug]);

  async function handleSave() {
    setErrorMessage(null);

    if (!session?.access_token || !user?.id) {
      setErrorMessage("Your session has expired. Please sign in again.");
      return;
    }

    const normalizedSlug = normalizeSlug(storeSlug);

    if (
      normalizedSlug.length < 3 ||
      normalizedSlug.length > 60 ||
      !SLUG_PATTERN.test(normalizedSlug)
    ) {
      setErrorMessage(
        "Store slug must be 3–60 characters using lowercase letters, numbers, and single hyphens.",
      );
      return;
    }

    try {
      setSaving(true);
      const updated = await updateStoreSettings(
        user.id,
        {
          storeName: settings.storeName,
          businessEmail: settings.businessEmail,
          description: settings.description,
          currency: settings.currency,
          lowStockThreshold: settings.lowStockThreshold,
          logoPath: settings.logoPath,
          storeSlug: normalizedSlug,
          isPublished,
        },
        session.access_token,
      );

      replaceSettings(updated);
      router.back();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Storefront settings could not be saved.",
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
          <Text style={styles.title}>Storefront publishing</Text>
          <Text style={styles.subtitle}>
            Control the public URL and whether customers can access this store.
          </Text>

          <Text style={styles.label}>Store slug</Text>
          <TextInput
            value={storeSlug}
            onChangeText={(value) => setStoreSlug(normalizeSlug(value))}
            placeholder="tri-store"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
            maxLength={60}
            style={styles.input}
          />
          <Text style={styles.helperText}>
            Public route: /shop/{storeSlug || "your-store"}
          </Text>

          <Text style={styles.label}>Publication status</Text>
          <View style={styles.statusRow}>
            <Pressable
              onPress={() => setIsPublished(false)}
              disabled={saving}
              style={[
                styles.statusOption,
                !isPublished && styles.statusOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  !isPublished && styles.statusTextActive,
                ]}
              >
                Unpublished
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setIsPublished(true)}
              disabled={saving}
              style={[
                styles.statusOption,
                isPublished && styles.statusOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isPublished && styles.statusTextActive,
                ]}
              >
                Published
              </Text>
            </Pressable>
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>
              {isPublished ? "Store will be public" : "Store will stay private"}
            </Text>
            <Text style={styles.noticeText}>
              {isPublished
                ? "Customers can read your store profile and active products that are in stock."
                : "Public storefront APIs return no store or product data until you publish."}
            </Text>
          </View>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <AppButton
              title={saving ? "Saving..." : "Save storefront settings"}
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
  helperText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statusOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  statusOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusText: {
    color: colors.text,
    fontWeight: "800",
  },
  statusTextActive: {
    color: "#FFFFFF",
  },
  notice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.background,
  },
  noticeTitle: {
    color: colors.text,
    fontWeight: "900",
    marginBottom: spacing.xs,
  },
  noticeText: {
    color: colors.muted,
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
