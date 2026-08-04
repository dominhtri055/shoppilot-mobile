import { Link, router, type Href } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing information", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      router.replace("/dashboard" as Href);
    } catch (error) {
      Alert.alert(
        "Login failed",
        error instanceof Error ? error.message : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Card>
        <Text style={styles.title}>ShopPilot Mobile</Text>
        <Text style={styles.subtitle}>
          Sign in to manage products, orders, inventory, and store insights.
        </Text>

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
          autoComplete="password"
          secureTextEntry
          placeholder="Enter your password"
          style={styles.input}
          onSubmitEditing={() => void handleLogin()}
        />

        <AppButton
          title={loading ? "Signing in..." : "Sign in"}
          onPress={() => void handleLogin()}
          disabled={loading}
        />

        <Text style={styles.footerText}>
          New merchant?{" "}
          <Link href={"/register" as Href} style={styles.link}>
            Create an account
          </Link>
        </Text>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
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
  footerText: {
    color: colors.muted,
    marginTop: spacing.md,
    textAlign: "center",
  },
  link: {
    color: colors.primary,
    fontWeight: "800",
  },
});
