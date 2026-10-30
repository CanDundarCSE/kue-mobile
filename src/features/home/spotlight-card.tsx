import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from 'expo-image';
import { Check, Plus } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  addToLibrary,
  fetchContinue,
  fetchSpotlight,
  mediaKey,
  type MediaItem,
} from '@/lib/api/home';
import { lightHaptic } from '@/lib/haptics';

import { ErrorLine } from './continue-card';
import { SectionLabel } from './section-label';

const RAIL_GAP = 12;

function typeLabel(value: string) {
  switch (value) {
    case 'anime':
      return 'Anime';
    case 'series':
      return 'Series';
    case 'manga':
      return 'Manga';
    case 'game':
      return 'Game';
    default:
      return 'Film';
  }
}

function subtitle(item: MediaItem) {
  return [typeLabel(item.mediaType), item.year, item.score ? item.score.toFixed(1) : null]
    .filter(Boolean)
    .join(' · ');
}

export function SpotlightCard() {
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState<Record<string, true>>({});
  const [addingKey, setAddingKey] = useState<string | null>(null);

  const spotlightQuery = useQuery({
    queryKey: ['spotlight'],
    staleTime: 60_000,
    queryFn: async () => {
      const entries = await queryClient
        .fetchQuery({ queryKey: ['continue'], queryFn: fetchContinue })
        .catch(() => []);
      return fetchSpotlight(entries.find((entry) => entry.mediaId > 0));
    },
  });

  const add = async (item: MediaItem) => {
    const key = mediaKey(item);
    if (addingKey !== null || added[key]) return;
    setAddingKey(key);
    lightHaptic();
    try {
      await addToLibrary(item);
      setAdded((prev) => ({ ...prev, [key]: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert("Couldn't add this title", message);
    } finally {
      setAddingKey(null);
    }
  };

  const itemWidth = Math.min(width * 0.38, 168);
  const data = spotlightQuery.data;

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <SectionLabel>Spotlight</SectionLabel>
      </View>

      {spotlightQuery.isError ? (
        <ErrorLine onRetry={() => void spotlightQuery.refetch()} />
      ) : spotlightQuery.isPending ? (
        <View style={styles.loading}>
          <ActivityIndicator color={KueColors.ink3} />
        </View>
      ) : (
        <>
          <View style={styles.heading}>
            <Text style={styles.kicker}>{data?.kicker}</Text>
            <Text style={styles.title}>{data?.title}</Text>
          </View>

          {data && data.items.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={itemWidth + RAIL_GAP}
              contentContainerStyle={styles.rail}>
              {data.items.map((item) => (
                <View key={mediaKey(item)} style={{ width: itemWidth }}>
                  <View style={styles.posterWrap}>
                    <View style={styles.poster}>
                      {item.coverImage ? (
                        <Image source={{ uri: item.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : (
                        <Text style={styles.posterFallback}>{item.title.charAt(0)}</Text>
                      )}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.title} to planning`}
                      onPress={() => void add(item)}
                      hitSlop={6}
                      style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                      {addingKey === mediaKey(item) ? (
                        <ActivityIndicator color={KueColors.foreground} size="small" />
                      ) : added[mediaKey(item)] ? (
                        <Check color={KueColors.accent} size={14} strokeWidth={2.5} />
                      ) : (
                        <Plus color={KueColors.foreground} size={14} strokeWidth={2} />
                      )}
                    </Pressable>
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta} numberOfLines={1}>
                    {subtitle(item)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.empty}>No picks right now.</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: KueSpacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    paddingVertical: KueSpacing.xl,
  },
  heading: {
    gap: 2,
    paddingHorizontal: KueSpacing.xl,
  },
  labelRow: {
    paddingHorizontal: KueSpacing.xl,
  },
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 18,
  },
  rail: {
    gap: RAIL_GAP,
    paddingTop: KueSpacing.xs,
    paddingHorizontal: KueSpacing.xl,
  },
  posterWrap: {
    borderRadius: 12,
  },
  poster: {
    width: '100%',
    aspectRatio: 42 / 54,
    borderRadius: 12,
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
  addButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 17, 19, 0.85)',
  },
  itemTitle: {
    marginTop: KueSpacing.sm,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  itemMeta: {
    marginTop: 2,
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  loading: {
    alignItems: 'center',
    paddingVertical: KueSpacing.xl,
  },
  empty: {
    paddingHorizontal: KueSpacing.xl,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
});
