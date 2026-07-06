import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";

type Props = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: "center",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.muted,
    textAlign: "center",
  },
});