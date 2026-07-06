import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../constants/theme";

export default function IndexScreen() {
  const [route, setRoute] = useState<"/dashboard" | "/login" | null>(null);

  useEffect(() => {
    async function checkSession() {
      const session = await AsyncStorage.getItem("session");
      setRoute(session ? "/dashboard" : "/login");
    }

    checkSession();
  }, []);

  if (!route) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

if (route === "/dashboard") {
  return <Redirect href={"/dashboard" as Href} />;
}

return <Redirect href={"/login" as Href} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});