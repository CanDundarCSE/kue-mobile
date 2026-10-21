import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { KueColors } from "@/constants/kue-theme";
import { LogoMark } from "@/features/landing/components/logo-mark";

/** Shown while fonts load and the stored session is restored. */
export function BootScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <LogoMark size={14} />
        <Text style={styles.brandText}>Kue</Text>
      </View>
      <ActivityIndicator color={KueColors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KueColors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "600",
    color: KueColors.foreground,
    letterSpacing: -0.2,
  },
});
