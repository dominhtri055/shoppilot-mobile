import * as Linking from "expo-linking";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AuthField,
  AuthMessage,
  AuthPrimaryButton,
} from "../components/AuthLayout";
import { updatePasswordWithRecoveryToken } from "../lib/supabaseAuth";

function parseParameterPart(part: string) {
  const params: Record<string, string> = {};

  part
    .replace(/^[?#]/, "")
    .split("&")
    .filter(Boolean)
    .forEach((entry) => {
      const separatorIndex = entry.indexOf("=");

      const rawKey =
        separatorIndex >= 0
          ? entry.slice(0, separatorIndex)
          : entry;

      const rawValue =
        separatorIndex >= 0
          ? entry.slice(separatorIndex + 1)
          : "";

      params[decodeURIComponent(rawKey)] =
        decodeURIComponent(
          rawValue.replace(/\+/g, " ")
        );
    });

  return params;
}

function parseRecoveryUrl(url: string) {
  const questionIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");

  const query =
    questionIndex >= 0
      ? url.slice(
          questionIndex + 1,
          hashIndex >= 0 ? hashIndex : undefined
        )
      : "";

  const hash =
    hashIndex >= 0
      ? url.slice(hashIndex + 1)
      : "";

  return {
    ...parseParameterPart(query),
    ...parseParameterPart(hash),
  };
}

export default function UpdatePasswordScreen() {
  const [accessToken, setAccessToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRecoveryToken() {
      const callbackUrl =
        Platform.OS === "web" &&
        typeof window !== "undefined"
          ? window.location.href
          : await Linking.getInitialURL();

      if (!active) {
        return;
      }

      if (!callbackUrl) {
        setErrorMessage(
          "The password reset link is missing or invalid."
        );
        return;
      }

      const params = parseRecoveryUrl(callbackUrl);

      if (params.error_description || params.error) {
        setErrorMessage(
          params.error_description ||
            params.error ||
            "The password reset link is invalid."
        );
        return;
      }

      if (
        params.type !== "recovery" ||
        !params.access_token
      ) {
        setErrorMessage(
          "The password reset link is invalid or has expired."
        );
        return;
      }

      setAccessToken(params.access_token);
    }

    void loadRecoveryToken();

    return () => {
      active = false;
    };
  }, []);

  async function handleUpdatePassword() {
    setErrorMessage("");

    if (!accessToken) {
      setErrorMessage(
        "The password reset link is invalid or has expired."
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await updatePasswordWithRecoveryToken(
        accessToken,
        newPassword
      );

      setUpdated(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          Create New Password
        </Text>

        {updated ? (
          <>
            <AuthMessage type="success">
              Your password has been updated successfully.
            </AuthMessage>

            <AuthPrimaryButton
              title="Back to Sign In"
              onPress={() =>
                router.replace("/login" as Href)
              }
            />
          </>
        ) : (
          <>
            <Text style={styles.description}>
              Enter and confirm your new password.
            </Text>

            <AuthField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              secureTextEntry
              placeholder="At least 6 characters"
              editable={!loading}
            />

            <AuthField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              secureTextEntry
              placeholder="Re-enter your password"
              editable={!loading}
              onSubmitEditing={() =>
                void handleUpdatePassword()
              }
            />

            {errorMessage ? (
              <AuthMessage type="error">
                {errorMessage}
              </AuthMessage>
            ) : null}

            <AuthPrimaryButton
              title={
                loading
                  ? "Updating..."
                  : "Update password"
              }
              onPress={() =>
                void handleUpdatePassword()
              }
              disabled={loading || !accessToken}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.replace("/login" as Href)
              }
              style={styles.backButton}
            >
              <Text style={styles.backText}>
                Back to Sign In
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#E9D6FF",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
  },
  title: {
    color: "#242424",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    alignSelf: "center",
    marginTop: 18,
    padding: 6,
  },
  backText: {
    color: "#512DA8",
    fontWeight: "800",
  },
});