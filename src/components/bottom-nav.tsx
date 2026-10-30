import { type Href, usePathname, useRouter } from 'expo-router';
import { Compass, Ellipsis, House, Library, Users, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';

import { MoreSheet, MORE_PATHS } from './more-sheet';

type Tab = { label: string; href: Href; Icon: LucideIcon };

const TABS: Tab[] = [
  { label: 'Home', href: '/', Icon: House },
  { label: 'Library', href: '/library', Icon: Library },
  { label: 'Discover', href: '/discover', Icon: Compass },
  { label: 'Friends', href: '/friends', Icon: Users },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreOpen || MORE_PATHS.includes(pathname);

  return (
    <>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, KueSpacing.sm) }]}>
        {TABS.map(({ label, href, Icon }) => {
          const active = pathname === href;
          const color = active ? KueColors.accent : KueColors.ink3;

          return (
            <TabButton
              key={label}
              label={label}
              active={active}
              onPress={() => router.navigate(href)}>
              <Icon color={color} size={22} strokeWidth={active ? 2.2 : 1.8} />
            </TabButton>
          );
        })}

        <TabButton
          label="More"
          active={moreActive}
          expanded={moreOpen}
          onPress={() => setMoreOpen(true)}>
          <Ellipsis color={moreActive ? KueColors.accent : KueColors.ink3} size={22} strokeWidth={1.8} />
        </TabButton>
      </View>

      <MoreSheet visible={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

function TabButton({
  label,
  active,
  expanded,
  onPress,
  children,
}: {
  label: string;
  active: boolean;
  expanded?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, expanded }}
      android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: false }}
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      {children}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: KueColors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
    paddingTop: KueSpacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    paddingTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: KueColors.accent,
  },
});
