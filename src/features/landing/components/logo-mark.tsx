import { StyleSheet, View } from "react-native";

import { KueColors } from "@/constants/kue-theme";

/** The Kue triangle mark, drawn with borders so it needs no SVG. */
export function LogoMark({ size = 11 }: { size?: number }) {
  const half = size / 2;

  return (
    <View
      style={[
        styles.triangle,
        {
          borderLeftWidth: half,
          borderRightWidth: half,
          borderTopWidth: size,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  triangle: {
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: KueColors.accent,
  },
});
