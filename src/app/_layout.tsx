import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          fontWeight: "800",
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen
          name="forgot-password"
          options={{
            title: "Forgot Password",
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="update-password"
          options={{
            title: "Update Password",
            headerShown: false,
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
        <Stack.Screen name="products/index" options={{ title: "Products" }} />
        <Stack.Screen name="products/new" options={{ title: "Add Product" }} />
        <Stack.Screen
          name="products/[id]"
          options={{ title: "Product Detail" }}
        />
        <Stack.Screen
          name="products/[id]/edit"
          options={{ title: "Edit Product" }}
        />
        <Stack.Screen name="orders/index" options={{ title: "Orders" }} />
        <Stack.Screen name="orders/[id]" options={{ title: "Order Detail" }} />
        <Stack.Screen name="insights" options={{ title: "Insights" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
