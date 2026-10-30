import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OptionSheet, type SheetOption } from '@/components/option-sheet';
import { PickerChip } from '@/components/picker-chip';
import { Skeleton } from '@/components/skeleton';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { EditSheet } from '@/features/library/edit-sheet';
import { LibraryRow } from '@/features/library/library-row';
import {
  deleteLibraryEntry,
  fetchLibrary,
  fetchLibraryOverview,
  updateLibraryEntry,
  type LibraryEntry,
  type StatsOverview,
  type UpdateLibraryParams,
} from '@/lib/api/library';
import { useResponsive } from '@/lib/responsive';

const PAGE_SIZE = 20;

type TabType = 'all' | 'movie' | 'series' | 'game' | 'anime' | 'manga';
type StatusFilter = 'all' | 'in_progress' | 'on_hold' | 'planning' | 'completed' | 'dropped';
type SortOption = 'recently_touched' | 'title' | 'progress' | 'rating';
type Picker = 'type' | 'status' | 'sort' | null;

const TABS: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'movie', label: 'Film' },
  { id: 'series', label: 'Series' },
  { id: 'game', label: 'Game' },
  { id: 'anime', label: 'Anime' },
  { id: 'manga', label: 'Manga' },
];

const STATUS_PILLS: { id: StatusFilter; label: string; chip: string }[] = [
  { id: 'all', label: 'All statuses', chip: 'All' },
  { id: 'in_progress', label: 'In progress', chip: 'In progress' },
  { id: 'on_hold', label: 'On hold', chip: 'On hold' },
  { id: 'planning', label: 'Planned', chip: 'Planned' },
  { id: 'completed', label: 'Done', chip: 'Done' },
  { id: 'dropped', label: 'Dropped', chip: 'Dropped' },
];

const SORT_OPTIONS: { id: SortOption; label: string; chip: string }[] = [
  { id: 'recently_touched', label: 'Recently touched', chip: 'Recent' },
  { id: 'title', label: 'Title A–Z', chip: 'A–Z' },
  { id: 'progress', label: 'Most progress', chip: 'Progress' },
  { id: 'rating', label: 'Highest rated', chip: 'Rating' },
];

function formatCountSubtitle(total: number, formatCount: number) {
  if (total === 0) return 'One list, one scale.';
  const formats = formatCount === 1 ? 'one format' : `${formatCount} formats`;
  return `${total} ${total === 1 ? 'title' : 'titles'} across ${formats} — one list, one scale.`;
}

function sortItems(items: LibraryEntry[], sort: SortOption) {
  const list = [...items];
  switch (sort) {
    case 'title':
      return list.sort((a, b) => a.media.title.localeCompare(b.media.title));
    case 'progress':
      return list.sort((a, b) => {
        const aTotal = a.totalUnits ?? a.media.totalUnits ?? 0;
        const bTotal = b.totalUnits ?? b.media.totalUnits ?? 0;
        const aPct = aTotal > 0 ? (a.progress ?? 0) / aTotal : 0;
        const bPct = bTotal > 0 ? (b.progress ?? 0) / bTotal : 0;
        return bPct - aPct;
      });
    case 'rating':
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default:
      return list;
  }
}

export default function LibraryScreen() {
  const { contentWidth, gutter } = useResponsive();
  const queryClient = useQueryClient();
  const [type, setType] = useState<TabType>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('recently_touched');
  const [picker, setPicker] = useState<Picker>(null);
  const [selected, setSelected] = useState<LibraryEntry | null>(null);

  const overview = useQuery({
    queryKey: ['library-overview'],
    queryFn: fetchLibraryOverview,
    staleTime: 60_000,
  });

  const library = useInfiniteQuery({
    queryKey: ['library', type, status],
    queryFn: ({ pageParam }) =>
      fetchLibrary({
        type: type === 'all' ? undefined : type,
        status: status === 'all' ? undefined : status,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const entries = useMemo(
    () => sortItems((library.data?.pages ?? []).flatMap((page) => page.items ?? []), sort),
    [library.data, sort],
  );

  const stats = overview.data;
  const total = stats?.totalItems ?? 0;
  const formats = getFormatCount(stats);
  const filtered = type !== 'all' || status !== 'all';

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['library'] }),
      queryClient.invalidateQueries({ queryKey: ['library-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['continue'] }),
      queryClient.invalidateQueries({ queryKey: ['spotlight'] }),
    ]);
  };

  const saveEntry = async (mediaId: number, params: UpdateLibraryParams) => {
    await updateLibraryEntry(mediaId, params);
    await refreshAll();
  };

  const removeEntry = async (mediaId: number) => {
    await deleteLibraryEntry(mediaId);
    await refreshAll();
  };

  const resetFilters = () => {
    setType('all');
    setStatus('all');
  };

  const typeOptions: SheetOption<TabType>[] = TABS.map((tab) => ({
    value: tab.id,
    label: tab.id === 'all' ? 'All types' : tab.label,
    meta: String(tabCount(stats, tab.id)),
  }));
  const statusOptions: SheetOption<StatusFilter>[] = STATUS_PILLS.map((pill) => ({
    value: pill.id,
    label: pill.label,
  }));
  const sortOptions: SheetOption<SortOption>[] = SORT_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
  }));

  const header = (
    <View style={styles.header}>
      <Text style={styles.kicker}>Library</Text>
      <Text style={styles.title}>
        Everything you&apos;re tracking
        <Text style={styles.accent}>.</Text>
      </Text>
      <Text style={styles.subtitle}>{formatCountSubtitle(total, formats)}</Text>

      <View style={styles.pickerRow}>
        <PickerChip
          label="Type"
          value={TABS.find((tab) => tab.id === type)?.label ?? 'All types'}
          onPress={() => setPicker('type')}
          style={styles.chipFlex}
        />
        <PickerChip
          label="Status"
          value={STATUS_PILLS.find((pill) => pill.id === status)?.chip ?? 'All'}
          onPress={() => setPicker('status')}
          style={styles.chipFlex}
        />
        <PickerChip
          label="Sort"
          value={SORT_OPTIONS.find((option) => option.id === sort)?.chip ?? 'Recent'}
          onPress={() => setPicker('sort')}
          style={styles.chipFlex}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={entries}
          keyExtractor={(entry) => String(entry.id)}
          renderItem={({ item }) => <LibraryRow entry={item} onPress={() => setSelected(item)} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <ListState
              pending={library.isPending}
              error={library.isError}
              filtered={filtered}
              onRetry={() => void library.refetch()}
              onReset={resetFilters}
            />
          }
          ListFooterComponent={
            library.isFetchingNextPage ? (
              <ActivityIndicator color={KueColors.ink3} style={styles.footer} />
            ) : undefined
          }
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          ItemSeparatorComponent={Separator}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (library.hasNextPage && !library.isFetchingNextPage) void library.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={library.isRefetching && !library.isFetchingNextPage}
              onRefresh={() => void library.refetch()}
              tintColor={KueColors.ink3}
              colors={[KueColors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      <OptionSheet
        visible={picker === 'type'}
        title="Media type"
        options={typeOptions}
        value={type}
        onSelect={(next) => {
          setType(next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <OptionSheet
        visible={picker === 'status'}
        title="Status"
        options={statusOptions}
        value={status}
        onSelect={(next) => {
          setStatus(next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <OptionSheet
        visible={picker === 'sort'}
        title="Sort by"
        options={sortOptions}
        value={sort}
        onSelect={(next) => {
          setSort(next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />

      <EditSheet
        entry={selected}
        onClose={() => setSelected(null)}
        onSave={saveEntry}
        onDelete={removeEntry}
      />
    </View>
  );
}

function getFormatCount(stats?: StatsOverview) {
  if (!stats) return 0;
  const counts = [stats.movie, stats.series, stats.game, stats.anime, stats.manga];
  return Math.max(1, counts.filter((item) => (item?.total ?? 0) > 0).length);
}

function tabCount(stats: StatsOverview | undefined, tab: TabType) {
  if (!stats) return 0;
  if (tab === 'all') return stats.totalItems;
  return stats[tab]?.total ?? 0;
}

function Separator() {
  return <View style={styles.separator} />;
}

function ListState({
  pending,
  error,
  filtered,
  onRetry,
  onReset,
}: {
  pending: boolean;
  error: boolean;
  filtered: boolean;
  onRetry: () => void;
  onReset: () => void;
}) {
  if (pending) {
    return (
      <View style={styles.skeletonList}>
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={styles.skeletonCard}>
            <Skeleton width={48} height={64} radius={8} />
            <View style={styles.skeletonBody}>
              <Skeleton width="62%" height={14} />
              <Skeleton width="32%" height={10} radius={4} />
              <Skeleton width="48%" height={8} radius={4} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.state}>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.stateAction, pressed && styles.pressed]}>
          <Text style={styles.stateActionText}>Couldn&apos;t load — tap to retry.</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.state}>
      {filtered ? (
        <>
          <Text style={styles.stateTitle}>No titles match these filters.</Text>
          <Pressable accessibilityRole="button" onPress={onReset} hitSlop={8}>
            <Text style={styles.stateActionText}>Reset filters</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.stateTitle}>Your library is empty.</Text>
          <Text style={styles.stateBody}>
            Search for films, series, games, anime, or manga to start tracking.
          </Text>
        </>
      )}
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
  header: {
    gap: KueSpacing.sm,
    marginBottom: KueSpacing.lg,
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
  subtitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
    marginTop: KueSpacing.sm,
  },
  chipFlex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  separator: {
    height: 10,
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
  skeletonList: {
    gap: 10,
  },
  skeletonCard: {
    flexDirection: 'row',
    gap: KueSpacing.md,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
  },
  skeletonBody: {
    flex: 1,
    gap: KueSpacing.sm,
    justifyContent: 'center',
  },
  stateTitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.serif,
    fontSize: 18,
    textAlign: 'center',
  },
  stateBody: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  stateAction: {
    paddingVertical: KueSpacing.sm,
  },
  stateActionText: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
