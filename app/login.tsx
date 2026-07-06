import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { login } from "../src/api/merchantApi";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { colors, spacing } from "../src/constants/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("tri.do@example.com");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing information", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      const success = await login(email, password);

      if (!success) {
        Alert.alert("Login failed", "Invalid demo credentials.");
        return;
      }

      await AsyncStorage.setItem("session", JSON.stringify({ email }));
      router.replace("/dashboard");
    } catch {
      Alert.alert("Error", "Something went wrong while logging in.");
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
          Merchant dashboard for products, orders, inventory, and insights.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <AppButton
          title={loading ? "Signing in..." : "Sign in"}
          onPress={handleLogin}
          disabled={loading}
        />

        <Text style={styles.demo}>Demo: tri.do@example.com / demo1234</Text>
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
  },
  demo: {
    color: colors.muted,
    marginTop: spacing.md,
    textAlign: "center",
  },
});