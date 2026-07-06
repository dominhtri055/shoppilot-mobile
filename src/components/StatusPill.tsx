import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

type Props = {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
};

export function StatusPill({ label, tone = "neutral" }: Props) {
  return (
    <View style={[styles.pill, styles[tone]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  success: {
    backgroundColor: "#DCFCE7",
  },
  warning: {
    backgroundColor: "#FEF3C7",
  },
  danger: {
    backgroundColor: "#FEE2E2",
  },
  info: {
    backgroundColor: "#DBEAFE",
  },
  neutral: {
    backgroundColor: "#F3F4F6",
  },
  text: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});