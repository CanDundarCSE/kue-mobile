import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Globe, Lock, Pencil, Plus, Star, Trash2 } from 'lucide-react-native';
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
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { ReviewComposer } from '@/features/reviews/review-composer';
import { SpoilerText } from '@/features/reviews/spoiler-text';
import {
  createReview,
  deleteReview,
  fetchMyReviews,
  updateReview,
  type ReviewPayload,
  type UserReview,
} from '@/lib/api/reviews';
import { mediaHref } from '@/lib/media-href';
import { useResponsive } from '@/lib/responsive';

const PAGE_SIZE = 10;

type Filter = 'all' | 'public' | 'private';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'public', label: 'Public' },
  { id: 'private', label: 'Private' },
];

const TYPE_LABEL: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .replace(/^([a-z])/, (letter) => letter.toUpperCase());
}

export default function ReviewsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();

  const [filter, setFilter] = useState<Filter>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<UserReview | null>(null);
  const [deleting, setDeleting] = useState<UserReview | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reviewsQuery = useInfiniteQuery({
    queryKey: ['my-reviews', filter],
    queryFn: ({ pageParam }) =>
      fetchMyReviews(
        pageParam,
        PAGE_SIZE,
        filter === 'all' ? null : filter === 'public',
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const items = (reviewsQuery.data?.pages ?? []).flatMap((page) => page.items);
  const total = reviewsQuery.data?.pages[0]?.totalItems ?? 0;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    await queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
    await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };

  const openNew = () => {
    setEditing(null);
    setComposerError(null);
    setComposerOpen(true);
  };

  const openEdit = (review: UserReview) => {
    setEditing(review);
    setComposerError(null);
    setComposerOpen(true);
  };

  const submitReview = async (payload: ReviewPayload & { mediaId: number }) => {
    setSaving(true);
    setComposerError(null);
    try {
      if (editing) {
        await updateReview(editing.id, payload);
      } else {
        await createReview(payload.mediaId, payload);
      }
      setComposerOpen(false);
      setEditing(null);
      await refresh();
    } catch (cause) {
      setComposerError(cause instanceof Error ? cause.message : 'Could not save the review.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (review: UserReview) => {
    if (busyId !== null) return;
    setBusyId(review.id);
    setError(null);
    try {
      await updateReview(review.id, {
        content: review.content,
        rating: review.rating ?? null,
        containsSpoilers: review.containsSpoilers,
        spoilers: review.spoilers ?? [],
        isPublic: !review.isPublic,
      });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update visibility.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const review = deleting;
    setDeleting(null);
    setBusyId(review.id);
    setError(null);
    try {
      await deleteReview(review.id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the review.');
    } finally {
      setBusyId(null);
    }
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>Reviews</Text>
          <Text style={styles.title}>
            What you think<Text style={styles.accent}>.</Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Write a review"
          onPress={openNew}
          style={({ pressed }) => [styles.writeButton, pressed && styles.pressed]}>
          <Plus color={KueColors.background} size={16} strokeWidth={2.2} />
          <Text style={styles.writeLabel}>Write</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        {total} {total === 1 ? 'review' : 'reviews'} — one per title, in your own words.
      </Text>

      <View style={styles.segmented}>
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              onPress={() => setFilter(item.id)}
              style={styles.segment}>
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                {item.label}
              </Text>
              <View style={[styles.segmentUnderline, active && styles.segmentUnderlineActive]} />
            </Pressable>
          );
        })}
      </View>

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
            <ReviewRow
              review={item}
              busy={busyId === item.id}
              onOpen={() => router.push(mediaHref({ id: item.mediaId, mediaType: item.mediaType }))}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleting(item)}
              onToggleVisibility={() => void toggleVisibility(item)}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            reviewsQuery.isPending ? (
              <View style={styles.skeletons}>
                {[0, 1, 2].map((row) => (
                  <View key={row} style={styles.skeletonCard}>
                    <Skeleton width={42} height={54} radius={8} />
                    <View style={styles.skeletonBody}>
                      <Skeleton width="55%" height={14} />
                      <Skeleton width="30%" height={9} radius={4} />
                      <Skeleton width="90%" height={9} radius={4} />
                    </View>
                  </View>
                ))}
              </View>
            ) : reviewsQuery.isError ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void reviewsQuery.refetch()}
                style={styles.state}>
                <Text style={styles.stateTitle}>Couldn&apos;t load your reviews.</Text>
                <Text style={styles.stateBody}>Tap to try again.</Text>
              </Pressable>
            ) : (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>
                  {filter === 'all' ? 'Nothing written yet.' : `No ${filter} reviews.`}
                </Text>
                <Text style={styles.stateBody}>
                  {filter === 'all'
                    ? 'Pick a title from your library and say what you thought.'
                    : 'Switch the filter, or change a review’s visibility.'}
                </Text>
                {filter === 'all' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={openNew}
                    style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}>
                    <Plus color={KueColors.accent} size={14} strokeWidth={2} />
                    <Text style={styles.emptyActionLabel}>Write your first review</Text>
                  </Pressable>
                ) : null}
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

      {composerOpen ? (
        <ReviewComposer
          review={editing}
          busy={saving}
          error={composerError}
          onSubmit={(payload) => void submitReview(payload)}
          onClose={() => {
            if (saving) return;
            setComposerOpen(false);
            setEditing(null);
          }}
        />
      ) : null}

      <BottomSheet visible={deleting !== null} onClose={() => setDeleting(null)}>
        <Text style={styles.sheetTitle}>Delete review?</Text>
        <Text style={styles.sheetBody}>
          Your review of {deleting?.mediaTitle ?? 'this title'} will be removed permanently.
        </Text>
        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Keep review"
            onPress={() => setDeleting(null)}
            style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}>
            <Text style={styles.keepLabel}>Keep</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete review"
            onPress={() => void confirmDelete()}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
            <Text style={styles.deleteLabel}>Delete</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

function ReviewRow({
  review,
  busy,
  onOpen,
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  review: UserReview;
  busy: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={review.mediaTitle}
          onPress={onOpen}
          style={styles.mediaRow}>
          <View style={styles.poster}>
            {review.mediaCoverImage ? (
              <Image
                source={{ uri: review.mediaCoverImage }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.posterFallback}>{review.mediaTitle.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.mediaBody}>
            <Text style={styles.mediaTitle} numberOfLines={1}>
              {review.mediaTitle}
            </Text>
            <Text style={styles.mediaMeta}>
              {[TYPE_LABEL[review.mediaType] ?? review.mediaType, review.mediaYear]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </Pressable>

        {typeof review.rating === 'number' ? (
          <View style={styles.rating}>
            <Star color={KueColors.accent} size={12} strokeWidth={2} />
            <Text style={styles.ratingText}>{review.rating}/10</Text>
          </View>
        ) : null}
      </View>

      <SpoilerText
        content={review.content}
        spoilers={review.spoilers ?? []}
        maskAll={review.containsSpoilers && (review.spoilers?.length ?? 0) === 0}
        style={styles.reviewText}
      />

      <Text style={styles.meta}>
        Written {formatDate(review.createdAt)} · {review.isPublic ? 'Public' : 'Private'}
      </Text>

      <View style={styles.actions}>
        <View style={styles.actionGroup}>
          <ActionButton label="Edit" onPress={onEdit} disabled={busy}>
            <Pencil color={KueColors.ink2} size={13} strokeWidth={1.8} />
          </ActionButton>
          <ActionButton label="Delete" onPress={onDelete} disabled={busy}>
            <Trash2 color={KueColors.ink2} size={13} strokeWidth={1.8} />
          </ActionButton>
        </View>

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: review.isPublic }}
          accessibilityLabel={review.isPublic ? 'Make review private' : 'Make review public'}
          disabled={busy}
          onPress={onToggleVisibility}
          style={[styles.visibility, review.isPublic && styles.visibilityPublic]}>
          {busy ? (
            <ActivityIndicator color={KueColors.ink2} size="small" />
          ) : review.isPublic ? (
            <Globe color={KueColors.accent} size={12} strokeWidth={2} />
          ) : (
            <Lock color={KueColors.ink3} size={12} strokeWidth={2} />
          )}
          <Text style={[styles.visibilityLabel, review.isPublic && styles.visibilityLabelPublic]}>
            {review.isPublic ? 'Public' : 'Private'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ActionButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, pressed && styles.pressed, disabled && styles.disabled]}>
      {children}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
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
  },
  header: {
    gap: KueSpacing.sm,
    marginBottom: KueSpacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: KueSpacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: KueSpacing.xs,
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
    fontSize: 32,
    lineHeight: 36,
  },
  accent: {
    color: KueColors.accent,
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 999,
    backgroundColor: KueColors.accent,
  },
  writeLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 12,
  },
  subtitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  segmented: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
    marginTop: KueSpacing.xs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  segmentLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  segmentLabelActive: {
    color: KueColors.foreground,
  },
  segmentUnderline: {
    position: 'absolute',
    left: KueSpacing.xl,
    right: KueSpacing.xl,
    bottom: -StyleSheet.hairlineWidth,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  segmentUnderlineActive: {
    backgroundColor: KueColors.accent,
  },
  error: {
    color: KueColors.danger,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
    marginBottom: KueSpacing.md,
    gap: KueSpacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
  },
  mediaRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
  },
  poster: {
    width: 42,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterFallback: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 20,
  },
  mediaBody: {
    flex: 1,
    gap: 2,
  },
  mediaTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 18,
    lineHeight: 22,
  },
  mediaMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
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
  spoilerBox: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(207,165,68,0.4)',
    backgroundColor: 'rgba(207,165,68,0.08)',
    paddingHorizontal: KueSpacing.sm,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  spoilerLabel: {
    color: KueColors.series,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  meta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
    paddingTop: KueSpacing.sm,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  actionLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  visibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  visibilityPublic: {
    borderColor: 'rgba(126,143,255,0.45)',
    backgroundColor: KueColors.accentSoft,
  },
  visibilityLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  visibilityLabelPublic: {
    color: KueColors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  footer: {
    paddingVertical: KueSpacing.lg,
  },
  state: {
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.xxl,
    paddingHorizontal: KueSpacing.lg,
  },
  stateTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 20,
    textAlign: 'center',
  },
  stateBody: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: KueSpacing.sm,
    minHeight: 40,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  emptyActionLabel: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  skeletons: {
    gap: KueSpacing.md,
  },
  skeletonCard: {
    flexDirection: 'row',
    gap: KueSpacing.md,
    padding: KueSpacing.md,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
  },
  skeletonBody: {
    flex: 1,
    gap: 8,
  },
  sheetTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 22,
  },
  sheetBody: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
    marginTop: KueSpacing.sm,
  },
  keepButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansMedium,
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: KueColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
});
