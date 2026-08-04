import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
} from "react-native";

const authColors = {
  pageStart: "#E2E2E2",
  pageEnd: "#E9D6FF",
  surface: "#FFFFFF",
  input: "#EEEEEE",
  text: "#242424",
  muted: "#6B7280",
  purple: "#512DA8",
  purpleDark: "#3F2185",
  white: "#FFFFFF",
  border: "#D1D5DB",
  danger: "#B91C1C",
  dangerBackground: "#FEE2E2",
  success: "#166534",
  successBackground: "#DCFCE7",
};

type AuthLayoutProps = PropsWithChildren<{
  mode: "login" | "register";
  title: string;
  formHint: string;
  panelTitle: string;
  panelDescription: string;
  switchLabel: string;
  onSwitch: () => void;
}>;

type AuthFieldProps = TextInputProps & {
  label: string;
};

type AuthPrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

type AuthMessageProps = {
  type: "error" | "success";
  children: ReactNode;
};

export function AuthLayout({
  mode,
  title,
  formHint,
  panelTitle,
  panelDescription,
  switchLabel,
  onSwitch,
  children,
}: AuthLayoutProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 820;

  const formPanel = (
    <View
      style={[
        styles.formPanel,
        isDesktop ? styles.desktopPanel : styles.mobileFormPanel,
      ]}
    >
      <View style={styles.formContent}>
        <Text style={styles.formTitle}>{title}</Text>
        <View style={styles.socialRow} accessibilityLabel="Social login options">
          {[
            { label: "G", accessibilityLabel: "Google" },
            { label: "f", accessibilityLabel: "Facebook" },
            { label: "GH", accessibilityLabel: "GitHub" },
            { label: "in", accessibilityLabel: "LinkedIn" },
          ].map((item) => (
            <View
              key={item.accessibilityLabel}
              style={styles.socialIcon}
              accessibilityLabel={`${item.accessibilityLabel} login coming soon`}
            >
              <Text style={styles.socialIconText}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.formHint}>{formHint}</Text>
        {children}
      </View>
    </View>
  );

  const togglePanel = (
    <View
      style={[
        styles.togglePanel,
        isDesktop ? styles.desktopPanel : styles.mobileTogglePanel,
        isDesktop &&
          (mode === "login"
            ? styles.togglePanelRight
            : styles.togglePanelLeft),
      ]}
    >
      <View style={styles.toggleGlowTop} />
      <View style={styles.toggleGlowBottom} />
      <Text style={styles.brand}>SHOPPILOT</Text>
      <Text style={styles.panelTitle}>{panelTitle}</Text>
      <Text style={styles.panelDescription}>{panelDescription}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onSwitch}
        style={({ pressed }) => [
          styles.switchButton,
          pressed && styles.switchButtonPressed,
        ]}
      >
        <Text style={styles.switchButtonText}>{switchLabel}</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.page}>
          <View style={styles.pageGlowLeft} />
          <View style={styles.pageGlowRight} />
          <View
            style={[
              styles.card,
              isDesktop ? styles.desktopCard : styles.mobileCard,
            ]}
          >
            {isDesktop ? (
              mode === "login" ? (
                <>
                  {formPanel}
                  {togglePanel}
                </>
              ) : (
                <>
                  {togglePanel}
                  {formPanel}
                </>
              )
            ) : (
              <>
                {togglePanel}
                {formPanel}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthField({ label, style, ...props }: AuthFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#8A8A8A"
        selectionColor={authColors.purple}
        style={[styles.input, style]}
      />
    </View>
  );
}

export function AuthPrimaryButton({
  title,
  onPress,
  disabled = false,
}: AuthPrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && !disabled && styles.primaryButtonPressed,
        disabled && styles.primaryButtonDisabled,
      ]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function AuthMessage({ type, children }: AuthMessageProps) {
  return (
    <View
      style={[
        styles.message,
        type === "error" ? styles.errorMessage : styles.successMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          type === "error" ? styles.errorText : styles.successText,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  textLink: {
    alignSelf: "center",
    color: authColors.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 4,
    padding: 4,
  },
});

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
    minHeight: 620,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 20,
    backgroundColor: authColors.pageEnd,
  },
  pageGlowLeft: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    left: -190,
    top: -150,
    backgroundColor: authColors.pageStart,
    opacity: 0.85,
  },
  pageGlowRight: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    right: -170,
    bottom: -160,
    backgroundColor: "#C9D6FF",
    opacity: 0.7,
  },
  card: {
    width: "100%",
    backgroundColor: authColors.surface,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  desktopCard: {
    maxWidth: 900,
    minHeight: 560,
    flexDirection: "row",
  },
  mobileCard: {
    maxWidth: 460,
  },
  desktopPanel: {
    width: "50%",
    minHeight: 560,
  },
  formPanel: {
    backgroundColor: authColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileFormPanel: {
    width: "100%",
    paddingVertical: 34,
  },
  formContent: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    paddingHorizontal: 32,
  },
  formTitle: {
    color: authColors.text,
    fontSize: 31,
    fontWeight: "900",
    textAlign: "center",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
    marginTop: 18,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: authColors.border,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: authColors.surface,
  },
  socialIconText: {
    color: authColors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  formHint: {
    color: authColors.muted,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    color: authColors.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: authColors.input,
    color: authColors.text,
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "transparent",
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: authColors.purple,
    paddingHorizontal: 34,
    marginTop: 6,
  },
  primaryButtonPressed: {
    backgroundColor: authColors.purpleDark,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: authColors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  togglePanel: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: authColors.purple,
    paddingHorizontal: 38,
    paddingVertical: 42,
  },
  togglePanelRight: {
    borderTopLeftRadius: 140,
    borderBottomLeftRadius: 100,
  },
  togglePanelLeft: {
    borderTopRightRadius: 140,
    borderBottomRightRadius: 100,
  },
  mobileTogglePanel: {
    width: "100%",
    minHeight: 265,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
  },
  toggleGlowTop: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -100,
    top: -105,
    backgroundColor: "#7654C5",
    opacity: 0.45,
  },
  toggleGlowBottom: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    left: -80,
    bottom: -95,
    backgroundColor: "#2E176E",
    opacity: 0.4,
  },
  brand: {
    color: "#DCD2FF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.4,
    marginBottom: 18,
  },
  panelTitle: {
    color: authColors.white,
    fontSize: 31,
    fontWeight: "900",
    textAlign: "center",
  },
  panelDescription: {
    color: "#F0ECFF",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
    marginTop: 16,
    maxWidth: 300,
    textAlign: "center",
  },
  switchButton: {
    minWidth: 150,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: authColors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  switchButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.16)",
    transform: [{ scale: 0.98 }],
  },
  switchButtonText: {
    color: authColors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  message: {
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorMessage: {
    backgroundColor: authColors.dangerBackground,
  },
  successMessage: {
    backgroundColor: authColors.successBackground,
  },
  messageText: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  errorText: {
    color: authColors.danger,
  },
  successText: {
    color: authColors.success,
  },
});
