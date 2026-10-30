import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OptionSheet, type SheetOption } from '@/components/option-sheet';
import { PickerChip } from '@/components/picker-chip';
import { Skeleton } from '@/components/skeleton';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { DiscoverRow } from '@/features/discover/discover-row';
import { fetchTopRated, fetchTrendingByType } from '@/lib/api/discover';
import type { MediaItem } from '@/lib/api/home';
import { mediaHref } from '@/lib/media-href';
import { useResponsive } from '@/lib/responsive';

type TypeFilter = 'all' | 'movie' | 'series' | 'game' | 'anime' | 'manga';

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'movie', label: 'Film' },
  { id: 'series', label: 'Series' },
  { id: 'game', label: 'Game' },
  { id: 'anime', label: 'Anime' },
  { id: 'manga', label: 'Manga' },
];

export default function DiscoverScreen() {
  const { contentWidth, gutter } = useResponsive();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [type, setType] = useState<TypeFilter>('all');
  const [typeOpen, setTypeOpen] = useState(false);
  const [input, setInput] = useState('');

  const activeType = type === 'all' ? null : type;

  const typeOptions: SheetOption<TypeFilter>[] = TYPE_TABS.map((tab) => ({
    value: tab.id,
    label: tab.label,
  }));

  const top = useQuery({
    queryKey: ['discover-top', type],
    queryFn: () => fetchTopRated(activeType, 10),
    staleTime: 60_000,
  });

  const trending = useQuery({
    queryKey: ['discover-trending', type],
    queryFn: () => fetchTrendingByType(activeType, 10),
    staleTime: 60_000,
  });

  const refreshLibrary = () => {
    void queryClient.invalidateQueries({ queryKey: ['library'] });
    void queryClient.invalidateQueries({ queryKey: ['library-overview'] });
    void queryClient.invalidateQueries({ queryKey: ['continue'] });
  };

  const submit = () => {
    const next = input.trim();
    if (!next) return;
    router.push({ pathname: '/search', params: { q: next } });
  };

  const clearSearch = () => {
    setInput('');
  };

  const openMedia = (item: MediaItem) => router.push(mediaHref(item));

  const onAdded = refreshLibrary;

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
          <Text style={styles.kicker}>Discover</Text>
          <Text style={styles.title}>
            Find it once<Text style={styles.accent}>.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Films, series, games, anime and manga in a single search — synced nightly from TMDB,
            AniList and IGDB.
          </Text>

          <View style={styles.searchField}>
            <Search color={KueColors.ink3} size={16} strokeWidth={2} />
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={submit}
              placeholder="Search by title, author or genre..."
              placeholderTextColor={KueColors.ink3}
              returnKeyType="search"
              autoCorrect={false}
              style={styles.searchInput}
              accessibilityLabel="Search by title, author or genre"
            />
            {input.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
                onPress={clearSearch}>
                <X color={KueColors.ink3} size={16} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.pickerRow}>
            <PickerChip
              label="Type"
              value={TYPE_TABS.find((tab) => tab.id === type)?.label ?? 'All types'}
              onPress={() => setTypeOpen(true)}
            />
          </View>

          <Section
            title="Top rated media"
            empty="No top-rated titles right now."
            retry={() => void top.refetch()}
            pending={top.isPending}
            error={top.isError}
            items={top.data ?? []}
            onAdded={onAdded}
            onOpen={openMedia}
            showRank
          />
          <Section
            title="Trending this week"
            empty="No trending titles right now."
            retry={() => void trending.refetch()}
            pending={trending.isPending}
            error={trending.isError}
            items={trending.data ?? []}
            onAdded={onAdded}
            onOpen={openMedia}
            showRank
          />
        </ScrollView>
      </SafeAreaView>

      <OptionSheet
        visible={typeOpen}
        title="Media type"
        options={typeOptions}
        value={type}
        onSelect={(next) => {
          setType(next);
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
    </View>
  );
}

function Section({
  title,
  empty,
  retry,
  pending,
  error,
  items,
  onAdded,
  onOpen,
  showRank = false,
}: {
  title: string;
  empty: string;
  retry: () => void;
  pending: boolean;
  error: boolean;
  items: MediaItem[];
  onAdded: () => void;
  onOpen: (item: MediaItem) => void;
  showRank?: boolean;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <View style={styles.sectionBody}>
        {pending ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3, 4].map((row) => (
              <View key={row} style={styles.skeletonRow}>
                <Skeleton width={42} height={54} radius={8} />
                <View style={styles.skeletonText}>
                  <Skeleton width="55%" height={12} />
                  <Skeleton width="30%" height={8} radius={4} />
                </View>
                <Skeleton width={40} height={40} radius={10} />
              </View>
            ))}
          </View>
        ) : error ? (
          <View style={styles.state}>
            <Text style={styles.stateText}>{`Couldn't load these titles.`}</Text>
            <Pressable accessibilityRole="button" onPress={retry} hitSlop={8}>
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.stateText}>{empty}</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <DiscoverRow
              key={`${item.id}-${item.externalSource ?? ''}-${item.externalId ?? ''}-${index}`}
              item={item}
              rank={showRank ? index + 1 : undefined}
              onAdded={onAdded}
              onPress={() => onOpen(item)}
            />
          ))
        )}
      </View>
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
    marginTop: KueSpacing.xs,
  },
  accent: {
    color: KueColors.accent,
  },
  subtitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
    marginTop: KueSpacing.sm,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    height: 48,
    marginTop: KueSpacing.lg,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
  },
  searchInput: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 14,
    paddingVertical: 0,
  },
  pickerRow: {
    flexDirection: 'row',
    marginTop: KueSpacing.lg,
  },
  section: {
    marginTop: KueSpacing.xl,
  },
  sectionHeader: {
    marginBottom: KueSpacing.sm,
  },
  sectionTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  sectionBody: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    overflow: 'hidden',
  },
  skeletonList: {
    paddingVertical: KueSpacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    paddingVertical: 10,
    paddingHorizontal: KueSpacing.md,
  },
  skeletonText: {
    flex: 1,
    gap: 8,
  },
  state: {
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.xl,
    paddingHorizontal: KueSpacing.lg,
  },
  stateText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    textAlign: 'center',
  },
  retry: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
