import { Stack } from "expo-router";
import { colors } from "../src/constants/theme";

export default function RootLayout() {
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
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Stack.Screen name="products/index" options={{ title: "Products" }} />
      <Stack.Screen name="products/[id]" options={{ title: "Product Detail" }} />
      <Stack.Screen name="orders/index" options={{ title: "Orders" }} />
      <Stack.Screen name="orders/[id]" options={{ title: "Order Detail" }} />
      <Stack.Screen name="insights" options={{ title: "Insights" }} />
    </Stack>
  );
}