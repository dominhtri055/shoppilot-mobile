import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SocialProvider } from "../lib/socialAuth";

const providers: Array<{
  provider: SocialProvider;
  icon: string;
  label: string;
}> = [
  { provider: "google", icon: "G", label: "Google" },
  { provider: "facebook", icon: "f", label: "Facebook" },
  { provider: "linkedin_oidc", icon: "in", label: "LinkedIn" },
];

type Props = {
  loadingProvider: SocialProvider | null;
  disabled?: boolean;
  onPress: (provider: SocialProvider) => void;
};

export function SocialAuthButtons({
  loadingProvider,
  disabled = false,
  onPress,
}: Props) {
  return (
    <View style={styles.container} accessibilityLabel="Social login options">
      {providers.map(({ provider, icon, label }) => {
        const loading = loadingProvider === provider;

        return (
          <Pressable
            key={provider}
            accessibilityRole="button"
            accessibilityLabel={`Continue with ${label}`}
            disabled={disabled}
            onPress={() => onPress(provider)}
            style={({ pressed }) => [
              styles.button,
              pressed && !disabled && styles.buttonPressed,
              disabled && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.icon}>{loading ? "…" : icon}</Text>
            <Text numberOfLines={1} style={styles.label}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 55,
    left: 32,
    right: 32,
    zIndex: 20,
    flexDirection: "row",
    gap: 7,
    backgroundColor: "#FFFFFF",
  },
  button: {
    flex: 1,
    minWidth: 0,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 7,
  },
  buttonPressed: {
    backgroundColor: "#F3F4F6",
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  icon: {
    color: "#242424",
    fontSize: 13,
    fontWeight: "900",
  },
  label: {
    flexShrink: 1,
    color: "#242424",
    fontSize: 11,
    fontWeight: "800",
  },
});
