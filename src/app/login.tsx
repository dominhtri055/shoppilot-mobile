import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import {
  AuthField,
  AuthLayout,
  AuthMessage,
  AuthPrimaryButton,
  authStyles,
} from "../components/AuthLayout";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  async function handleLogin() {
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    try {
      setLoginLoading(true);
      await signIn(loginEmail, loginPassword);
      router.replace("/dashboard" as Href);
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Unable to sign in."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister() {
    setRegisterError("");
    setRegisterSuccess("");

    if (
      !fullName.trim() ||
      !registerEmail.trim() ||
      !registerPassword ||
      !confirmPassword
    ) {
      setRegisterError("Please complete every field.");
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError("Password must contain at least 6 characters.");
      return;
    }

    if (registerPassword !== confirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    try {
      setRegisterLoading(true);
      const result = await signUp(fullName, registerEmail, registerPassword);

      if (result.session) {
        router.replace("/dashboard" as Href);
        return;
      }

      setRegisterSuccess(
        "Account created. Check your email to confirm it, then switch to Sign In."
      );
      setLoginEmail(registerEmail.trim());
    } catch (error) {
      setRegisterError(
        error instanceof Error ? error.message : "Unable to create account."
      );
    } finally {
      setRegisterLoading(false);
    }
  }

  function showPasswordResetInfo() {
    Alert.alert(
      "Password reset",
      "Password reset will be added in the next authentication update."
    );
  }

  const loginForm = (
    <>
      <AuthField
        label="Email"
        value={loginEmail}
        onChangeText={setLoginEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="merchant@example.com"
      />

      <AuthField
        label="Password"
        value={loginPassword}
        onChangeText={setLoginPassword}
        autoCapitalize="none"
        autoComplete="password"
        secureTextEntry
        placeholder="Enter your password"
        onSubmitEditing={() => void handleLogin()}
      />

      {loginError ? (
        <AuthMessage type="error">{loginError}</AuthMessage>
      ) : null}

      <Pressable onPress={showPasswordResetInfo} accessibilityRole="button">
        <Text style={authStyles.textLink}>Forgot your password?</Text>
      </Pressable>

      <AuthPrimaryButton
        title={loginLoading ? "Signing in..." : "Sign in"}
        onPress={() => void handleLogin()}
        disabled={loginLoading || registerLoading}
      />
    </>
  );

  const registerForm = (
    <>
      <AuthField
        label="Full name"
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
        placeholder="Your name"
      />

      <AuthField
        label="Email"
        value={registerEmail}
        onChangeText={setRegisterEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="merchant@example.com"
      />

      <AuthField
        label="Password"
        value={registerPassword}
        onChangeText={setRegisterPassword}
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

      {registerError ? (
        <AuthMessage type="error">{registerError}</AuthMessage>
      ) : null}
      {registerSuccess ? (
        <AuthMessage type="success">{registerSuccess}</AuthMessage>
      ) : null}

      <AuthPrimaryButton
        title={registerLoading ? "Creating account..." : "Sign up"}
        onPress={() => void handleRegister()}
        disabled={registerLoading || loginLoading}
      />
    </>
  );

  return <AuthLayout loginForm={loginForm} registerForm={registerForm} />;
}
