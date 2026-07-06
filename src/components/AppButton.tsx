import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

type Props ={
    title: string,
    onPress: () => void;
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
}

export function AppButton({
    title,
    onPress,
    variant = "primary",
    disabled = false,
}: Props){
    return(
            <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "secondary" && styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryText: {
    color: colors.text,
  },
});
