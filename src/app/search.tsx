import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
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
import { searchMedia } from '@/lib/api/discover';
import type { MediaItem } from '@/lib/api/home';
import { mediaHref } from '@/lib/media-href';
import { useResponsive } from '@/lib/responsive';

const PAGE_SIZE = 24;

type TypeFilter = 'all' | 'movie' | 'series' | 'game' | 'anime' | 'manga';
type SortOption = 'relevance' | 'newest' | 'oldest' | 'highest' | 'lowest';
type Picker = 'type' | 'sort' | 'score' | null;

const TYPE_OPTIONS: SheetOption<TypeFilter>[] = [
  { value: 'all', label: 'All types' },
  { value: 'movie', label: 'Film' },
  { value: 'series', label: 'Series' },
  { value: 'game', label: 'Game' },
  { value: 'anime', label: 'Anime' },
  { value: 'manga', label: 'Manga' },
];

const SORT_OPTIONS: SheetOption<SortOption>[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Top rated' },
  { value: 'lowest', label: 'Lowest rated' },
];

const SCORE_OPTIONS: SheetOption<string>[] = [
  { value: '', label: 'Any score' },
  { value: '6', label: '6 or higher' },
  { value: '7', label: '7 or higher' },
  { value: '8', label: '8 or higher' },
  { value: '9', label: '9 or higher' },
];

const CURRENT_YEAR = new Date().getFullYear();

function first(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' ? single : '';
}

export default function SearchScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();
  const params = useLocalSearchParams<{
    q?: string;
    type?: string;
    sort?: string;
    year?: string;
    minScore?: string;
  }>();

  const initialQuery = first(params.q);
  const [input, setInput] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(initialQuery);
  const [type, setType] = useState<TypeFilter>(() => {
    const raw = first(params.type);
    return TYPE_OPTIONS.some((option) => option.value === raw) ? (raw as TypeFilter) : 'all';
  });
  const [sort, setSort] = useState<SortOption>(() => {
    const raw = first(params.sort);
    return SORT_OPTIONS.some((option) => option.value === raw) ? (raw as SortOption) : 'relevance';
  });
  const [year, setYear] = useState<string>(() => first(params.year));
  const [yearText, setYearText] = useState<string>(() => first(params.year));
  const [minScore, setMinScore] = useState<string>(() => first(params.minScore));
  const [picker, setPicker] = useState<Picker>(null);

  const results = useInfiniteQuery({
    queryKey: ['search-results', submitted, type, sort, year, minScore],
    queryFn: ({ pageParam }) =>
      searchMedia({
        query: submitted,
        type: type === 'all' ? null : type,
        sort: sort === 'relevance' ? null : sort,
        year: year ? Number(year) : null,
        minScore: minScore ? Number(minScore) : null,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: submitted.length > 0,
  });

  const items = (results.data?.pages ?? []).flatMap((page) => page.items);
  const total = results.data?.pages[0]?.totalItems ?? 0;
  const refined = type !== 'all' || sort !== 'relevance' || year !== '' || minScore !== '';

  const submit = () => {
    const next = input.trim();
    setSubmitted(next);
  };

  const reset = () => {
    setType('all');
    setSort('relevance');
    setYear('');
    setYearText('');
    setMinScore('');
  };

  const changeYear = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setYearText(digits);

    if (digits.length === 0) {
      setYear('');
      return;
    }

    const parsed = Number(digits);
    if (digits.length === 4 && parsed >= 1800 && parsed <= CURRENT_YEAR) {
      setYear(digits);
    }
  };

  const commitYear = () => {
    const digits = yearText.replace(/\D/g, '');
    if (!digits) {
      setYear('');
      setYearText('');
      return;
    }

    const value = Number(digits);
    if (Number.isInteger(value) && value >= 1800 && value <= CURRENT_YEAR) {
      setYear(String(value));
      setYearText(String(value));
      return;
    }

    setYearText(year);
  };

  const openMedia = (item: MediaItem) => router.push(mediaHref(item));

  const onAdded = () => {
    void queryClient.invalidateQueries({ queryKey: ['library'] });
    void queryClient.invalidateQueries({ queryKey: ['library-overview'] });
    void queryClient.invalidateQueries({ queryKey: ['continue'] });
  };

  const scoreValue = minScore ? `${minScore}+` : 'Any score';

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={items}
          keyExtractor={(item, index) =>
            `${item.id}-${item.externalSource ?? ''}-${item.externalId ?? ''}-${index}`
          }
          renderItem={({ item }) => (
            <DiscoverRow item={item} onAdded={onAdded} onPress={() => openMedia(item)} />
          )}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.topRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  hitSlop={8}
                  onPress={() => router.back()}
                  style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
                  <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
                </Pressable>
                <Text style={styles.kicker}>Search</Text>
              </View>

              <View style={styles.searchField}>
                <SearchIcon color={KueColors.ink3} size={16} strokeWidth={2} />
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
                    onPress={() => setInput('')}>
                    <X color={KueColors.ink3} size={16} strokeWidth={2} />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.chips}>
                <PickerChip
                  label="Type"
                  value={TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'All types'}
                  onPress={() => setPicker('type')}
                  style={styles.chip}
                />
                <PickerChip
                  label="Sort"
                  value={SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Relevance'}
                  onPress={() => setPicker('sort')}
                  style={styles.chip}
                />
                <View style={[styles.chip, styles.yearChip]}>
                  <Text style={styles.yearLabel}>Year</Text>
                  <View style={styles.yearRow}>
                    <TextInput
                      value={yearText}
                      onChangeText={changeYear}
                      onSubmitEditing={commitYear}
                      onBlur={commitYear}
                      placeholder="Any"
                      placeholderTextColor={KueColors.ink3}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      maxLength={4}
                      style={styles.yearInput}
                      accessibilityLabel="Filter by release year"
                    />
                    {yearText.length > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear year"
                        hitSlop={8}
                        onPress={() => {
                          setYearText('');
                          setYear('');
                        }}>
                        <X color={KueColors.ink3} size={12} strokeWidth={2} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                <PickerChip
                  label="Score"
                  value={scoreValue}
                  onPress={() => setPicker('score')}
                  style={styles.chip}
                />
              </View>

              {submitted.length > 0 ? (
                <View style={styles.summary}>
                  <Text style={styles.summaryText}>
                    {total} {total === 1 ? 'result' : 'results'} for “{submitted}”
                  </Text>
                  {refined ? (
                    <Pressable accessibilityRole="button" onPress={reset} hitSlop={8}>
                      <Text style={styles.reset}>Reset</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <SearchState
              submitted={submitted}
              pending={results.isPending}
              error={results.isError}
              refined={refined}
              onRetry={() => void results.refetch()}
              onReset={reset}
            />
          }
          ListFooterComponent={
            results.isFetchingNextPage ? (
              <ActivityIndicator color={KueColors.ink3} style={styles.footer} />
            ) : undefined
          }
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={results.isRefetching && !results.isFetchingNextPage}
              onRefresh={() => void results.refetch()}
              tintColor={KueColors.ink3}
              colors={[KueColors.accent]}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      <OptionSheet
        visible={picker === 'type'}
        title="Media type"
        options={TYPE_OPTIONS}
        value={type}
        onSelect={(next) => {
          setType(next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <OptionSheet
        visible={picker === 'sort'}
        title="Sort by"
        options={SORT_OPTIONS}
        value={sort}
        onSelect={(next) => {
          setSort(next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <OptionSheet
        visible={picker === 'score'}
        title="Minimum score"
        options={SCORE_OPTIONS}
        value={minScore}
        onSelect={(next) => {
          setMinScore(next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

function SearchState({
  submitted,
  pending,
  error,
  refined,
  onRetry,
  onReset,
}: {
  submitted: string;
  pending: boolean;
  error: boolean;
  refined: boolean;
  onRetry: () => void;
  onReset: () => void;
}) {
  if (submitted.length === 0) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>Search the catalog.</Text>
        <Text style={styles.stateBody}>
          Films, series, games, anime and manga, synced nightly from TMDB, AniList and IGDB.
        </Text>
      </View>
    );
  }

  if (pending) {
    return (
      <View style={styles.skeletonList}>
        {[0, 1, 2, 3, 4, 5].map((row) => (
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
    );
  }

  if (error) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>Couldn&apos;t run this search.</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
          <Text style={styles.reset}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.state}>
      <Text style={styles.stateTitle}>No titles match.</Text>
      <Text style={styles.stateBody}>
        {refined
          ? 'Try a different spelling, or relax the filters.'
          : 'Try a different spelling or a shorter phrase.'}
      </Text>
      {refined ? (
        <Pressable accessibilityRole="button" onPress={onReset} hitSlop={8}>
          <Text style={styles.reset}>Reset filters</Text>
        </Pressable>
      ) : null}
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
    paddingTop: KueSpacing.md,
    paddingBottom: KueSpacing.xxl,
  },
  header: {
    gap: KueSpacing.md,
    marginBottom: KueSpacing.md,
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
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    height: 48,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KueSpacing.sm,
  },
  chip: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  yearChip: {
    gap: 3,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
    paddingVertical: KueSpacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
  },
  yearLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yearInput: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 12,
    paddingVertical: 0,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryText: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  reset: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
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
    color: KueColors.ink2,
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
  skeletonList: {
    gap: KueSpacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    paddingVertical: 10,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
  },
  skeletonText: {
    flex: 1,
    gap: 8,
  },
});
