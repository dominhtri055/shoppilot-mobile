import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SocialProvider } from "../lib/socialAuth";

const providerLabels: Record<SocialProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  linkedin_oidc: "LinkedIn",
};

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
    <View style={styles.container}>
      {(
        ["google", "facebook", "linkedin_oidc"] as SocialProvider[]
      ).map((provider) => {
        const loading = loadingProvider === provider;

        return (
          <Pressable
            key={provider}
            accessibilityRole="button"
            accessibilityLabel={`Continue with ${providerLabels[provider]}`}
            disabled={disabled}
            onPress={() => onPress(provider)}
            style={({ pressed }) => [
              styles.button,
              pressed && !disabled && styles.buttonPressed,
              disabled && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {loading
                ? `Connecting to ${providerLabels[provider]}...`
                : `Continue with ${providerLabels[provider]}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 10,
    marginBottom: 18,
  },
  button: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  buttonPressed: {
    backgroundColor: "#F3F4F6",
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#242424",
    fontSize: 14,
    fontWeight: "800",
  },
});
