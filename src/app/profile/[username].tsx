import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Lock, UserMinus, UserPlus } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  ProfileActivity,
  ProfileFavorites,
  ProfileLists,
  ProfileMutualFriends,
} from '@/features/profile/profile-sections';
import { ReviewCard } from '@/features/reviews/review-card';
import {
  fetchIncomingRequests,
  fetchUserProfile,
  removeFriend,
  respondToRequest,
  sendFriendRequestByKueId,
} from '@/lib/api/friends';
import { ApiError } from '@/lib/api/types';
import { fetchUserReviews } from '@/lib/api/reviews';
import { useAuth } from '@/lib/auth/auth-context';
import { useResponsive } from '@/lib/responsive';

function first(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' ? single : '';
}

function joinedLabel(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
}

export default function UserProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();
  const { username: usernameParam } = useLocalSearchParams<{ username?: string }>();
  const username = first(usernameParam);
  const { user } = useAuth();

  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['user-profile', username],
    queryFn: () => fetchUserProfile(username),
    enabled: username.length > 0,
  });

  const incomingQuery = useQuery({
    queryKey: ['friends-incoming'],
    queryFn: fetchIncomingRequests,
    enabled: profileQuery.data?.friendshipStatus === 'pending_received',
  });

  const reviewsQuery = useQuery({
    queryKey: ['user-reviews', username, 1, 3],
    queryFn: () => fetchUserReviews(username, 1, 3),
    enabled: username.length > 0,
    retry: false,
  });

  const profile = profileQuery.data;
  const isSelf = profile !== undefined && profile.id === user?.id;
  const incomingRequest = profile
    ? (incomingQuery.data ?? []).find((request) => request.requesterId === profile.id)
    : undefined;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['user-profile', username] });
    await queryClient.invalidateQueries({ queryKey: ['friends'] });
    await queryClient.invalidateQueries({ queryKey: ['friends-incoming'] });
    await queryClient.invalidateQueries({ queryKey: ['friends-outgoing'] });
  };

  const run = async (key: string, action: () => Promise<unknown>, done?: string) => {
    if (acting) return;
    setActing(key);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (done) setNotice(done);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong.');
    } finally {
      setActing(null);
    }
  };

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      onPress={() => router.back()}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
      <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
    </Pressable>
  );

  if (profileQuery.isPending) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={[styles.content, { width: contentWidth, paddingHorizontal: gutter }]}>
            <View style={styles.topRow}>{back}</View>
            <View style={styles.headerCard}>
              <Skeleton width={64} height={64} radius={32} />
              <View style={styles.headerBody}>
                <Skeleton width="55%" height={20} />
                <Skeleton width="35%" height={10} />
                <Skeleton width="80%" height={10} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={[styles.content, { width: contentWidth, paddingHorizontal: gutter }]}>
            <View style={styles.topRow}>{back}</View>
            <View style={styles.state}>
              <Text style={styles.stateTitle}>Profile not found.</Text>
              <Text style={styles.stateBody}>This account may have been removed.</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const reviews = reviewsQuery.data?.items ?? [];
  const totalReviews = reviewsQuery.data?.totalItems ?? 0;
  const locked = profile.isPrivate && !profile.counts;
  const joined = joinedLabel(profile.joinedAt);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            {back}
            <Text style={styles.topTitle}>Profile</Text>
          </View>

          <View style={styles.headerCard}>
            <View style={styles.identityRow}>
              <UserAvatar username={profile.username} avatarId={profile.avatarId} size={64} />
              <View style={styles.headerBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {profile.username}
                  </Text>
                  {profile.isPrivate ? (
                    <View style={styles.privatePill}>
                      <Lock color={KueColors.ink3} size={9} strokeWidth={2} />
                      <Text style={styles.privateLabel}>Private</Text>
                    </View>
                  ) : null}
                </View>
                {profile.kueId ? <Text style={styles.kueId}>{profile.kueId}</Text> : null}
                {joined ? <Text style={styles.joined}>{joined}</Text> : null}
              </View>
            </View>

            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            {!isSelf ? (
              <View style={styles.actions}>
                {profile.isFriend || profile.friendshipStatus === 'accepted' ? (
                  <View style={styles.friendPill}>
                    <Text style={styles.friendLabel}>Friends</Text>
                  </View>
                ) : profile.friendshipStatus === 'pending_received' && incomingRequest ? (
                  <ActionButton
                    label="Accept request"
                    busy={acting === 'accept'}
                    onPress={() =>
                      void run(
                        'accept',
                        () => respondToRequest(incomingRequest.id, 'accept'),
                        'You are now friends.',
                      )
                    }
                  />
                ) : profile.friendshipStatus === 'pending_sent' ? (
                  <ActionButton
                    label="Cancel request"
                    busy={acting === 'cancel'}
                    onPress={() =>
                      void run('cancel', () => removeFriend(profile.username), 'Request cancelled.')
                    }
                  />
                ) : (
                  <ActionButton
                    label="Add friend"
                    busy={acting === 'add'}
                    icon={<UserPlus color={KueColors.background} size={14} strokeWidth={2} />}
                    onPress={() =>
                      void run(
                        'add',
                        () => sendFriendRequestByKueId(profile.kueId ?? profile.username),
                        'Friend request sent.',
                      )
                    }
                  />
                )}

                {profile.isFriend || profile.friendshipStatus === 'accepted' ? (
                  <ActionButton
                    label="Remove"
                    variant="ghost"
                    busy={acting === 'remove'}
                    icon={<UserMinus color={KueColors.ink2} size={14} strokeWidth={1.8} />}
                    onPress={() =>
                      void run('remove', () => removeFriend(profile.username), 'Friend removed.')
                    }
                  />
                ) : null}
              </View>
            ) : null}

            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          {profile.counts ? (
            <View style={styles.stats}>
              <Stat label="Library" value={profile.counts.totalLibraryItems} />
              <Stat label="Completed" value={profile.counts.completedItems} />
              <Stat label="In progress" value={profile.counts.inProgressItems} />
              <Stat label="Favorites" value={profile.counts.favoritesCount} />
            </View>
          ) : locked ? (
            <View style={styles.lockedCard}>
              <Lock color={KueColors.ink3} size={13} strokeWidth={2} />
              <Text style={styles.lockedText}>
                This account is private. Add {profile.username} as a friend to see their
                library and reviews.
              </Text>
            </View>
          ) : null}

          <ProfileFavorites username={profile.username} enabled={!!profile.counts} />
          <ProfileLists username={profile.username} enabled={!!profile.counts} />
          <ProfileActivity username={profile.username} enabled={!!profile.counts} />

          <View style={styles.reviews}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {totalReviews > 3 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="See all reviews"
                  onPress={() =>
                    router.push({
                      pathname: '/profile/[username]/reviews',
                      params: { username: profile.username },
                    })
                  }
                  hitSlop={8}>
                  <Text style={styles.seeAll}>See all {totalReviews}</Text>
                </Pressable>
              ) : null}
            </View>

            {reviewsQuery.isPending ? (
              <View style={styles.reviewSkeleton}>
                <Skeleton width={46} height={62} radius={8} />
                <View style={styles.reviewSkeletonBody}>
                  <Skeleton width="55%" height={12} />
                  <Skeleton width="85%" height={10} />
                </View>
              </View>
            ) : reviewsQuery.isError ? (
              <Text style={styles.emptyText}>
                {reviewsQuery.error instanceof ApiError && reviewsQuery.error.status === 403
                  ? 'Reviews are private.'
                  : "Couldn't load reviews right now."}
              </Text>
            ) : reviews.length === 0 ? (
              <Text style={styles.emptyText}>No reviews yet.</Text>
            ) : (
              <View>
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                {totalReviews > 3 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="All reviews"
                    onPress={() =>
                      router.push({
                        pathname: '/profile/[username]/reviews',
                        params: { username: profile.username },
                      })
                    }
                    style={({ pressed }) => [styles.allButton, pressed && styles.pressed]}>
                    <Text style={styles.allLabel}>All reviews · {totalReviews}</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>

          <ProfileMutualFriends username={profile.username} enabled={!!profile.counts} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ActionButton({
  label,
  busy,
  icon,
  variant,
  onPress,
}: {
  label: string;
  busy?: boolean;
  icon?: React.ReactNode;
  variant?: 'ghost';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        variant === 'ghost' ? styles.ghostButton : styles.primaryButton,
        pressed && styles.pressed,
        busy && styles.disabled,
      ]}>
      {busy ? (
        <ActivityIndicator color={variant === 'ghost' ? KueColors.ink2 : KueColors.background} size="small" />
      ) : (
        icon
      )}
      <Text style={variant === 'ghost' ? styles.ghostLabel : styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KueColors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    paddingTop: KueSpacing.sm,
    paddingBottom: KueSpacing.xxl,
    gap: KueSpacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -KueSpacing.sm,
  },
  topTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.lg,
    gap: KueSpacing.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
  },
  headerBody: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
  },
  name: {
    flexShrink: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 26,
    lineHeight: 30,
  },
  privatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  privateLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  kueId: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  joined: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
  },
  bio: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KueSpacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: KueSpacing.lg,
    borderRadius: 10,
    backgroundColor: KueColors.foreground,
  },
  primaryLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: KueSpacing.lg,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  ghostLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  friendPill: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.lg,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(95,174,124,0.45)',
    backgroundColor: 'rgba(95,174,124,0.10)',
  },
  friendLabel: {
    color: KueColors.game,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  notice: {
    color: KueColors.game,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  error: {
    color: KueColors.danger,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    paddingVertical: KueSpacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 22,
  },
  statLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  lockedCard: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
  },
  lockedText: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  reviews: {
    gap: KueSpacing.sm,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  seeAll: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  reviewSkeleton: {
    flexDirection: 'row',
    gap: KueSpacing.md,
    paddingVertical: KueSpacing.md,
  },
  reviewSkeletonBody: {
    flex: 1,
    gap: 8,
    paddingTop: 6,
  },
  emptyText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    paddingVertical: KueSpacing.md,
  },
  allButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: KueSpacing.sm,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  allLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  state: {
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.xxl,
  },
  stateTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 22,
  },
  stateBody: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
});
