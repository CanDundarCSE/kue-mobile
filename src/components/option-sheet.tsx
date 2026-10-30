import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';

export type SheetOption<T extends string> = {
  value: T;
  label: string;
  meta?: string;
  /** Optional status dot color. */
  dot?: string;
};

/** Bottom sheet listing one choice per row. Used by the library pickers. */
export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: SheetOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [sheetHeight, setSheetHeight] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || 320, 0],
  });

  return (
    <Modal
      transparent
      animationType="fade"
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />

        <Animated.View
          accessibilityViewIsModal
          onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + KueSpacing.lg, transform: [{ translateY }] },
          ]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: windowHeight * 0.55 }}
            contentContainerStyle={styles.options}>
            {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.meta ? `${option.label}, ${option.meta}` : option.label}
                android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
                onPress={() => onSelect(option.value)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                {option.dot ? <View style={[styles.dot, { backgroundColor: option.dot }]} /> : null}
                <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
                {option.meta ? <Text style={styles.meta}>{option.meta}</Text> : null}
                {active ? <Check color={KueColors.accent} size={16} strokeWidth={2.4} /> : null}
              </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: KueColors.surface2,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    paddingHorizontal: KueSpacing.xl,
    paddingTop: KueSpacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: KueColors.line2,
    marginBottom: KueSpacing.md,
  },
  title: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: KueSpacing.xs,
  },
  options: {
    paddingBottom: KueSpacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    minHeight: 50,
    paddingHorizontal: KueSpacing.sm,
    borderRadius: 10,
  },
  pressed: {
    backgroundColor: KueColors.surface3,
  },
  label: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 14,
  },
  labelActive: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
  },
  meta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
