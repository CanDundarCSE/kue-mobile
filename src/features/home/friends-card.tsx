import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { fetchFriendActivity } from '@/lib/api/home';

import { ErrorLine } from './continue-card';
import { SectionLabel } from './section-label';

export function FriendsCard() {
  const friendsQuery = useQuery({
    queryKey: ['friends-activity'],
    queryFn: () => fetchFriendActivity(3),
  });

  return (
    <View style={styles.card}>
      <SectionLabel>Friends</SectionLabel>

      {friendsQuery.isError ? (
        <ErrorLine onRetry={() => void friendsQuery.refetch()} />
      ) : friendsQuery.isPending ? (
        <View style={styles.loading}>
          <ActivityIndicator color={KueColors.ink3} />
        </View>
      ) : friendsQuery.data.length === 0 ? (
        <Text style={styles.empty}>No friend activity yet.</Text>
      ) : (
        <View>
          {friendsQuery.data.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.text} numberOfLines={1}>
                <Text style={styles.username}>{item.username}</Text> {item.formattedText}
              </Text>
              <Text style={styles.time}>{item.timeAgo}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: KueSpacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.xl,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: KueSpacing.md,
  },
  empty: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    paddingVertical: KueSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 12,
  },
  text: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  username: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
  },
  time: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
