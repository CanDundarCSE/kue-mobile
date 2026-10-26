import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { KueColors, KueTextScale } from "@/constants/kue-theme";

export type LandingButtonVariant = "primary" | "secondary" | "ghost";

export function LandingButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  fullWidth = false,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: LandingButtonVariant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  busy?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{
        color: variant === "primary" ? "rgba(17,17,19,0.18)" : "rgba(255,255,255,0.08)",
      }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}>
      {busy ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? KueColors.background : KueColors.foreground}
        />
      ) : (
        <Text
          maxFontSizeMultiplier={KueTextScale.control}
          style={[styles.label, sizeLabel[size], labelStyles[variant]]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    width: "100%",
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { height: 40, paddingHorizontal: 16 },
  md: { height: 48, paddingHorizontal: 20 },
  lg: { height: 54, paddingHorizontal: 24 },
});

const sizeLabel = StyleSheet.create({
  sm: { fontSize: 13.5 },
  md: { fontSize: 15 },
  lg: { fontSize: 16 },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: KueColors.accent,
  },
  secondary: {
    backgroundColor: KueColors.surface3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  ghost: {
    backgroundColor: "transparent",
  },
});

const labelStyles = StyleSheet.create({
  primary: {
    color: KueColors.background,
  },
  secondary: {
    color: KueColors.foreground,
  },
  ghost: {
    color: KueColors.accent,
  },
});
