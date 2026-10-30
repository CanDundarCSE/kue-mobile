import { Image } from 'expo-image';
import { Heart, Star } from 'lucide-react-native';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import type { LibraryEntry } from '@/lib/api/library';

export const MEDIA_ACCENT: Record<string, string> = {
  movie: KueColors.movie,
  series: KueColors.series,
  game: KueColors.game,
  anime: KueColors.anime,
  manga: KueColors.manga,
};

const TYPE_LABEL: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

const STATUS: Record<string, { label: string; color: string }> = {
  watching: { label: 'Watching', color: KueColors.accent },
  in_progress: { label: 'In progress', color: KueColors.accent },
  playing: { label: 'Playing', color: KueColors.accent },
  reading: { label: 'Reading', color: KueColors.accent },
  completed: { label: 'Completed', color: KueColors.game },
  done: { label: 'Done', color: KueColors.game },
  watched: { label: 'Watched', color: KueColors.game },
  on_hold: { label: 'On hold', color: KueColors.series },
  hold: { label: 'On hold', color: KueColors.series },
  dropped: { label: 'Dropped', color: KueColors.movie },
  planning: { label: 'Planned', color: KueColors.ink3 },
  planned: { label: 'Planned', color: KueColors.ink3 },
};

export function mediaTypeOf(entry: LibraryEntry) {
  return entry.mediaType || entry.media.mediaType || 'movie';
}

export function statusOf(status: string) {
  const normalized = status.toLowerCase();
  return STATUS[normalized] ?? { label: status.replace(/_/g, ' '), color: KueColors.ink3 };
}

export function progressUnit(entry: LibraryEntry) {
  const unit = (entry.unitName ?? entry.media.unitName ?? '').toLowerCase();
  if (unit.includes('chapter')) return 'ch';
  if (unit.includes('episode')) return 'ep';
  if (unit.includes('hour')) return 'h';

  const type = mediaTypeOf(entry);
  if (type === 'manga') return 'ch';
  if (type === 'game') return 'h';
  if (type === 'movie') return 'film';
  return 'ep';
}

const COMPLETED_LABEL: Record<string, string> = {
  movie: 'watched',
  manga: 'read',
  game: 'played',
};

export function progressLabel(entry: LibraryEntry) {
  const type = mediaTypeOf(entry);
  const total = entry.totalUnits ?? entry.media.totalUnits ?? null;
  const current = entry.progress ?? 0;
  const completed = ['completed', 'done', 'watched'].includes(entry.status.toLowerCase());

  if (completed && (!total || total <= 1)) {
    return COMPLETED_LABEL[type] ?? 'completed';
  }

  const unit = progressUnit(entry);
  if (total && total > 0) {
    const percent = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    return `${current}/${total} ${unit} · ${percent}%`;
  }

  return `${current} ${unit}`;
}

function progressPercent(entry: LibraryEntry) {
  const total = entry.totalUnits ?? entry.media.totalUnits ?? null;
  if (!total || total <= 0) return null;
  const current = entry.progress ?? 0;
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

function ratingTone(rating: number) {
  if (rating >= 9.5) return { color: '#7dd3fc', background: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.30)' };
  if (rating >= 8) return { color: '#6ee7b7', background: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.30)' };
  if (rating >= 6) return { color: '#fcd34d', background: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.30)' };
  return { color: '#fda4af', background: 'rgba(251,113,133,0.10)', border: 'rgba(251,113,133,0.30)' };
}

export function LibraryRow({ entry, onPress }: { entry: LibraryEntry; onPress?: () => void }) {
  const type = mediaTypeOf(entry);
  const status = statusOf(entry.status);
  const percent = progressPercent(entry);
  const rating = entry.rating ?? null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Edit ${entry.media.title}` : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.posterWrap, { borderLeftColor: MEDIA_ACCENT[type] ?? KueColors.line2 }]}>
        {entry.media.coverImage ? (
          <Image source={{ uri: entry.media.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={styles.posterFallback}>{entry.media.title.charAt(0)}</Text>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {entry.media.title}
          </Text>
          {rating !== null ? (
            <View
              style={[
                styles.rating,
                { backgroundColor: ratingTone(rating).background, borderColor: ratingTone(rating).border },
              ]}>
              <Star color={ratingTone(rating).color} fill={ratingTone(rating).color} size={10} strokeWidth={1.5} />
              <Text style={[styles.ratingText, { color: ratingTone(rating).color }]}>{rating.toFixed(1)}</Text>
              <Text style={styles.ratingMax}>/10</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {[TYPE_LABEL[type] ?? type, entry.media.year].filter(Boolean).join(' · ')}
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: status.color }]} />
          <Text style={styles.statusLabel}>{status.label}</Text>
          {percent !== null ? <Text style={styles.progress}>{progressLabel(entry)}</Text> : null}
          {entry.isFavorite ? (
            <Heart color={KueColors.movie} size={11} fill={KueColors.movie} strokeWidth={1.5} />
          ) : null}
        </View>

        {percent !== null ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: KueSpacing.md,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  posterWrap: {
    width: 48,
    height: 64,
    borderRadius: 8,
    borderLeftWidth: 3,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterFallback: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 22,
  },
  body: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: KueSpacing.sm,
  },
  title: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingText: {
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  ratingMax: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 10,
    lineHeight: 14,
    opacity: 0.7,
  },
  meta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  progress: {
    marginLeft: 'auto',
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
  },
  track: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: KueColors.accent,
  },
});
