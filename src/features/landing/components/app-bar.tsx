import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KueColors, KueFonts } from "@/constants/kue-theme";
import { LogoMark } from "@/features/landing/components/logo-mark";

/** Brand bar for the signed-out tour. The right slot is optional (e.g. Skip). */
export function AppBar({ action }: { action?: { label: string; onPress: () => void } }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <LogoMark size={10} />
          <Text style={styles.brandText}>Kue</Text>
        </View>

        {action ? (
          <Pressable
            onPress={action.onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: KueColors.background,
  },
  inner: {
    width: "100%",
    maxWidth: 620,
    height: 52,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 20,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  brandText: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansBold,
    fontSize: 20,
    letterSpacing: -0.6,
  },
  action: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.75,
  },
  actionText: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 12.5,
  },
});
