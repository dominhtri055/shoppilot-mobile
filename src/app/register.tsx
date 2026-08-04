import { router, type Href } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";
import {
  AuthField,
  AuthLayout,
  AuthMessage,
  AuthPrimaryButton,
} from "../components/AuthLayout";
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
    <AuthLayout
      mode="register"
      title="Create Account"
      formHint="or use your email for registration"
      panelTitle="Welcome Back!"
      panelDescription="Already have an account? Sign in with your details to continue managing your ShopPilot store."
      switchLabel="Sign In"
      onSwitch={goToLogin}
    >
      <AuthField
        label="Full name"
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
        placeholder="Your name"
      />

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
        autoComplete="new-password"
        secureTextEntry
        placeholder="At least 6 characters"
      />

      <AuthField
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        secureTextEntry
        placeholder="Re-enter your password"
        onSubmitEditing={() => void handleRegister()}
      />

      {errorMessage ? (
        <AuthMessage type="error">{errorMessage}</AuthMessage>
      ) : null}
      {successMessage ? (
        <AuthMessage type="success">{successMessage}</AuthMessage>
      ) : null}

      <AuthPrimaryButton
        title={loading ? "Creating account..." : "Sign up"}
        onPress={() => void handleRegister()}
        disabled={loading}
      />
    </AuthLayout>
  );
}
