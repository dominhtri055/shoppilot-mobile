import { router, type Href } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleRegister() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage("Please complete every field.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const result = await signUp(fullName, email, password);

      if (result.session) {
        router.replace("/dashboard" as Href);
        return;
      }

      setSuccessMessage(
        "Account created. Check your email to confirm it, then sign in."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.assign("/login");
      return;
    }

    router.replace("/login" as Href);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
      >
        <Card>
          <Text style={styles.title}>Create merchant account</Text>
          <Text style={styles.subtitle}>
            Use this account to access ShopPilot.
          </Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
            placeholder="Tri Do"
            style={styles.input}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="merchant@example.com"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            placeholder="At least 6 characters"
            style={styles.input}
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            placeholder="Re-enter your password"
            style={styles.input}
            onSubmitEditing={() => void handleRegister()}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}

          <AppButton
            title={loading ? "Creating account..." : "Create account"}
            onPress={() => void handleRegister()}
            disabled={loading}
          />

          <Text style={styles.footerText}>Already registered?</Text>
          <AppButton
            title="Sign in"
            onPress={goToLogin}
            variant="secondary"
          />
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
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  label: {
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.text,
  },
  errorText: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.success,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  footerText: {
    color: colors.muted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
});
