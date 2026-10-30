import { ChevronDown } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';

/** Compact two-line filter trigger: small label above the current value. */
export function PickerChip({
  label,
  value,
  onPress,
  style,
}: {
  label: string;
  value: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed, style]}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.chipValue} numberOfLines={1}>
          {value}
        </Text>
        <ChevronDown color={KueColors.ink3} size={12} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    gap: 3,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
    paddingVertical: KueSpacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
  },
  chipLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipValue: {
    flexShrink: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
