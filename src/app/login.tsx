import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, Text } from "react-native";
import {
  AuthField,
  AuthLayout,
  AuthMessage,
  AuthPrimaryButton,
  authStyles,
} from "../components/AuthLayout";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin() {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      router.replace("/dashboard" as Href);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  function goToRegister() {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.assign("/register");
      return;
    }

    router.push("/register" as Href);
  }

  function showPasswordResetInfo() {
    Alert.alert(
      "Password reset",
      "Password reset will be added in the next authentication update."
    );
  }

  return (
    <AuthLayout
      mode="login"
      title="Sign In"
      formHint="or use your email and password"
      panelTitle="Hello, Friend!"
      panelDescription="Register with your details to start managing products, orders, inventory, and store insights."
      switchLabel="Sign Up"
      onSwitch={goToRegister}
    >
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="merchant@example.com"
      />

      <AuthField
        label="Password"
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoComplete="password"
        secureTextEntry
        placeholder="Enter your password"
        onSubmitEditing={() => void handleLogin()}
      />

      {errorMessage ? (
        <AuthMessage type="error">{errorMessage}</AuthMessage>
      ) : null}

      <Pressable onPress={showPasswordResetInfo} accessibilityRole="button">
        <Text style={authStyles.textLink}>Forgot your password?</Text>
      </Pressable>

      <AuthPrimaryButton
        title={loading ? "Signing in..." : "Sign in"}
        onPress={() => void handleLogin()}
        disabled={loading}
      />
    </AuthLayout>
  );
}
