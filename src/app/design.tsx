import { router, useNavigation, type Href } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { getProducts } from "../api/productApi";
import { getStoreDesign, saveStoreDesign } from "../api/storeThemeApi";
import { AppButton } from "../components/AppButton";
import { WebsitePreview } from "../components/WebsitePreview";
import { colors } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { useStoreSettings } from "../contexts/StoreSettingsContext";
import { restoreSession } from "../lib/supabaseAuth";
import type { Product } from "../types/commerce";
import {
  defaultTheme,
  isValidBanner,
  normalizeTheme,
  presets,
  type StoreTheme,
} from "../types/storeTheme";

type Panel = "Design" | "Content" | "Layout";
const labels = {
  hero: "Hero banner",
  products: "Collection",
  about: "Our story",
};

function confirmChange(message: string, action: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(message)) action();
  } else
    Alert.alert("Unsaved changes", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Continue", onPress: action },
    ]);
}

function Choices<T extends string | number>({
  label,
  value,
  choices,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  choices: { label: string; value: T }[];
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>
        {choices.map((choice) => (
          <Pressable
            key={choice.value}
            accessibilityRole="button"
            accessibilityState={{ selected: value === choice.value, disabled }}
            disabled={disabled}
            onPress={() => onChange(choice.value)}
            style={[styles.choice, value === choice.value && styles.selected]}
          >
            <Text
              style={[
                styles.choiceText,
                value === choice.value && styles.selectedText,
              ]}
            >
              {choice.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function WebsiteDesignScreen() {
  const { user } = useAuth();
  const { settings } = useStoreSettings();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [theme, setTheme] = useState<StoreTheme>(defaultTheme);
  const [saved, setSaved] = useState<StoreTheme>(defaultTheme);
  const [published, setPublished] = useState<StoreTheme | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [panel, setPanel] = useState<Panel>("Design");
  const [compact, setCompact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const dirty = JSON.stringify(theme) !== JSON.stringify(saved);
  const wide = width >= 1000;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setReady(false);
      setError("");
      try {
        const auth = await restoreSession();
        if (!auth || auth.user.id !== user?.id)
          throw new Error("Please sign in again to design your website.");
        const [design, items] = await Promise.all([
          getStoreDesign(auth.user.id, auth.access_token),
          getProducts(auth.access_token),
        ]);
        if (!active) return;
        setTheme(design.draft);
        setSaved(design.draft);
        setPublished(design.published);
        setProducts(
          items.filter((p) => p.status === "active" && p.inventory > 0),
        );
        setReady(true);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Could not load your design.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [user?.id, retry]);

  useEffect(() => {
    if (Platform.OS !== "web" || (!dirty && !busy)) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);

  usePreventRemove(dirty || busy, ({ data }) => {
    if (busy) return;
    confirmChange("Leave without saving your design?", () =>
      navigation.dispatch(data.action),
    );
  });

  function update<K extends keyof StoreTheme>(key: K, value: StoreTheme[K]) {
    setTheme((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  }
  async function save(publish: boolean) {
    if (
      !isValidBanner(theme.banner) ||
      !/^#[0-9a-f]{6}$/i.test(theme.accent) ||
      !/^#[0-9a-f]{6}$/i.test(theme.background)
    ) {
      setError(
        "Use six-digit hex colors (for example #174D3C) and a valid HTTPS banner URL.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const auth = await restoreSession();
      if (!auth || auth.user.id !== user?.id)
        throw new Error("Your session expired. Sign in again before saving.");
      const clean = await saveStoreDesign(
        auth.user.id,
        auth.access_token,
        theme,
        publish,
      );
      setTheme(clean);
      setSaved(clean);
      if (publish) setPublished(clean);
      setMessage(
        publish
          ? settings.isPublished
            ? "Design published. Your website now uses this design."
            : "Design published. Open Storefront publishing to make your store visible to customers."
          : "Draft saved. Your live website has not changed.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Your changes are still here; try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function move(index: number, direction: number) {
    const sections = [...theme.sections];
    [sections[index], sections[index + direction]] = [
      sections[index + direction],
      sections[index],
    ];
    update("sections", sections);
  }
  function textField(
    key: "announcement" | "heading" | "description" | "banner" | "about",
    label: string,
    maxLength: number,
    multiline = false,
  ) {
    return (
      <View style={styles.field} key={key}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          value={theme[key]}
          onChangeText={(value) => update(key, value)}
          editable={!busy}
          maxLength={maxLength}
          multiline={multiline}
          autoCapitalize={key === "banner" ? "none" : "sentences"}
          autoCorrect={key !== "banner"}
          placeholder={
            key === "banner" ? "https://example.com/banner.jpg" : label
          }
          placeholderTextColor={colors.muted}
          style={[styles.input, multiline && styles.textarea]}
        />
      </View>
    );
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text>Loading your design…</Text>
      </View>
    );
  if (!ready)
    return (
      <View style={styles.center}>
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
        <AppButton title="Try again" onPress={() => setRetry((v) => v + 1)} />
        <AppButton
          title="Back to dashboard"
          variant="secondary"
          onPress={() => router.replace("/dashboard")}
        />
      </View>
    );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Design your website</Text>
          <Text style={styles.muted}>
            {settings.storeName} · {dirty ? "Unsaved changes" : "Draft saved"}
          </Text>
        </View>
        <View style={styles.choices}>
          <AppButton
            title={busy ? "Saving…" : "Save draft"}
            variant="secondary"
            onPress={() => void save(false)}
            disabled={busy}
          />
          <AppButton
            title="Publish design"
            onPress={() => void save(true)}
            disabled={busy}
          />
        </View>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {message}
        </Text>
      ) : null}
      {!settings.isPublished ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Your store is private. You can design and save it before making it
            public.
          </Text>
          <AppButton
            title="Storefront publishing"
            variant="secondary"
            disabled={busy}
            onPress={() => router.push("/storefront" as Href)}
          />
        </View>
      ) : null}
      <View style={[styles.workspace, wide && styles.horizontal]}>
        <View style={[styles.controls, wide && styles.controlsWide]}>
          <Choices
            label="Editor panels"
            value={panel}
            choices={(["Design", "Content", "Layout"] as Panel[]).map(
              (value) => ({ label: value, value }),
            )}
            onChange={setPanel}
            disabled={busy}
          />
          {panel === "Design" ? (
            <>
              <Text style={styles.panelTitle}>Choose a starting style</Text>
              {Object.entries(presets).map(([name, preset]) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => {
                    setTheme((t) => ({ ...t, ...preset }));
                    setMessage("");
                  }}
                  style={styles.preset}
                >
                  <View
                    style={[styles.swatch, { backgroundColor: preset.accent }]}
                  />
                  <Text style={styles.label}>{name}</Text>
                </Pressable>
              ))}
              {(["accent", "background"] as const).map((key) => (
                <View style={styles.field} key={key}>
                  <Text style={styles.label}>
                    {key === "accent" ? "Brand color" : "Page background"}
                  </Text>
                  <View style={styles.colorRow}>
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: normalizeTheme(theme)[key] },
                      ]}
                    />
                    <TextInput
                      accessibilityLabel={
                        key === "accent" ? "Brand color" : "Page background"
                      }
                      editable={!busy}
                      style={[styles.input, styles.flex]}
                      value={theme[key]}
                      onChangeText={(v) => update(key, v)}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={7}
                    />
                  </View>
                </View>
              ))}
              <Choices
                label="Font"
                value={theme.font}
                choices={[
                  { label: "Modern sans", value: "sans" },
                  { label: "Editorial serif", value: "serif" },
                ]}
                onChange={(v) => update("font", v)}
                disabled={busy}
              />
              <Choices
                label="Card corners"
                value={theme.corners}
                choices={[
                  { label: "Soft", value: "soft" },
                  { label: "Square", value: "square" },
                ]}
                onChange={(v) => update("corners", v)}
                disabled={busy}
              />
            </>
          ) : panel === "Content" ? (
            <>
              <Text style={styles.panelTitle}>Make it your own</Text>
              {textField("announcement", "Announcement bar", 160)}
              {textField("heading", "Hero headline", 120)}
              {textField("description", "Hero description", 500, true)}
              {textField("banner", "Banner image URL (HTTPS)", 2048)}
              {textField("about", "Our story", 2000, true)}
              <AppButton
                title="Edit store name and logo"
                variant="secondary"
                disabled={busy}
                onPress={() => router.push("/settings" as Href)}
              />
            </>
          ) : (
            <>
              <Text style={styles.panelTitle}>Arrange your page</Text>
              <Choices
                label="Hero layout"
                value={theme.layout}
                choices={[
                  { label: "Split", value: "split" },
                  { label: "Centered", value: "centered" },
                ]}
                onChange={(v) => update("layout", v)}
                disabled={busy}
              />
              <Choices
                label="Desktop product columns"
                value={theme.columns}
                choices={([2, 3, 4] as const).map((value) => ({
                  label: String(value),
                  value,
                }))}
                onChange={(v) => update("columns", v)}
                disabled={busy}
              />
              {theme.sections.map((section, i) => (
                <View style={styles.sectionRow} key={section}>
                  <Text style={[styles.label, styles.flex]}>
                    {labels[section]}
                  </Text>
                  <AppButton
                    title="↑"
                    accessibilityLabel={`Move ${labels[section]} up`}
                    onPress={() => move(i, -1)}
                    variant="secondary"
                    disabled={busy || i === 0}
                  />
                  <AppButton
                    title="↓"
                    accessibilityLabel={`Move ${labels[section]} down`}
                    onPress={() => move(i, 1)}
                    variant="secondary"
                    disabled={busy || i === theme.sections.length - 1}
                  />
                </View>
              ))}
              {(["showHero", "showAbout", "showInventory"] as const).map(
                (key, i) => (
                  <View key={key} style={styles.sectionRow}>
                    <Text style={[styles.label, styles.flex]}>
                      {
                        [
                          "Show hero banner",
                          "Show our story",
                          "Show stock counts",
                        ][i]
                      }
                    </Text>
                    <Switch
                      accessibilityLabel={
                        [
                          "Show hero banner",
                          "Show our story",
                          "Show stock counts",
                        ][i]
                      }
                      value={theme[key]}
                      onValueChange={(value) => update(key, value)}
                      disabled={busy}
                    />
                  </View>
                ),
              )}
            </>
          )}
          <View style={styles.reset}>
            <AppButton
              title="Reset design"
              variant="secondary"
              disabled={busy}
              onPress={() =>
                confirmChange(
                  "Replace your draft with the default design?",
                  () => {
                    setTheme(defaultTheme);
                    setMessage("");
                  },
                )
              }
            />
            {published ? (
              <AppButton
                title="Restore published design"
                variant="secondary"
                disabled={busy}
                onPress={() =>
                  confirmChange(
                    "Replace your draft with the published design?",
                    () => {
                      setTheme(published);
                      setMessage("");
                    },
                  )
                }
              />
            ) : null}
          </View>
        </View>
        <View style={styles.previewColumn}>
          <Choices
            label="Live preview"
            value={compact ? "mobile" : "desktop"}
            choices={[
              { label: "Desktop", value: "desktop" },
              { label: "Mobile", value: "mobile" },
            ]}
            onChange={(value) => setCompact(value === "mobile")}
            disabled={false}
          />
          <Text style={styles.previewNote}>
            Preview updates as you edit. Active, in-stock products appear even
            while your store is private.
          </Text>
          {!wide && !compact ? (
            <ScrollView horizontal>
              <View style={[styles.preview, { width: 760 }]}>
                <WebsitePreview
                  theme={normalizeTheme(theme)}
                  settings={settings}
                  products={products}
                  compact={false}
                />
              </View>
            </ScrollView>
          ) : (
            <View style={[styles.preview, compact && styles.mobilePreview]}>
              <WebsitePreview
                theme={normalizeTheme(theme)}
                settings={settings}
                products={products}
                compact={compact}
              />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    width: "100%",
    maxWidth: 1600,
    alignSelf: "center",
    padding: 20,
    gap: 20,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  top: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  titleBlock: { gap: 6 },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 14 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: "#EFF6FF", borderColor: colors.primary },
  choiceText: { color: colors.text, fontSize: 14 },
  selectedText: { color: colors.primary, fontWeight: "700" },
  error: {
    color: "#991B1B",
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
  },
  message: {
    color: "#166534",
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
  },
  notice: {
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: "flex-start",
  },
  noticeText: { color: "#1E3A8A", fontSize: 14, lineHeight: 22 },
  workspace: { gap: 24 },
  horizontal: { flexDirection: "row", alignItems: "flex-start" },
  controls: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlsWide: { width: 350 },
  field: { gap: 8 },
  label: { color: colors.text, fontSize: 14, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    minHeight: 46,
  },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  flex: { flex: 1 },
  panelTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  preset: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#94A3B8",
  },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reset: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewColumn: { flex: 1, gap: 14, minWidth: 0 },
  previewNote: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  preview: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    width: "100%",
  },
  mobilePreview: { maxWidth: 390, alignSelf: "center" },
});
