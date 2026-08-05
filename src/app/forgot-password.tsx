import * as Linking from "expo-linking";
import { router, type Href } from "expo-router";
import { useState } from "react";
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
import { requestPasswordReset } from "../lib/supabaseAuth";

function getUpdatePasswordUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/update-password`;
  }

  return Linking.createURL("update-password");
}

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await requestPasswordReset(
        email,
        getUpdatePasswordUrl()
      );

      setSuccessMessage(
        "If an account exists for this email, a password reset link has been sent."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send password reset email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>

        <Text style={styles.description}>
          Enter your account email and we will send you a password reset link.
        </Text>

        <AuthField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="account@example.com"
          editable={!loading}
          onSubmitEditing={() => void handleResetPassword()}
        />

        {errorMessage ? (
          <AuthMessage type="error">
            {errorMessage}
          </AuthMessage>
        ) : null}

        {successMessage ? (
          <AuthMessage type="success">
            {successMessage}
          </AuthMessage>
        ) : null}

        <AuthPrimaryButton
          title={loading ? "Sending..." : "Send reset link"}
          onPress={() => void handleResetPassword()}
          disabled={loading}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/login" as Href)}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back to Sign In</Text>
        </Pressable>
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
    textAlign: "center",
  },
  description: {
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 24,
    marginTop: 12,
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