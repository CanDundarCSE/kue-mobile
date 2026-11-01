import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import type { UserReview } from '@/lib/api/reviews';
import { mediaHref } from '@/lib/media-href';

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** One review row, used on public profiles and the all-reviews page. */
export function ReviewCard({ review, clamp = true }: { review: UserReview; clamp?: boolean }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(!review.containsSpoilers);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={review.mediaTitle}
        onPress={() =>
          router.push(mediaHref({ id: review.mediaId, mediaType: review.mediaType }))
        }
        style={styles.posterWrap}>
        {review.mediaCoverImage ? (
          <Image
            source={{ uri: review.mediaCoverImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.posterFallback}>{review.mediaTitle.charAt(0)}</Text>
        )}
      </Pressable>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={review.mediaTitle}
            onPress={() =>
              router.push(mediaHref({ id: review.mediaId, mediaType: review.mediaType }))
            }
            style={styles.titlePress}>
            <Text style={styles.title} numberOfLines={1}>
              {review.mediaTitle}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {[TYPE_LABEL[review.mediaType] ?? review.mediaType, review.mediaYear]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </Pressable>

          <View style={styles.score}>
            {typeof review.rating === 'number' ? (
              <>
                <Star color={KueColors.accent} size={11} strokeWidth={2} />
                <Text style={styles.scoreText}>{review.rating}/10</Text>
              </>
            ) : null}
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>

        {revealed ? (
          clamp ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Read full review of ${review.mediaTitle}`}
              onPress={() => setOpen(true)}>
              <Text style={styles.content} numberOfLines={3}>
                {review.content}
              </Text>
              <Text style={styles.readMore}>Read full review</Text>
            </Pressable>
          ) : (
            <Text style={styles.content}>{review.content}</Text>
          )
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show spoiler review"
            onPress={() => setRevealed(true)}
            style={styles.spoilerBox}>
            <Text style={styles.spoilerText}>Contains spoilers · tap to read</Text>
          </Pressable>
        )}
      </View>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text style={styles.sheetKicker}>Review</Text>
        <Text style={styles.sheetTitle}>{review.mediaTitle}</Text>
        <View style={styles.sheetMetaRow}>
          <Text style={styles.sheetMeta}>
            {[TYPE_LABEL[review.mediaType] ?? review.mediaType, review.mediaYear]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text style={styles.sheetMeta}>{formatDate(review.createdAt)}</Text>
          {typeof review.rating === 'number' ? (
            <View style={styles.sheetRating}>
              <Star color={KueColors.accent} size={12} strokeWidth={2} />
              <Text style={styles.sheetRatingText}>{review.rating}/10</Text>
            </View>
          ) : null}
        </View>

        {review.containsSpoilers && !revealed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show spoiler review"
            onPress={() => setRevealed(true)}
            style={styles.spoilerBox}>
            <Text style={styles.spoilerText}>Contains spoilers · tap to read</Text>
          </Pressable>
        ) : (
          <Text style={styles.sheetContent}>{review.content}</Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${review.mediaTitle}`}
          onPress={() => {
            setOpen(false);
            router.push(mediaHref({ id: review.mediaId, mediaType: review.mediaType }));
          }}
          style={({ pressed }) => [styles.sheetButton, pressed && styles.pressed]}>
          <Text style={styles.sheetButtonLabel}>Open title</Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: KueSpacing.md,
    paddingVertical: KueSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  posterWrap: {
    width: 46,
    height: 62,
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
  body: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: KueSpacing.sm,
  },
  titlePress: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
  meta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  score: {
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreText: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 10,
  },
  date: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
  },
  content: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  readMore: {
    marginTop: 4,
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sheetKicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 24,
    lineHeight: 28,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: KueSpacing.sm,
  },
  sheetMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  sheetRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sheetRatingText: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 10,
  },
  sheetContent: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 14,
    lineHeight: 22,
  },
  sheetButton: {
    minHeight: 48,
    marginTop: KueSpacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetButtonLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  spoilerBox: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(207,165,68,0.4)',
    backgroundColor: 'rgba(207,165,68,0.08)',
    paddingHorizontal: KueSpacing.sm,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
  spoilerText: {
    color: KueColors.series,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
