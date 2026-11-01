import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCheck, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { Skeleton } from '@/components/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  clearNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/lib/api/notifications';
import { useResponsive } from '@/lib/responsive';

function timeAgo(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(1, 50),
  });

  const items = notificationsQuery.data?.items ?? [];
  const unread = items.filter((item) => !item.isRead).length;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    await queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
  };

  const openItem = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await markNotificationRead(item.id);
        await refresh();
      } catch {
        // Keep the row; the next refresh corrects it.
      }
    }

    if (item.type.startsWith('friend_request')) {
      router.push('/friends');
      return;
    }

    if (item.referenceType === 'media' && item.referenceId) {
      router.push(`/media/${item.referenceId}` as never);
    }
  };

  const remove = async (id: number) => {
    if (busyId !== null) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteNotification(id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove the notification.');
    } finally {
      setBusyId(null);
    }
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not mark notifications read.');
    }
  };

  const clearAll = async () => {
    setClearing(false);
    try {
      await clearNotifications();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not clear notifications.');
    }
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
        </Pressable>
        <Text style={styles.kicker}>Notifications</Text>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>
          Your updates<Text style={styles.accent}>.</Text>
        </Text>
        {items.length > 0 ? (
          <View style={styles.headerActions}>
            {unread > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
                onPress={() => void markAll()}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <CheckCheck color={KueColors.ink2} size={16} strokeWidth={1.8} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all notifications"
              onPress={() => setClearing(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <X color={KueColors.ink3} size={16} strokeWidth={2} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text style={styles.subtitle}>
        {unread > 0 ? `${unread} unread` : 'All caught up'} · {items.length} total
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={[styles.row, !item.isRead && styles.rowUnread]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.message}`}
                onPress={() => void openItem(item)}
                style={styles.rowMain}>
                <UserAvatar username={item.actorUsername ?? 'K'} size={36} />
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowTitle, !item.isRead && styles.rowTitleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.message} numberOfLines={2}>
                    {item.message}
                  </Text>
                </View>
                {!item.isRead ? <View style={styles.dot} /> : null}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove notification"
                disabled={busyId !== null}
                hitSlop={6}
                onPress={() => void remove(item.id)}
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                {busyId === item.id ? (
                  <ActivityIndicator color={KueColors.ink3} size="small" />
                ) : (
                  <X color={KueColors.ink3} size={15} strokeWidth={2} />
                )}
              </Pressable>
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            notificationsQuery.isPending ? (
              <View style={styles.skeletons}>
                {[0, 1, 2].map((row) => (
                  <View key={row} style={styles.skeletonRow}>
                    <Skeleton width={36} height={36} radius={18} />
                    <View style={styles.skeletonBody}>
                      <Skeleton width="50%" height={11} />
                      <Skeleton width="80%" height={9} />
                    </View>
                  </View>
                ))}
              </View>
            ) : notificationsQuery.isError ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void notificationsQuery.refetch()}
                style={styles.state}>
                <Text style={styles.stateTitle}>Couldn&apos;t load notifications.</Text>
                <Text style={styles.stateBody}>Tap to try again.</Text>
              </Pressable>
            ) : (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>Nothing new.</Text>
                <Text style={styles.stateBody}>
                  Friend requests and accepted invites show up here.
                </Text>
              </View>
            )
          }
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      <BottomSheet visible={clearing} onClose={() => setClearing(false)}>
        <Text style={styles.sheetTitle}>Clear all notifications?</Text>
        <Text style={styles.sheetBody}>
          This removes every notification from your list. It cannot be undone.
        </Text>
        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Keep notifications"
            onPress={() => setClearing(false)}
            style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}>
            <Text style={styles.keepLabel}>Keep</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear notifications"
            onPress={() => void clearAll()}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}>
            <Text style={styles.dangerLabel}>Clear</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: KueColors.background },
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    paddingTop: KueSpacing.sm,
    paddingBottom: KueSpacing.xxl,
  },
  header: { gap: KueSpacing.xs, marginBottom: KueSpacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: KueSpacing.sm },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -KueSpacing.sm,
  },
  pressed: { opacity: 0.7 },
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.md,
  },
  title: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 30,
    lineHeight: 34,
  },
  accent: { color: KueColors.accent },
  headerActions: { flexDirection: 'row', gap: KueSpacing.sm },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  error: { color: KueColors.danger, fontFamily: KueFonts.sans, fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.sm,
    marginBottom: KueSpacing.sm,
  },
  rowUnread: {
    borderColor: 'rgba(126,143,255,0.4)',
    backgroundColor: KueColors.accentSoft,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    minHeight: 44,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: KueSpacing.sm },
  rowTitle: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sansMedium,
    fontSize: 12,
  },
  rowTitleUnread: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
  },
  time: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    textTransform: 'uppercase',
  },
  message: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: KueColors.accent,
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletons: { gap: KueSpacing.sm },
  skeletonRow: {
    flexDirection: 'row',
    gap: KueSpacing.md,
    padding: KueSpacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
  },
  skeletonBody: { flex: 1, gap: 8 },
  state: { alignItems: 'center', gap: KueSpacing.sm, paddingVertical: KueSpacing.xxl },
  stateTitle: { color: KueColors.foreground, fontFamily: KueFonts.serif, fontSize: 20 },
  stateBody: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    textAlign: 'center',
  },
  sheetTitle: { color: KueColors.foreground, fontFamily: KueFonts.serif, fontSize: 22 },
  sheetBody: { color: KueColors.ink2, fontFamily: KueFonts.sans, fontSize: 13, lineHeight: 19 },
  sheetActions: { flexDirection: 'row', gap: KueSpacing.sm, marginTop: KueSpacing.sm },
  keepButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepLabel: { color: KueColors.ink2, fontFamily: KueFonts.sansMedium, fontSize: 14 },
  dangerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: KueColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerLabel: { color: KueColors.background, fontFamily: KueFonts.sansSemiBold, fontSize: 14 },
});
