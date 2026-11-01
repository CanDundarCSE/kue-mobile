import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Lock, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { EditProfileSheet } from '@/features/profile/edit-profile-sheet';
import {
  ProfileActivity,
  ProfileFavorites,
} from '@/features/profile/profile-sections';
import { MyListsSection } from '@/features/lists/my-lists';
import { ReviewCard } from '@/features/reviews/review-card';
import { fetchUserProfile } from '@/lib/api/friends';
import { fetchMyReviews } from '@/lib/api/reviews';
import { useAuth } from '@/lib/auth/auth-context';
import { useResponsive } from '@/lib/responsive';

function joinedLabel(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);

  const username = user?.username ?? '';

  const profileQuery = useQuery({
    queryKey: ['user-profile', username],
    queryFn: () => fetchUserProfile(username),
    enabled: username.length > 0,
    staleTime: 60_000,
  });

  const reviewsQuery = useQuery({
    queryKey: ['my-reviews', 'all', 'preview'],
    queryFn: () => fetchMyReviews(1, 3),
    enabled: !!user,
    staleTime: 30_000,
  });

  const profile = profileQuery.data;
  const reviews = reviewsQuery.data?.items ?? [];
  const totalReviews = reviewsQuery.data?.totalItems ?? 0;
  const joined = joinedLabel(profile?.joinedAt);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    await queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={profileQuery.isRefetching && !profileQuery.isPending}
              onRefresh={() => void refresh()}
              tintColor={KueColors.ink3}
              colors={[KueColors.accent]}
            />
          }>
          <Text style={styles.kicker}>Profile</Text>

          <View style={styles.headerCard}>
            <View style={styles.identityRow}>
              <UserAvatar username={username} avatarId={user?.avatarId} size={64} />
              <View style={styles.headerBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {username}
                  </Text>
                  {profile?.isPrivate ? (
                    <View style={styles.privatePill}>
                      <Lock color={KueColors.ink3} size={9} strokeWidth={2} />
                      <Text style={styles.privateLabel}>Private</Text>
                    </View>
                  ) : null}
                </View>
                {user?.kueId ? <Text style={styles.kueId}>{user.kueId}</Text> : null}
                {joined ? <Text style={styles.joined}>{joined}</Text> : null}
              </View>
            </View>

            {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                onPress={() => setEditing(true)}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Pencil color={KueColors.background} size={13} strokeWidth={2} />
                <Text style={styles.primaryLabel}>Edit profile</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="My reviews"
                onPress={() => router.push('/reviews')}
                style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
                <Text style={styles.ghostLabel}>Reviews</Text>
              </Pressable>
            </View>
          </View>

          {profile?.counts ? (
            <View style={styles.stats}>
              <Stat label="Library" value={profile.counts.totalLibraryItems} />
              <Stat label="Completed" value={profile.counts.completedItems} />
              <Stat label="In progress" value={profile.counts.inProgressItems} />
              <Stat label="Favorites" value={profile.counts.favoritesCount} />
            </View>
          ) : (
            <Skeleton height={78} radius={14} />
          )}

          <ProfileFavorites username={username} enabled={!!profile?.counts} />
          <MyListsSection />
          <ProfileActivity username={username} enabled={!!profile?.counts} />

          <View style={styles.reviews}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Your reviews</Text>
              {totalReviews > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="All reviews"
                  onPress={() => router.push('/reviews')}
                  hitSlop={8}>
                  <Text style={styles.seeAll}>All {totalReviews}</Text>
                </Pressable>
              ) : null}
            </View>

            {reviewsQuery.isPending ? (
              <View style={styles.skeletonRow}>
                <Skeleton width={46} height={62} radius={8} />
                <View style={styles.skeletonBody}>
                  <Skeleton width="55%" height={12} />
                  <Skeleton width="85%" height={10} />
                </View>
              </View>
            ) : reviews.length === 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Write a review"
                onPress={() => router.push('/reviews')}
                style={({ pressed }) => [styles.emptyReview, pressed && styles.pressed]}>
                <Text style={styles.emptyTitle}>Nothing written yet.</Text>
                <Text style={styles.emptyBody}>
                  Pick a title from your library and say what you thought.
                </Text>
              </Pressable>
            ) : (
              <View>
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {editing && user ? (
        <EditProfileSheet
          user={user}
          onClose={() => setEditing(false)}
          onSaved={(next) => void updateUser(next)}
        />
      ) : null}
    </View>
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
    paddingTop: KueSpacing.lg,
    paddingBottom: KueSpacing.xxl,
    gap: KueSpacing.md,
  },
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    minHeight: 42,
    justifyContent: 'center',
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
  pressed: {
    opacity: 0.7,
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
  skeletonRow: {
    flexDirection: 'row',
    gap: KueSpacing.md,
    paddingVertical: KueSpacing.md,
  },
  skeletonBody: {
    flex: 1,
    gap: 8,
    paddingTop: 6,
  },
  emptyReview: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.lg,
    gap: KueSpacing.xs,
  },
  emptyTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 18,
  },
  emptyBody: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
});
