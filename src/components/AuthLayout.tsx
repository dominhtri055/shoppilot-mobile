import {
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Easing,
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

const AUTH_SWITCH_DURATION = 620;

type AuthMode = "login" | "register";

type AuthLayoutProps = {
  loginForm: ReactNode;
  registerForm: ReactNode;
  initialMode?: AuthMode;
};

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
  loginForm,
  registerForm,
  initialMode = "login",
}: AuthLayoutProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 820;
  const initialProgress = initialMode === "login" ? 0 : 1;
  const progress = useRef(new Animated.Value(initialProgress)).current;
  const mobileOpacity = useRef(new Animated.Value(1)).current;
  const [activeMode, setActiveMode] = useState<AuthMode>(initialMode);
  const [isSwitching, setIsSwitching] = useState(false);

  const cardWidth = Math.min(Math.max(width - 40, 0), 900);
  const panelDistance = cardWidth / 2;

  function switchMode(targetMode: AuthMode) {
    if (isSwitching || targetMode === activeMode) {
      return;
    }

    setIsSwitching(true);

    if (!isDesktop) {
      Animated.timing(mobileOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          mobileOpacity.setValue(1);
          setIsSwitching(false);
          return;
        }

        setActiveMode(targetMode);
        progress.setValue(targetMode === "login" ? 0 : 1);

        Animated.timing(mobileOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setIsSwitching(false));
      });
      return;
    }

    Animated.timing(progress, {
      toValue: targetMode === "login" ? 0 : 1,
      duration: AUTH_SWITCH_DURATION,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setActiveMode(targetMode);
      }

      setIsSwitching(false);
    });
  }

  const loginFormStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 0.42, 0.58, 1],
      outputRange: [1, 0.45, 0, 0],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, panelDistance],
        }),
      },
    ],
  };

  const registerFormStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 0.42, 0.58, 1],
      outputRange: [0, 0, 0.45, 1],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, panelDistance],
        }),
      },
    ],
  };

  const togglePanelStyle = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -panelDistance],
        }),
      },
      {
        scale: progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.025, 1],
        }),
      },
    ],
  };

  const loginPanelContentStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 0.38, 0.58, 1],
      outputRange: [1, 0.25, 0, 0],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 180],
        }),
      },
    ],
  };

  const registerPanelContentStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 0.42, 0.62, 1],
      outputRange: [0, 0, 0.25, 1],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-180, 0],
        }),
      },
    ],
  };

  const loginFormPanel = (
    <FormPanel title="Sign In" hint="or use your email and password">
      {loginForm}
    </FormPanel>
  );

  const registerFormPanel = (
    <FormPanel title="Create Account" hint="or use your email for registration">
      {registerForm}
    </FormPanel>
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

          {isDesktop ? (
            <View style={[styles.card, styles.desktopCard]}>
              <Animated.View
                pointerEvents={
                  activeMode === "login" && !isSwitching ? "auto" : "none"
                }
                style={[
                  styles.desktopFormLayer,
                  styles.formPanel,
                  loginFormStyle,
                ]}
              >
                {loginFormPanel}
              </Animated.View>

              <Animated.View
                pointerEvents={
                  activeMode === "register" && !isSwitching ? "auto" : "none"
                }
                style={[
                  styles.desktopFormLayer,
                  styles.formPanel,
                  registerFormStyle,
                ]}
              >
                {registerFormPanel}
              </Animated.View>

              <Animated.View
                style={[
                  styles.desktopTogglePanel,
                  styles.togglePanel,
                  togglePanelStyle,
                ]}
              >
                <View style={styles.toggleGlowTop} />
                <View style={styles.toggleGlowBottom} />

                <Animated.View
                  pointerEvents={activeMode === "login" ? "auto" : "none"}
                  style={[styles.panelContent, loginPanelContentStyle]}
                >
                  <PanelCopy
                    title="Hello, Friend!"
                    description="Register with your details to start managing products, orders, inventory, and store insights."
                    buttonLabel="Sign Up"
                    disabled={isSwitching}
                    onPress={() => switchMode("register")}
                  />
                </Animated.View>

                <Animated.View
                  pointerEvents={activeMode === "register" ? "auto" : "none"}
                  style={[styles.panelContent, registerPanelContentStyle]}
                >
                  <PanelCopy
                    title="Welcome Back!"
                    description="Already have an account? Sign in with your details to continue managing your ShopPilot store."
                    buttonLabel="Sign In"
                    disabled={isSwitching}
                    onPress={() => switchMode("login")}
                  />
                </Animated.View>
              </Animated.View>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.card,
                styles.mobileCard,
                {
                  opacity: mobileOpacity,
                  transform: [
                    {
                      translateY: mobileOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.togglePanel, styles.mobileTogglePanel]}>
                <View style={styles.toggleGlowTop} />
                <View style={styles.toggleGlowBottom} />
                {activeMode === "login" ? (
                  <PanelCopy
                    title="Hello, Friend!"
                    description="Register with your details to start managing your ShopPilot store."
                    buttonLabel="Sign Up"
                    disabled={isSwitching}
                    onPress={() => switchMode("register")}
                  />
                ) : (
                  <PanelCopy
                    title="Welcome Back!"
                    description="Already have an account? Sign in to continue managing your ShopPilot store."
                    buttonLabel="Sign In"
                    disabled={isSwitching}
                    onPress={() => switchMode("login")}
                  />
                )}
              </View>

              <View style={[styles.formPanel, styles.mobileFormPanel]}>
                {activeMode === "login" ? loginFormPanel : registerFormPanel}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormPanel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
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
      <Text style={styles.formHint}>{hint}</Text>
      {children}
    </View>
  );
}

function PanelCopy({
  title,
  description,
  buttonLabel,
  onPress,
  disabled,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.panelCopy}>
      <Text style={styles.brand}>SHOPPILOT</Text>
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelDescription}>{description}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.switchButton,
          pressed && !disabled && styles.switchButtonPressed,
          disabled && styles.switchButtonDisabled,
        ]}
      >
        <Text style={styles.switchButtonText}>
          {disabled ? "Switching..." : buttonLabel}
        </Text>
      </Pressable>
    </View>
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
    minHeight: 660,
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
    position: "relative",
    maxWidth: 900,
    height: 600,
  },
  mobileCard: {
    maxWidth: 460,
  },
  desktopFormLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "50%",
    height: "100%",
  },
  formPanel: {
    zIndex: 1,
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
  desktopTogglePanel: {
    position: "absolute",
    left: "50%",
    top: 0,
    width: "50%",
    height: "100%",
  },
  togglePanel: {
    zIndex: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: authColors.purple,
  },
  mobileTogglePanel: {
    width: "100%",
    minHeight: 265,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    paddingHorizontal: 38,
    paddingVertical: 42,
  },
  panelContent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 38,
    paddingVertical: 42,
  },
  panelCopy: {
    alignItems: "center",
    justifyContent: "center",
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
  switchButtonDisabled: {
    opacity: 0.7,
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
