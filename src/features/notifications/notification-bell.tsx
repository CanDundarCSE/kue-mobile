import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KueColors, KueFonts } from '@/constants/kue-theme';
import { fetchUnreadCount } from '@/lib/api/notifications';

export function NotificationBell() {
  const router = useRouter();
  const unreadQuery = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const unread = unreadQuery.data ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      hitSlop={8}
      onPress={() => router.push('/notifications' as Href)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Bell color={KueColors.ink2} size={18} strokeWidth={1.8} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: KueColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: KueColors.white,
    fontFamily: KueFonts.mono,
    fontSize: 8,
  },
});
