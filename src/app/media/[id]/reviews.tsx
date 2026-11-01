import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Plus, Star } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { ReviewComposer } from '@/features/reviews/review-composer';
import { SpoilerText } from '@/features/reviews/spoiler-text';
import { fetchLibraryEntry, fetchMediaDetails } from '@/lib/api/media';
import {
  createReview,
  fetchMediaReviewPage,
  fetchMyReviewForMedia,
  updateReview,
  type MediaReviewSort,
  type ReviewPayload,
  type UserReview,
} from '@/lib/api/reviews';
import { useResponsive } from '@/lib/responsive';

const PAGE_SIZE = 10;

const SORTS: { id: MediaReviewSort; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
];

const TYPE_LABEL: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

function first(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' ? single : '';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function reportReview(review: UserReview) {
  const subject = encodeURIComponent(`Report review #${review.id} on Kue`);
  const body = encodeURIComponent(
    [
      `Review: #${review.id}`,
      `Page: /media/${review.mediaId}/reviews`,
      '',
      'Why is this content unlawful or against the Terms of Service?',
      '',
      '',
    ].join('\n'),
  );
  void Linking.openURL(`mailto:candundarcse@gmail.com?subject=${subject}&body=${body}`).catch(
    () => undefined,
  );
}

export default function MediaReviewsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const mediaId = Number(first(id)) || 0;

  const [sort, setSort] = useState<MediaReviewSort>('newest');
  const [hideSpoilers, setHideSpoilers] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const mediaQuery = useQuery({
    queryKey: ['media', mediaId],
    queryFn: () => fetchMediaDetails(mediaId),
    enabled: mediaId > 0,
    staleTime: 5 * 60_000,
  });

  const entryQuery = useQuery({
    queryKey: ['media-entry', mediaId],
    queryFn: () => fetchLibraryEntry(mediaId),
    enabled: mediaId > 0,
  });

  const myReviewQuery = useQuery({
    queryKey: ['my-media-review', mediaId],
    queryFn: () => fetchMyReviewForMedia(mediaId),
    enabled: mediaId > 0,
  });

  const reviewsQuery = useInfiniteQuery({
    queryKey: ['media-reviews', mediaId, sort, hideSpoilers],
    queryFn: ({ pageParam }) =>
      fetchMediaReviewPage(mediaId, {
        page: pageParam,
        pageSize: PAGE_SIZE,
        sort,
        hideSpoilers,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: mediaId > 0,
  });

  const reviews = (reviewsQuery.data?.pages ?? []).flatMap((page) => page.items);
  const total = reviewsQuery.data?.pages[0]?.totalItems ?? 0;
  const media = mediaQuery.data;
  const myReview = myReviewQuery.data ?? null;
  const canWrite = entryQuery.data !== null || myReview !== null;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['media-reviews', mediaId] });
    await queryClient.invalidateQueries({ queryKey: ['my-media-review', mediaId] });
    await queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    await queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
    await queryClient.invalidateQueries({ queryKey: ['media-reviews-preview', mediaId] });
  };

  const submitReview = async (payload: ReviewPayload & { mediaId: number }) => {
    setSaving(true);
    setComposerError(null);
    try {
      if (myReview) {
        await updateReview(myReview.id, payload);
      } else {
        await createReview(payload.mediaId, payload);
      }
      setComposerOpen(false);
      await refresh();
    } catch (cause) {
      setComposerError(cause instanceof Error ? cause.message : 'Could not save the review.');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to title"
        hitSlop={8}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
      </Pressable>

      <Text style={styles.kicker}>Reviews</Text>
      <Text style={styles.title}>
        {media?.title ?? 'This title'}<Text style={styles.accent}>.</Text>
      </Text>
      <Text style={styles.subtitle}>
        {total} {total === 1 ? 'review' : 'reviews'} · {TYPE_LABEL[media?.mediaType ?? ''] ?? ''}
      </Text>

      {canWrite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={myReview ? 'Edit your review' : 'Write a review'}
          onPress={() => {
            setComposerError(null);
            setComposerOpen(true);
          }}
          style={({ pressed }) => [styles.writeButton, pressed && styles.pressed]}>
          {myReview ? (
            <Pencil color={KueColors.background} size={14} strokeWidth={2} />
          ) : (
            <Plus color={KueColors.background} size={14} strokeWidth={2.2} />
          )}
          <Text style={styles.writeLabel}>{myReview ? 'Edit your review' : 'Write a review'}</Text>
        </Pressable>
      ) : media ? (
        <Text style={styles.hint}>Add this title to your library to write a review.</Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}>
        {SORTS.map((option) => {
          const active = sort === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Sort ${option.label}`}
              onPress={() => setSort(option.id)}
              style={[styles.sortChip, active && styles.sortChipActive]}>
              <Text style={[styles.sortLabel, active && styles.sortLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.hideRow}>
        <Text style={styles.hideLabel}>Hide spoilers</Text>
        <Switch
          value={hideSpoilers}
          onValueChange={setHideSpoilers}
          trackColor={{ false: KueColors.line2, true: KueColors.accentSoft }}
          thumbColor={hideSpoilers ? KueColors.accent : KueColors.ink3}
          accessibilityLabel="Hide spoilers"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={reviews}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <UserAvatar username={item.username} size={32} />
                <View style={styles.author}>
                  <Text style={styles.authorName} numberOfLines={1}>
                    {item.username}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
                {typeof item.rating === 'number' ? (
                  <View style={styles.rating}>
                    <Star color={KueColors.accent} size={12} strokeWidth={2} />
                    <Text style={styles.ratingText}>{item.rating}/10</Text>
                  </View>
                ) : null}
              </View>

              <SpoilerText
                content={item.content}
                spoilers={item.spoilers ?? []}
                maskAll={item.containsSpoilers && (item.spoilers?.length ?? 0) === 0}
                style={styles.reviewText}
              />

              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Report review by ${item.username}`}
                onPress={() => reportReview(item)}
                hitSlop={8}
                style={styles.reportRow}>
                <Text style={styles.report}>Report</Text>
              </Pressable>
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            reviewsQuery.isPending ? (
              <View style={styles.skeletons}>
                {[0, 1, 2].map((row) => (
                  <View key={row} style={styles.card}>
                    <Skeleton width="40%" height={12} />
                    <Skeleton width="90%" height={10} />
                    <Skeleton width="75%" height={10} />
                  </View>
                ))}
              </View>
            ) : reviewsQuery.isError ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void reviewsQuery.refetch()}
                style={styles.state}>
                <Text style={styles.stateTitle}>Couldn&apos;t load reviews.</Text>
                <Text style={styles.stateBody}>Tap to try again.</Text>
              </Pressable>
            ) : (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>No reviews yet.</Text>
                <Text style={styles.stateBody}>
                  {canWrite ? 'Be the first to say what you think.' : 'Nothing here yet.'}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            reviewsQuery.isFetchingNextPage ? (
              <ActivityIndicator color={KueColors.ink3} style={styles.footer} />
            ) : undefined
          }
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (reviewsQuery.hasNextPage && !reviewsQuery.isFetchingNextPage) {
              void reviewsQuery.fetchNextPage();
            }
          }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      {composerOpen && media ? (
        <ReviewComposer
          review={myReview}
          initialMedia={
            myReview
              ? undefined
              : {
                  id: media.id,
                  title: media.title,
                  mediaType: media.mediaType,
                  coverImage: media.coverImage,
                  year: media.year,
                }
          }
          busy={saving}
          error={composerError}
          onSubmit={(payload) => void submitReview(payload)}
          onClose={() => {
            if (saving) return;
            setComposerOpen(false);
          }}
        />
      ) : null}
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
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -KueSpacing.sm,
    marginBottom: KueSpacing.sm,
  },
  pressed: { opacity: 0.7 },
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
  accent: { color: KueColors.accent },
  subtitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 42,
    marginTop: KueSpacing.sm,
    paddingHorizontal: KueSpacing.lg,
    borderRadius: 999,
    backgroundColor: KueColors.accent,
  },
  writeLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 12,
  },
  hint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
    marginTop: KueSpacing.xs,
  },
  sortRow: {
    gap: KueSpacing.sm,
    alignItems: 'center',
    paddingVertical: KueSpacing.sm,
  },
  sortChip: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  sortChipActive: {
    backgroundColor: KueColors.foreground,
    borderColor: KueColors.foreground,
  },
  sortLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sortLabelActive: { color: KueColors.background },
  hideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
    minHeight: 40,
  },
  hideLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
    marginBottom: KueSpacing.sm,
    gap: KueSpacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
  },
  author: { flex: 1, gap: 1 },
  authorName: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  date: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 10,
  },
  reviewText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  reportRow: { alignSelf: 'flex-start' },
  report: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  skeletons: { gap: KueSpacing.sm },
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
  footer: { paddingVertical: KueSpacing.lg },
});
