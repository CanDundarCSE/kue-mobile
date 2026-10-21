import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KueColors } from "@/constants/kue-theme";
import { LogoMark } from "@/features/landing/components/logo-mark";

export function AppBar({
  onSignIn,
  pageWidth,
}: {
  onSignIn: () => void;
  pageWidth: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.inner, { width: pageWidth }]}>
        <View style={styles.brand}>
          <LogoMark size={10} />
          <Text style={styles.brandText}>Kue</Text>
        </View>

        <Pressable
          onPress={onSignIn}
          hitSlop={8}
          accessibilityRole="button"
          android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
          style={({ pressed }) => [styles.signIn, pressed && styles.pressed]}>
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: KueColors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  inner: {
    alignSelf: "center",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  brandText: {
    color: KueColors.foreground,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  signIn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.75,
  },
  signInText: {
    color: KueColors.foreground,
    fontSize: 13.5,
    fontWeight: "700",
  },
});
