import { useState } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import type { SpoilerRange } from '@/lib/api/reviews';

function mergeRanges(ranges: SpoilerRange[], length: number) {
  const valid = ranges
    .filter((range) => range && range.end > range.start)
    .map((range) => ({
      start: Math.max(0, Math.min(range.start, length)),
      end: Math.max(0, Math.min(range.end, length)),
    }))
    .sort((a, b) => a.start - b.start);

  const merged: SpoilerRange[] = [];
  valid.forEach((range) => {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
      return;
    }
    merged.push({ ...range });
  });

  return merged;
}

/**
 * Renders review text with spoiler ranges masked as blocks. Tap a block to
 * reveal that range. When the review is marked "spoilers" without ranges,
 * the whole body stays hidden until tapped.
 */
export function SpoilerText({
  content,
  spoilers = [],
  maskAll = false,
  style,
  numberOfLines,
}: {
  content: string;
  spoilers?: SpoilerRange[] | null;
  maskAll?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const [revealed, setRevealed] = useState<Record<number, true>>({});
  const [allRevealed, setAllRevealed] = useState(false);

  const ranges = mergeRanges(spoilers ?? [], content.length);

  if (maskAll && !allRevealed) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reveal spoiler review"
        onPress={() => setAllRevealed(true)}
        style={styles.allWrap}>
        <Text style={styles.allLabel}>Contains spoilers · tap to reveal</Text>
      </Pressable>
    );
  }

  if (ranges.length === 0) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {content}
      </Text>
    );
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (range.start > cursor) {
      parts.push(content.slice(cursor, range.start));
    }

    if (revealed[index]) {
      parts.push(content.slice(range.start, range.end));
    } else {
      parts.push(
        <Text
          key={`spoiler-${index}`}
          accessibilityRole="button"
          accessibilityLabel="Reveal spoiler"
          onPress={() => setRevealed((prev) => ({ ...prev, [index]: true }))}
          style={styles.block}>
          {'████'}
        </Text>,
      );
    }

    cursor = Math.max(cursor, range.end);
  });

  if (cursor < content.length) parts.push(content.slice(cursor));

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts}
    </Text>
  );
}

const styles = StyleSheet.create({
  block: {
    color: KueColors.accent,
    backgroundColor: KueColors.accentSoft,
    fontFamily: KueFonts.mono,
  },
  allWrap: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(207,165,68,0.4)',
    backgroundColor: 'rgba(207,165,68,0.08)',
    paddingHorizontal: KueSpacing.sm,
    paddingVertical: 6,
  },
  allLabel: {
    color: KueColors.series,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
