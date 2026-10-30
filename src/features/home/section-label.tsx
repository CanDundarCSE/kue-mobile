import { StyleSheet, Text } from "react-native";

import { KueColors, KueFonts, KueTextScale } from "@/constants/kue-theme";

export function SectionLabel({ children }: { children: string }) {
  return (
    <Text maxFontSizeMultiplier={KueTextScale.compact} style={styles.label}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
});
