import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { ReviewCard } from '@/features/reviews/review-card';
import { ApiError } from '@/lib/api/types';
import { fetchUserReviews } from '@/lib/api/reviews';
import { useResponsive } from '@/lib/responsive';

const PAGE_SIZE = 10;

function first(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' ? single : '';
}

export default function UserReviewsScreen() {
  const router = useRouter();
  const { contentWidth, gutter } = useResponsive();
  const { username: usernameParam } = useLocalSearchParams<{ username?: string }>();
  const username = first(usernameParam);

  const reviews = useInfiniteQuery({
    queryKey: ['user-reviews', username, 'all'],
    queryFn: ({ pageParam }) => fetchUserReviews(username, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: username.length > 0,
    retry: false,
  });

  const items = (reviews.data?.pages ?? []).flatMap((page) => page.items);
  const total = reviews.data?.pages[0]?.totalItems ?? 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ReviewCard review={item} clamp={false} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to profile"
                hitSlop={8}
                onPress={() => router.back()}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
                <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
              </Pressable>

              <Text style={styles.kicker}>Reviews</Text>
              <Text style={styles.title}>
                What {username} thinks<Text style={styles.accent}>.</Text>
              </Text>
              <Text style={styles.subtitle}>
                {total} {total === 1 ? 'review' : 'reviews'} published.
              </Text>
            </View>
          }
          ListEmptyComponent={
            reviews.isPending ? (
              <View style={styles.skeletons}>
                {[0, 1, 2, 3].map((row) => (
                  <View key={row} style={styles.skeletonRow}>
                    <Skeleton width={46} height={62} radius={8} />
                    <View style={styles.skeletonBody}>
                      <Skeleton width="55%" height={12} />
                      <Skeleton width="85%" height={10} />
                      <Skeleton width="70%" height={10} />
                    </View>
                  </View>
                ))}
              </View>
            ) : reviews.isError ? (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>
                  {reviews.error instanceof ApiError && reviews.error.status === 403
                    ? 'Reviews are private.'
                    : "Couldn't load these reviews."}
                </Text>
                {reviews.error instanceof ApiError && reviews.error.status === 403 ? (
                  <Text style={styles.stateBody}>
                    Add this person as a friend to see what they think.
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>No reviews yet.</Text>
              </View>
            )
          }
          ListFooterComponent={
            reviews.isFetchingNextPage ? (
              <ActivityIndicator color={KueColors.ink3} style={styles.footer} />
            ) : undefined
          }
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (reviews.hasNextPage && !reviews.isFetchingNextPage) void reviews.fetchNextPage();
          }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
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
  },
  header: {
    gap: KueSpacing.xs,
    marginBottom: KueSpacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -KueSpacing.sm,
    marginBottom: KueSpacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 30,
    lineHeight: 34,
  },
  accent: {
    color: KueColors.accent,
  },
  subtitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  skeletons: {
    gap: KueSpacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: KueSpacing.md,
  },
  skeletonBody: {
    flex: 1,
    gap: 8,
    paddingTop: 4,
  },
  state: {
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.xxl,
  },
  stateTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 20,
  },
  stateBody: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: KueSpacing.lg,
  },
});
