import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

type Props = {
    children: ReactNode
}

export function Card({children}:Props){
    return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
    card:{
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    }
})