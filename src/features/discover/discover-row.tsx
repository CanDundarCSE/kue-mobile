import { Image } from 'expo-image';
import { Check, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { addToLibrary, type MediaItem } from '@/lib/api/home';

import { MEDIA_ACCENT } from '@/features/library/library-row';

const TYPE_LABEL: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

export function mediaMeta(item: MediaItem) {
  return [
    TYPE_LABEL[item.mediaType] ?? item.mediaType,
    item.year,
    item.score !== null && item.score !== undefined ? item.score.toFixed(1) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

type AddState = 'idle' | 'loading' | 'added' | 'error';

/** One discover/search result with a compact add-to-library control. */
export function DiscoverRow({
  item,
  rank,
  onAdded,
  onPress,
}: {
  item: MediaItem;
  rank?: number;
  onAdded: () => void;
  onPress?: () => void;
}) {
  const [state, setState] = useState<AddState>('idle');

  const add = async () => {
    if (state === 'loading' || state === 'added') return;
    setState('loading');
    try {
      await addToLibrary(item);
      setState('added');
      onAdded();
    } catch {
      setState('error');
    }
  };

  return (
    <View style={styles.row}>
      {rank !== undefined ? (
        <Text style={styles.rank}>{String(rank).padStart(2, '0')}</Text>
      ) : null}

      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Open ${item.title}` : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={styles.main}>
        <View style={[styles.posterWrap, { borderLeftColor: MEDIA_ACCENT[item.mediaType] ?? KueColors.line2 }]}>
          {item.coverImage ? (
            <Image source={{ uri: item.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text style={styles.posterFallback}>{item.title.charAt(0)}</Text>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {mediaMeta(item)}
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          state === 'added' ? `${item.title} added to library` : `Add ${item.title} to library`
        }
        accessibilityState={{ disabled: state === 'loading' || state === 'added', busy: state === 'loading' }}
        disabled={state === 'loading' || state === 'added'}
        onPress={() => void add()}
        hitSlop={4}
        style={({ pressed }) => [
          styles.addButton,
          state === 'added' && styles.added,
          state === 'error' && styles.errored,
          pressed && styles.pressed,
        ]}>
        {state === 'loading' ? (
          <ActivityIndicator color={KueColors.ink2} size="small" />
        ) : state === 'added' ? (
          <Check color={KueColors.accent} size={16} strokeWidth={2.5} />
        ) : (
          <Plus color={state === 'error' ? KueColors.danger : KueColors.ink2} size={16} strokeWidth={2} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    paddingVertical: 10,
    paddingHorizontal: KueSpacing.md,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
  },
  rank: {
    width: 20,
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 11,
  },
  posterWrap: {
    width: 42,
    height: 54,
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
    fontSize: 20,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  meta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  added: {
    borderColor: 'transparent',
  },
  errored: {
    borderColor: KueColors.danger,
  },
  pressed: {
    opacity: 0.7,
  },
});
