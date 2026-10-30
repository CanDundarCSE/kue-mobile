import Slider from '@react-native-community/slider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Minus, Plus, Share2, Star } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { MEDIA_ACCENT } from '@/features/library/library-row';
import {
  addMediaToLibrary,
  fetchExternalMedia,
  fetchLibraryEntry,
  fetchMediaDetails,
  fetchMediaReviews,
  fetchSimilarMedia,
  type MediaDetails,
  type MediaLibraryEntry,
} from '@/lib/api/media';
import { updateLibraryEntry, type UpdateLibraryParams } from '@/lib/api/library';
import { mediaHref } from '@/lib/media-href';
import { useResponsive } from '@/lib/responsive';

const TYPE_LABEL: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

const STATUS_CHOICES: { value: string; label: string; color: string }[] = [
  { value: 'in_progress', label: 'In progress', color: KueColors.accent },
  { value: 'on_hold', label: 'On hold', color: KueColors.series },
  { value: 'planning', label: 'Planned', color: KueColors.ink3 },
  { value: 'completed', label: 'Done', color: KueColors.game },
  { value: 'dropped', label: 'Dropped', color: KueColors.movie },
];

function first(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' ? single : '';
}

function cleanDescription(raw?: string | null) {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unitOf(media: MediaDetails) {
  const raw = (media.unitName ?? '').toLowerCase();
  if (raw.includes('chapter')) return 'ch';
  if (raw.includes('episode')) return 'ep';
  if (raw.includes('hour')) return 'h';
  if (media.mediaType === 'manga') return 'ch';
  if (media.mediaType === 'game') return 'h';
  if (media.mediaType === 'movie') return 'film';
  return 'ep';
}

function scoreLabel(media: MediaDetails) {
  if (media.score === null || media.score === undefined) return null;
  const value = media.score > 10 ? media.score / 10 : media.score;
  return value.toFixed(1);
}

export default function MediaDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();
  const params = useLocalSearchParams<{
    id?: string;
    source?: string;
    externalId?: string;
    type?: string;
  }>();

  const id = Number(first(params.id)) || 0;
  const source = first(params.source);
  const externalId = first(params.externalId);
  const externalType = first(params.type);

  const mediaQuery = useQuery({
    queryKey: ['media', id, source, externalId, externalType],
    queryFn: () =>
      id > 0
        ? fetchMediaDetails(id)
        : fetchExternalMedia({
            source,
            externalId,
            type: externalType || 'movie',
          }),
    staleTime: 5 * 60_000,
  });

  const media = mediaQuery.data;

  const entryQuery = useQuery({
    queryKey: ['media-entry', media?.id ?? 0],
    queryFn: () => fetchLibraryEntry(media!.id),
    enabled: !!media && media.id > 0,
    staleTime: 30_000,
  });

  const similarQuery = useQuery({
    queryKey: ['media-similar', media?.id ?? 0, media?.externalId ?? ''],
    queryFn: () => fetchSimilarMedia(media!),
    enabled: !!media,
    staleTime: 5 * 60_000,
  });

  const reviewsQuery = useQuery({
    queryKey: ['media-reviews', media?.id ?? 0],
    queryFn: () => fetchMediaReviews(media!.id, 3),
    enabled: !!media && media.id > 0,
    staleTime: 60_000,
  });

  const [localEntry, setLocalEntry] = useState<MediaLibraryEntry | null | undefined>(undefined);
  const entry = localEntry !== undefined ? localEntry : (entryQuery.data ?? null);

  const [rating, setRating] = useState<number | null>(null);
  const [hoursText, setHoursText] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayedRating = rating ?? entry?.rating ?? null;
  const current = entry?.progress ?? 0;
  const total = media?.totalUnits ?? null;
  const unit = media ? unitOf(media) : 'ep';
  const episodic = media?.mediaType === 'series' || media?.mediaType === 'anime' || media?.mediaType === 'manga';
  const isGame = media?.mediaType === 'game';
  const percent = total && total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['library'] });
    await queryClient.invalidateQueries({ queryKey: ['library-overview'] });
    await queryClient.invalidateQueries({ queryKey: ['continue'] });
  };

  const ensureEntry = async (): Promise<MediaLibraryEntry> => {
    if (entry) return entry;

    const created = await addMediaToLibrary(media!, 'planning');
    setLocalEntry(created);
    if (media!.id === 0) void mediaQuery.refetch();
    return created;
  };

  const save = async (next: UpdateLibraryParams, derive?: (base: MediaLibraryEntry) => MediaLibraryEntry) => {
    if (!media || updating) return;
    setUpdating(true);
    setError(null);
    try {
      const base = await ensureEntry();
      await updateLibraryEntry(base.mediaId, next);
      const merged: MediaLibraryEntry = {
        ...base,
        ...(next.status !== undefined ? { status: next.status } : null),
        ...(next.progress !== undefined ? { progress: next.progress } : null),
        ...(next.rating !== undefined ? { rating: next.rating } : null),
        ...(next.isFavorite !== undefined ? { isFavorite: next.isFavorite } : null),
        ...(next.platform !== undefined ? { platform: next.platform } : null),
      };
      setLocalEntry(derive ? derive(merged) : merged);
      void refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your changes.');
    } finally {
      setUpdating(false);
    }
  };

  const step = (delta: number) => {
    const limit = total ?? Number.MAX_SAFE_INTEGER;
    const next = Math.max(0, Math.min(limit, current + delta));
    if (next === current) return;
    void save({ progress: next, ...(next >= (total ?? Infinity) ? { status: 'completed' } : {}) });
  };

  const submitHours = () => {
    if (hoursText === null) return;
    const parsed = Number.parseInt(hoursText, 10);
    setHoursText(null);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed === current) return;
    void save({ progress: parsed });
  };

  const share = () => {
    if (!media) return;
    void Share.share({
      message: `${media.title}${media.year ? ` (${media.year})` : ''} — Kue`,
    });
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

  if (mediaQuery.isPending) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={[styles.content, { width: contentWidth, paddingHorizontal: gutter }]}>
            <View style={styles.topRow}>{back}</View>
            <Skeleton height={180} radius={16} />
            <Skeleton width="40%" height={10} style={styles.skeletonGap} />
            <Skeleton width="85%" height={32} />
            <Skeleton width="100%" height={12} />
            <Skeleton width="92%" height={12} />
            <Skeleton height={220} radius={16} style={styles.skeletonGap} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (mediaQuery.isError || !media) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={[styles.content, { width: contentWidth, paddingHorizontal: gutter }]}>
            <View style={styles.topRow}>{back}</View>
            <View style={styles.state}>
              <Text style={styles.stateTitle}>Media not found.</Text>
              <Text style={styles.stateBody}>
                We couldn&apos;t find this title in the catalog or database.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const accent = MEDIA_ACCENT[media.mediaType] ?? KueColors.line2;
  const score = scoreLabel(media);
  const description = cleanDescription(media.description);
  const platforms = (media.platforms ?? []).filter((platform) => platform.trim());
  const similar = similarQuery.data ?? [];
  const reviews = reviewsQuery.data ?? [];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            {back}
            <Text style={styles.kicker}>{TYPE_LABEL[media.mediaType] ?? media.mediaType}</Text>
          </View>

          {media.bannerImage ? (
            <View style={styles.banner}>
              <Image source={{ uri: media.bannerImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={['transparent', KueColors.background]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <View style={[styles.typeDot, { backgroundColor: accent }]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {[TYPE_LABEL[media.mediaType] ?? media.mediaType, media.year, media.developer || media.externalSource]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>

          <Text style={styles.title}>{media.title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}

          <View style={styles.pills}>
            {score ? (
              <View style={[styles.pill, styles.scorePill]}>
                <Star color={KueColors.accent} fill={KueColors.accent} size={10} strokeWidth={1.5} />
                <Text style={styles.scoreText}>{score} / 10</Text>
              </View>
            ) : null}
            {total ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  {total} {unit}
                </Text>
              </View>
            ) : media.runtimeMinutes ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{media.runtimeMinutes} min</Text>
              </View>
            ) : null}
            {(media.genres ?? []).slice(0, 3).map((genre) => (
              <View key={genre} style={styles.pill}>
                <Text style={styles.pillText}>{genre}</Text>
              </View>
            ))}
            <View style={[styles.pill, styles.sourcePill]}>
              <View style={styles.sourceDot} />
              <Text style={styles.pillText}>{media.externalSource || 'Kue'}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: entry?.isFavorite ?? false }}
              accessibilityLabel={entry?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              disabled={updating}
              onPress={() => void save({ isFavorite: !(entry?.isFavorite ?? false) })}
              style={({ pressed }) => [
                styles.actionButton,
                entry?.isFavorite && styles.favoriteActive,
                pressed && styles.pressed,
              ]}>
              <Heart
                color={entry?.isFavorite ? KueColors.movie : KueColors.ink3}
                fill={entry?.isFavorite ? KueColors.movie : 'transparent'}
                size={15}
                strokeWidth={1.8}
              />
              <Text style={[styles.actionLabel, entry?.isFavorite && styles.favoriteActiveLabel]}>
                {entry?.isFavorite ? 'Favorited' : 'Favorite'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share title"
              onPress={share}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Share2 color={KueColors.ink3} size={15} strokeWidth={1.8} />
              <Text style={styles.actionLabel}>Share</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your progress</Text>
              {!entry ? <Text style={styles.notTracked}>Not in library</Text> : null}
              <View style={styles.rule} />
              {updating ? <ActivityIndicator color={KueColors.ink3} size="small" /> : null}
            </View>

            {episodic ? (
              <>
                <View style={styles.progressNumbers}>
                  <Text style={styles.progressCurrent}>{entry ? current : '—'}</Text>
                  <Text style={styles.progressTotal}>
                    / {total ?? '—'} {unit}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${percent}%` }]} />
                </View>
                <View style={styles.stepperRow}>
                  <StepButton label="Decrease progress" disabled={updating || current <= 0} onPress={() => step(-1)}>
                    <Minus color={KueColors.foreground} size={18} strokeWidth={2} />
                  </StepButton>
                  <View style={styles.stepperValue}>
                    <Text style={styles.stepperPercent}>{percent}%</Text>
                  </View>
                  <StepButton
                    label="Increase progress"
                    disabled={updating || (total !== null && current >= total)}
                    onPress={() => step(1)}>
                    <Plus color={KueColors.foreground} size={18} strokeWidth={2} />
                  </StepButton>
                </View>
              </>
            ) : null}

            {isGame ? (
              <View style={styles.hoursRow}>
                <StepButton label="Decrease hours" disabled={updating || current <= 0} onPress={() => step(-1)}>
                  <Minus color={KueColors.foreground} size={18} strokeWidth={2} />
                </StepButton>
                <View style={styles.hoursField}>
                  <TextInput
                    value={hoursText ?? String(current)}
                    onChangeText={setHoursText}
                    onSubmitEditing={submitHours}
                    onBlur={submitHours}
                    keyboardType="number-pad"
                    editable={!updating}
                    style={styles.hoursInput}
                    accessibilityLabel="Hours played"
                  />
                  <Text style={styles.hoursUnit}>hours played</Text>
                </View>
                <StepButton label="Increase hours" disabled={updating} onPress={() => step(1)}>
                  <Plus color={KueColors.foreground} size={18} strokeWidth={2} />
                </StepButton>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Your rating</Text>
            <View style={styles.ratingRow}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={displayedRating ?? 5}
                minimumTrackTintColor={KueColors.accent}
                maximumTrackTintColor={KueColors.line2}
                thumbTintColor={KueColors.accent}
                disabled={updating}
                onValueChange={(value) => setRating(Math.round(value))}
                onSlidingComplete={(value) => {
                  const next = Math.round(value);
                  setRating(next);
                  if (next !== (entry?.rating ?? null)) void save({ rating: next });
                }}
                accessibilityLabel="Your rating out of 10"
              />
              <Text style={[styles.ratingValue, displayedRating === null && styles.ratingEmpty]}>
                {displayedRating === null ? '—' : `${displayedRating}/10`}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Status</Text>
            <View style={styles.statusRow}>
              {STATUS_CHOICES.map((choice) => {
                const active = entry?.status === choice.value;
                return (
                  <Pressable
                    key={choice.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={choice.label}
                    disabled={updating}
                    onPress={() => void save({ status: choice.value })}
                    style={({ pressed }) => [
                      styles.statusPill,
                      active && { borderColor: choice.color, backgroundColor: KueColors.surface3 },
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.statusDot, { backgroundColor: choice.color }]} />
                    <Text style={[styles.statusText, active && styles.statusTextActive]}>
                      {choice.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isGame && platforms.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Platform</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformRow}>
                  {platforms.map((platform) => {
                    const active = (entry?.platform ?? '').toLowerCase() === platform.toLowerCase();
                    return (
                      <Pressable
                        key={platform}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={platform}
                        disabled={updating}
                        onPress={() => void save({ platform })}
                        style={({ pressed }) => [
                          styles.platformChip,
                          active && styles.platformChipActive,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={[styles.platformText, active && styles.platformTextActive]}>
                          {platform}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

            {!entry ? (
              <Text style={styles.hint}>Pick a status to start tracking this title.</Text>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Details</Text>
              <View style={styles.rule} />
            </View>
            <DetailRow label="Format" value={TYPE_LABEL[media.mediaType] ?? media.mediaType} />
            {media.status ? <DetailRow label="Status" value={media.status} /> : null}
            {media.year ? <DetailRow label="Released" value={String(media.year)} /> : null}
            {media.developer ? <DetailRow label="Developer" value={media.developer} /> : null}
            {media.genres?.length ? <DetailRow label="Genres" value={media.genres.slice(0, 4).join(', ')} /> : null}
            <DetailRow label="Source" value={media.externalSource || 'Kue'} />
            {platforms.length > 0 ? <DetailRow label="Platforms" value={platforms.slice(0, 4).join(', ')} /> : null}
          </View>

          {similar.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>More like this</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarRow}>
                {similar.map((item) => (
                  <Pressable
                    key={`${item.id}-${item.externalId}-${item.title}`}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    onPress={() => router.push(mediaHref(item))}
                    style={({ pressed }) => [styles.similarCard, pressed && styles.pressed]}>
                    <View style={styles.similarPoster}>
                      {item.coverImage ? (
                        <Image source={{ uri: item.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : (
                        <Text style={styles.posterFallback}>{item.title.charAt(0)}</Text>
                      )}
                    </View>
                    <Text style={styles.similarTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {reviews.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Reviews</Text>
                <View style={styles.rule} />
              </View>
              {reviews.map((review) => (
                <View key={review.id} style={styles.review}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewUser} numberOfLines={1}>
                      {review.username}
                    </Text>
                    {review.rating !== null && review.rating !== undefined ? (
                      <Text style={styles.reviewRating}>{review.rating}/10</Text>
                    ) : null}
                  </View>
                  <Text style={styles.reviewBody} numberOfLines={4}>
                    {review.content}
                  </Text>
                  {review.containsSpoilers ? (
                    <Text style={styles.reviewSpoiler}>Contains spoilers</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function StepButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.stepButton, pressed && styles.pressed, disabled && styles.disabled]}>
      {children}
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
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  skeletonGap: {
    marginTop: KueSpacing.md,
  },
  banner: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  metaText: {
    flex: 1,
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 36,
    lineHeight: 40,
  },
  description: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderColor: 'rgba(126,143,255,0.5)',
  },
  scoreText: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderStyle: 'dashed',
  },
  sourceDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: KueColors.game,
  },
  actions: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  favoriteActive: {
    borderColor: 'rgba(217,112,90,0.45)',
    backgroundColor: 'rgba(217,112,90,0.10)',
  },
  actionLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  favoriteActiveLabel: {
    color: KueColors.movie,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.lg,
    gap: KueSpacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
  },
  cardTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  notTracked: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: KueColors.line2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: KueColors.line,
  },
  progressNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: KueSpacing.sm,
  },
  progressCurrent: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 46,
    lineHeight: 48,
  },
  progressTotal: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 20,
    fontStyle: 'italic',
  },
  track: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: KueColors.accent,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: KueSpacing.sm,
  },
  stepperValue: {
    flex: 1,
    alignItems: 'center',
  },
  stepperPercent: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 12,
    letterSpacing: 1,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    marginTop: KueSpacing.sm,
  },
  hoursField: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  hoursInput: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 34,
    textAlign: 'center',
    paddingVertical: 0,
    minWidth: 90,
  },
  hoursUnit: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: KueSpacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  ratingValue: {
    width: 48,
    textAlign: 'right',
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 13,
  },
  ratingEmpty: {
    color: KueColors.ink3,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KueSpacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  statusTextActive: {
    color: KueColors.foreground,
  },
  platformRow: {
    gap: KueSpacing.sm,
  },
  platformChip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  platformChipActive: {
    borderColor: KueColors.accent,
    backgroundColor: KueColors.accentSoft,
  },
  platformText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  platformTextActive: {
    color: KueColors.foreground,
  },
  hint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
    marginTop: KueSpacing.sm,
  },
  error: {
    color: KueColors.danger,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    marginTop: KueSpacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: KueSpacing.lg,
    paddingVertical: 6,
  },
  detailLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
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
  similarRow: {
    gap: KueSpacing.md,
    paddingVertical: KueSpacing.xs,
  },
  similarCard: {
    width: 104,
    gap: 6,
  },
  similarPoster: {
    width: 104,
    aspectRatio: 42 / 54,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterFallback: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 28,
  },
  similarTitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansMedium,
    fontSize: 11,
    lineHeight: 15,
  },
  review: {
    gap: 4,
    paddingVertical: KueSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
  },
  reviewUser: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  reviewRating: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 10,
  },
  reviewBody: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  reviewSpoiler: {
    color: KueColors.series,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
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
    fontSize: 24,
  },
  stateBody: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    textAlign: 'center',
  },
});
