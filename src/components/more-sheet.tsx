import { type Href, useRouter } from 'expo-router';
import { ChartColumn, ChevronRight, Gamepad2, Star, User, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';

type SheetItem = { label: string; href: Href; Icon: LucideIcon };

const ITEMS: SheetItem[] = [
  { label: 'Mini-games', href: '/mini-games', Icon: Gamepad2 },
  { label: 'Reviews', href: '/reviews', Icon: Star },
  { label: 'Stats', href: '/stats', Icon: ChartColumn },
  { label: 'Profile', href: '/profile', Icon: User },
];

/** Routes reachable from the sheet, used to keep the More tab highlighted. */
export const MORE_PATHS: string[] = ITEMS.map((item) => item.href as string);

/** Slide-up sheet holding the destinations that do not fit in the tab bar. */
export function MoreSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sheetHeight, setSheetHeight] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || 420, 0],
  });

  const go = (href: Href) => {
    onClose();
    router.navigate(href);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />

        <Animated.View
          accessibilityViewIsModal
          onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + KueSpacing.xl, transform: [{ translateY }] },
          ]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>More</Text>

          {ITEMS.map(({ label, href, Icon }) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={label}
              android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
              onPress={() => go(href)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Icon color={KueColors.ink2} size={20} strokeWidth={1.8} />
              <Text style={styles.rowLabel}>{label}</Text>
              <ChevronRight color={KueColors.ink3} size={16} strokeWidth={1.8} />
            </Pressable>
          ))}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    paddingTop: KueSpacing.md,
    paddingHorizontal: KueSpacing.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: KueColors.line2,
    marginBottom: KueSpacing.lg,
  },
  title: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: KueSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    minHeight: 52,
    paddingHorizontal: KueSpacing.sm,
    borderRadius: 12,
  },
  rowLabel: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 15,
  },
  pressed: {
    backgroundColor: KueColors.surface3,
  },
});
