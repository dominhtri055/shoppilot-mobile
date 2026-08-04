import { router, type Href } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const { completeSocialSignIn } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function finishAuthentication() {
      try {
        const callbackUrl =
          Platform.OS === "web" && typeof window !== "undefined"
            ? window.location.href
            : await Linking.getInitialURL();

        if (!callbackUrl) {
          throw new Error("The OAuth callback URL is missing.");
        }

        await completeSocialSignIn(callbackUrl);

        if (active) {
          router.replace("/dashboard" as Href);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Social authentication could not be completed."
          );
        }
      }
    }

    void finishAuthentication();

    return () => {
      active = false;
    };
  }, [completeSocialSignIn]);

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <>
          <Text style={styles.title}>Login failed</Text>
          <Text style={styles.error}>{errorMessage}</Text>
          <Text style={styles.help}>
            Return to the login screen and try again.
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.title}>Completing sign in...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    fontWeight: "700",
    textAlign: "center",
  },
  help: {
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
