import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Globe, Heart, Lock, Users } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '@/components/user-avatar';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  fetchFriends,
  fetchUserActivity,
  fetchUserFriends,
  fetchUserLibrary,
  fetchUserLists,
  type Friend,
  type UserList,
} from '@/lib/api/friends';
import { mediaHref } from '@/lib/media-href';

function dayLabel(key: string) {
  const parts = key.split('-').map(Number);
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) return key;

  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (same(date, today)) return 'Today';
  if (same(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function ProfileFavorites({ username, enabled }: { username: string; enabled: boolean }) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ['user-favorites', username],
    queryFn: () => fetchUserLibrary(username),
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;

  const favorites = (query.data ?? [])
    .filter((entry) => entry.isFavorite && entry.media?.title)
    .slice(0, 12);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Favorites</Text>

      {query.isPending ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={[styles.cardPoster, styles.skeleton]} />
          ))}
        </ScrollView>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyRow}>
          <Heart color={KueColors.ink3} size={14} strokeWidth={1.8} />
          <Text style={styles.emptyText}>No favorites yet.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {favorites.map((entry) => (
            <Pressable
              key={entry.mediaId}
              accessibilityRole="button"
              accessibilityLabel={entry.media?.title ?? 'Favorite'}
              onPress={() =>
                router.push(
                  mediaHref({
                    id: entry.mediaId,
                    mediaType: entry.media?.mediaType ?? 'movie',
                  }),
                )
              }
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardPoster}>
                {entry.media?.coverImage ? (
                  <Image
                    source={{ uri: entry.media.coverImage }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.posterFallback}>
                    {(entry.media?.title ?? '?').charAt(0)}
                  </Text>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {entry.media?.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function ProfileLists({ username, enabled }: { username: string; enabled: boolean }) {
  const query = useQuery({
    queryKey: ['user-lists', username],
    queryFn: () => fetchUserLists(username),
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;

  const lists = query.data ?? [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Lists</Text>

      {query.isPending ? (
        <View style={styles.listCard}>
          <View style={styles.skeletonLine} />
        </View>
      ) : lists.length === 0 ? (
        <Text style={styles.emptyText}>{username} hasn&apos;t shared any lists.</Text>
      ) : (
        <View style={styles.listStack}>
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </View>
      )}
    </View>
  );
}

function ListCard({ list }: { list: UserList }) {
  const visibility = list.visibility === 'private' ? 'Private' : list.visibility === 'friends' ? 'Friends' : 'Public';
  const Icon = visibility === 'Private' ? Lock : visibility === 'Friends' ? Users : Globe;

  return (
    <View style={styles.listCard}>
      <View style={styles.listHeader}>
        <Text style={styles.listName} numberOfLines={1}>
          {list.name}
        </Text>
        <View style={styles.listMeta}>
          <Icon
            color={KueColors.ink3}
            size={11}
            strokeWidth={1.8}
          />
          <Text style={styles.listMetaText}>
            {list.itemCount} {list.itemCount === 1 ? 'title' : 'titles'} · {visibility}
          </Text>
        </View>
      </View>

      {list.description ? (
        <Text style={styles.listDescription} numberOfLines={2}>
          {list.description}
        </Text>
      ) : null}

      {(list.previewCoverImages ?? []).length > 0 ? (
        <View style={styles.previewRow}>
          {(list.previewCoverImages ?? []).slice(0, 5).map((image, index) => (
            <View key={`${image}-${index}`} style={styles.previewThumb}>
              <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ProfileActivity({ username, enabled }: { username: string; enabled: boolean }) {
  const query = useQuery({
    queryKey: ['user-activity', username],
    queryFn: () => fetchUserActivity(username, 30),
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;

  const days = (query.data ?? [])
    .filter((day) => day.added > 0 || day.completed > 0)
    .slice(0, 7);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent activity · last 30 days</Text>

      {query.isPending ? (
        <View style={styles.listCard}>
          <View style={styles.skeletonLine} />
        </View>
      ) : days.length === 0 ? (
        <Text style={styles.emptyText}>No activity in the last 30 days.</Text>
      ) : (
        <View style={styles.listCard}>
          {days.map((day, index) => (
            <View key={day.date} style={[styles.activityRow, index > 0 && styles.divider]}>
              <Text style={styles.activityDay}>{dayLabel(day.date)}</Text>
              <Text style={styles.activityValue}>
                {day.added > 0 ? `+${day.added} added` : ''}
                {day.added > 0 && day.completed > 0 ? ' · ' : ''}
                {day.completed > 0 ? `${day.completed} completed` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function ProfileMutualFriends({ username, enabled }: { username: string; enabled: boolean }) {
  const router = useRouter();
  const theirs = useQuery({
    queryKey: ['user-friends', username],
    queryFn: () => fetchUserFriends(username),
    enabled,
    staleTime: 60_000,
  });
  const mine = useQuery({
    queryKey: ['friends'],
    queryFn: fetchFriends,
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;

  const mineIds = new Set((mine.data ?? []).map((friend: Friend) => friend.userId));
  const mutual = (theirs.data ?? []).filter((friend) => mineIds.has(friend.userId));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mutual friends</Text>

      {theirs.isPending || mine.isPending ? (
        <View style={styles.listCard}>
          <View style={styles.skeletonLine} />
        </View>
      ) : mutual.length === 0 ? (
        <Text style={styles.emptyText}>No mutual friends yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {mutual.slice(0, 12).map((friend) => (
            <Pressable
              key={friend.userId}
              accessibilityRole="button"
              accessibilityLabel={friend.username}
              onPress={() =>
                router.push({
                  pathname: '/profile/[username]',
                  params: { username: friend.username },
                })
              }
              style={({ pressed }) => [styles.mutualCard, pressed && styles.pressed]}>
              <UserAvatar username={friend.username} avatarId={friend.avatarId} size={40} />
              <Text style={styles.mutualName} numberOfLines={1}>
                {friend.username}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: KueSpacing.sm,
  },
  sectionTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  rail: {
    gap: KueSpacing.md,
    paddingVertical: KueSpacing.xs,
  },
  card: {
    width: 96,
    gap: 6,
  },
  cardPoster: {
    width: 96,
    aspectRatio: 42 / 54,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeleton: {
    opacity: 0.5,
  },
  posterFallback: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 26,
  },
  cardTitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansMedium,
    fontSize: 11,
    lineHeight: 15,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: KueSpacing.sm,
  },
  emptyText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  listStack: {
    gap: KueSpacing.sm,
  },
  listCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
    gap: KueSpacing.sm,
  },
  skeletonLine: {
    height: 12,
    width: '55%',
    borderRadius: 6,
    backgroundColor: KueColors.surface3,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
  },
  listName: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listMetaText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  listDescription: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 4,
  },
  previewThumb: {
    width: 30,
    height: 40,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.sm,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
  },
  activityDay: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 12,
  },
  activityValue: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  mutualCard: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  mutualName: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 10,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
