import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Flame, RefreshCw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  fetchActivityStats,
  fetchGenreStats,
  fetchStatsOverview,
  fetchTimeSpent,
  type ActivityDay,
  type StatsOverview,
  type StatsTimeSpent,
} from '@/lib/api/stats';
import { useResponsive } from '@/lib/responsive';

const WEEKS = 26;
const EMPTY_DAYS: ActivityDay[] = [];
const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dayLabel(key: string) {
  const date = dateFromKey(key);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function heatmapStartDate() {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKS * 7 - 1));
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);
  return start;
}

function computeStreaks(days: ActivityDay[]) {
  const active = new Set(
    days.filter((day) => day.added + day.completed > 0).map((day) => day.date),
  );

  const cursor = startOfDay(new Date());
  if (!active.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let current = 0;
  while (active.has(dateKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const dates = [...active]
    .map((key) => {
      const [year, month, day] = key.split('-').map(Number);
      return Date.UTC(year, month - 1, day);
    })
    .sort((a, b) => a - b);

  let longest = 0;
  let run = 0;
  let previous: number | null = null;
  dates.forEach((time) => {
    run = previous !== null && time - previous === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = time;
  });

  return { current, longest };
}

function heaviestMonth(days: ActivityDay[]) {
  const totals = new Map<string, number>();
  days.forEach((day) => {
    const month = day.date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + day.added + day.completed);
  });

  let best: { month: string; total: number } | null = null;
  totals.forEach((total, month) => {
    if (!best || total > best.total) best = { month, total };
  });

  if (!best || (best as { total: number }).total === 0) return null;
  const [year, month] = (best as { month: string }).month.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
}

function hoursByMedium(time: StatsTimeSpent | undefined) {
  if (!time) return [];

  const film = Math.round((time.movieMinutes / 60) * 10) / 10;
  const series = Math.round((time.seriesMinutes / 60) * 10) / 10;
  const anime = Math.round((time.animeMinutes / 60) * 10) / 10;
  const manga = Math.round(((time.mangaChaptersRead * 4) / 60) * 10) / 10;
  const accounted = film + series + anime + manga;
  const game = Math.max(0, Math.round((time.totalHours - accounted) * 10) / 10);

  return [
    { key: 'film', label: 'Film', hours: film },
    { key: 'series', label: 'Series', hours: series },
    { key: 'game', label: 'Game', hours: game },
    { key: 'anime', label: 'Anime', hours: anime },
    { key: 'manga', label: 'Manga', hours: manga },
  ].sort((a, b) => b.hours - a.hours);
}

function heatmapCells(days: ActivityDay[]) {
  const byDate = new Map(days.map((day) => [day.date, day.added + day.completed]));
  const today = startOfDay(new Date());
  const start = heatmapStartDate();

  const columns: { key: string; level: number }[][] = [];
  for (let week = 0; week < WEEKS; week += 1) {
    const column: { key: string; level: number }[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day);
      const key = dateKey(date);

      if (date > today) {
        column.push({ key, level: -1 });
        continue;
      }

      const total = byDate.get(key) ?? 0;
      const level = total === 0 ? 0 : total <= 2 ? 1 : total <= 5 ? 2 : 3;
      column.push({ key, level });
    }
    columns.push(column);
  }

  return columns;
}

export default function StatsScreen() {
  const router = useRouter();
  const { contentWidth, gutter } = useResponsive();

  const overview = useQuery({ queryKey: ['stats-overview'], queryFn: fetchStatsOverview });
  const timeSpent = useQuery({ queryKey: ['stats-time'], queryFn: fetchTimeSpent });
  const genres = useQuery({ queryKey: ['stats-genres'], queryFn: fetchGenreStats });
  const activity = useQuery({
    queryKey: ['stats-activity'],
    queryFn: () => fetchActivityStats(182),
  });

  const pending =
    overview.isPending || timeSpent.isPending || genres.isPending || activity.isPending;
  const errored =
    overview.isError || timeSpent.isError || genres.isError || activity.isError;

  const retry = () => {
    void overview.refetch();
    void timeSpent.refetch();
    void genres.refetch();
    void activity.refetch();
  };

  const stats: StatsOverview | undefined = overview.data;
  const time = timeSpent.data;
  const days = activity.data ?? EMPTY_DAYS;

  const [heatWidth, setHeatWidth] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const cellSize = heatWidth > 0 ? Math.max(6, Math.floor((heatWidth - 25 * 2) / WEEKS)) : 8;
  const step = cellSize + 2;
  const gridStart = useMemo(() => heatmapStartDate(), []);

  const activityByDate = useMemo(
    () => new Map(days.map((day) => [day.date, day])),
    [days],
  );
  const latestActiveKey = useMemo(() => {
    const active = days
      .filter((day) => day.added + day.completed > 0)
      .map((day) => day.date)
      .sort();
    return active[active.length - 1] ?? dateKey(startOfDay(new Date()));
  }, [days]);
  const effectiveKey = selectedKey ?? latestActiveKey;
  const selectedDay = activityByDate.get(effectiveKey);
  const recentDays = useMemo(
    () =>
      days
        .filter((day) => day.added + day.completed > 0)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [days],
  );

  const heatResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => selectHeatCell(event.nativeEvent.locationX, event.nativeEvent.locationY),
        onPanResponderMove: (event) => selectHeatCell(event.nativeEvent.locationX, event.nativeEvent.locationY),
      }),
    [step, gridStart, heatWidth],
  );

  function selectHeatCell(x: number, y: number) {
    if (heatWidth <= 0) return;

    const column = Math.max(0, Math.min(WEEKS - 1, Math.floor(x / step)));
    const row = Math.max(0, Math.min(6, Math.floor(y / step)));
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + column * 7 + row);

    if (date > startOfDay(new Date())) return;
    setSelectedKey(dateKey(date));
  }

  const streaks = useMemo(() => computeStreaks(days), [days]);
  const hours = useMemo(() => hoursByMedium(time), [time]);
  const cells = useMemo(() => heatmapCells(days), [days]);
  const month = useMemo(() => heaviestMonth(days), [days]);

  const totalHours = Math.round(time?.totalHours ?? 0);
  const totalItems = stats?.totalItems ?? 0;
  const completed = stats?.totalCompleted ?? 0;
  const completionRate = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;
  const topMedium = hours.find((row) => row.hours > 0)?.label ?? '—';
  const maxHours = Math.max(1, ...hours.map((row) => row.hours));
  const topGenres = (genres.data ?? []).slice(0, 6);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={overview.isRefetching && !overview.isPending}
              onRefresh={retry}
              tintColor={KueColors.ink3}
              colors={[KueColors.accent]}
            />
          }>
          <Text style={styles.kicker}>Stats</Text>
          <Text style={styles.title}>
            Your habits, in numbers<Text style={styles.accent}>.</Text>
          </Text>

          {errored ? (
            <Pressable accessibilityRole="button" onPress={retry} style={styles.errorCard}>
              <RefreshCw color={KueColors.ink3} size={15} strokeWidth={2} />
              <Text style={styles.errorText}>
                Couldn&apos;t load all stats. Tap to refresh.
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.summaryGrid}>
            {pending ? (
              [0, 1, 2, 3].map((item) => (
                <View key={item} style={styles.summaryCard}>
                  <Skeleton width="60%" height={8} />
                  <Skeleton width="45%" height={28} />
                </View>
              ))
            ) : (
              <>
                <SummaryCard label="Total consumed" value={`${totalHours}`} unit="h" />
                <SummaryCard label="In library" value={String(totalItems)} />
                <SummaryCard label="Completed" value={String(completionRate)} unit="%" />
                <SummaryCard
                  label="Streak"
                  value={String(streaks.current)}
                  unit="d"
                  icon={<Flame color={KueColors.accent} size={12} strokeWidth={2} />}
                />
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hours by medium</Text>
            {pending ? (
              <View style={styles.skeletonRows}>
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={row} height={26} radius={6} />
                ))}
              </View>
            ) : totalHours === 0 ? (
              <Text style={styles.emptyText}>
                Log progress on films, series, games, anime or manga to see your hours.
              </Text>
            ) : (
              <View style={styles.rows}>
                {hours.map((row) => (
                  <View key={row.key} style={styles.row}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          {
                            width: `${Math.max(2, (row.hours / maxHours) * 100)}%`,
                            backgroundColor:
                              row.key === 'game'
                                ? KueColors.game
                                : row.key === 'film'
                                  ? KueColors.movie
                                  : row.key === 'series'
                                    ? KueColors.series
                                    : row.key === 'anime'
                                      ? KueColors.anime
                                      : KueColors.manga,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.rowValue}>{row.hours}h</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Genre pull</Text>
            {pending ? (
              <View style={styles.skeletonRows}>
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={row} height={22} radius={6} />
                ))}
              </View>
            ) : topGenres.length === 0 ? (
              <Text style={styles.emptyText}>Add titles to your library to map your genres.</Text>
            ) : (
              <View style={styles.rows}>
                {topGenres.map((genre) => (
                  <View key={genre.genre} style={styles.row}>
                    <Text style={[styles.rowLabel, styles.genreLabel]} numberOfLines={1}>
                      {genre.genre}
                    </Text>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${Math.max(3, genre.percentage)}%`, backgroundColor: KueColors.accent },
                        ]}
                      />
                    </View>
                    <Text style={styles.rowValue}>{genre.count}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last 26 weeks</Text>
            {pending ? (
              <Skeleton height={86} radius={8} />
            ) : (
              <>
                <View style={styles.heatCaptionRow}>
                  <Text style={styles.heatDate}>{dayLabel(effectiveKey)}</Text>
                  <Text style={styles.heatCounts}>
                    {selectedDay
                      ? `+${selectedDay.added} added · ${selectedDay.completed} completed`
                      : 'No activity'}
                  </Text>
                </View>

                <View
                  {...heatResponder.panHandlers}
                  style={styles.heatmap}
                  onLayout={(event) => setHeatWidth(event.nativeEvent.layout.width)}>
                  {cells.map((column) => {
                    const columnSelected = column.some((cell) => cell.key === effectiveKey);
                    return (
                      <View
                        key={column[0]?.key ?? 'week'}
                        style={[styles.heatColumn, columnSelected && styles.heatColumnSelected]}>
                        {column.map((cell) => (
                          <View
                            key={cell.key}
                            accessible
                            accessibilityLabel={`${dayLabel(cell.key)}, ${
                              activityByDate.get(cell.key)?.added ?? 0
                            } added, ${activityByDate.get(cell.key)?.completed ?? 0} completed`}
                            style={[
                              styles.heatCell,
                              { width: cellSize, height: cellSize },
                              cell.level === 0 && styles.heat0,
                              cell.level === 1 && styles.heat1,
                              cell.level === 2 && styles.heat2,
                              cell.level === 3 && styles.heat3,
                              cell.level === -1 && styles.heatFuture,
                              cell.key === effectiveKey && styles.heatSelected,
                            ]}
                          />
                        ))}
                      </View>
                    );
                  })}
                </View>

                <Text style={styles.heatHint}>Tap or drag across the grid to inspect a day.</Text>

                <View style={styles.legend}>
                  <Text style={styles.legendText}>Less</Text>
                  {[0, 1, 2, 3].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.legendCell,
                        level === 0 && styles.heat0,
                        level === 1 && styles.heat1,
                        level === 2 && styles.heat2,
                        level === 3 && styles.heat3,
                      ]}
                    />
                  ))}
                  <Text style={styles.legendText}>More</Text>
                </View>

                {recentDays.length > 0 ? (
                  <View style={styles.recentDays}>
                    <Text style={styles.recentTitle}>Recent days</Text>
                    {recentDays.map((day, index) => (
                      <Pressable
                        key={day.date}
                        accessibilityRole="button"
                        accessibilityLabel={`${dayLabel(day.date)}, ${day.added} added, ${day.completed} completed`}
                        onPress={() => setSelectedKey(day.date)}
                        style={({ pressed }) => [
                          styles.recentRow,
                          index > 0 && styles.recentDivider,
                          day.date === effectiveKey && styles.recentRowActive,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={styles.recentDay}>{dayLabel(day.date)}</Text>
                        <Text style={styles.recentValue}>
                          +{day.added} added · {day.completed} completed
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>In review</Text>
            <View style={styles.reviewGrid}>
              <ReviewTile label="Top medium" value={topMedium} />
              <ReviewTile label="Longest streak" value={`${streaks.longest} days`} />
              <ReviewTile label="Heaviest month" value={month ?? '—'} />
              <ReviewTile label="Favorites" value={String(stats?.totalFavorites ?? 0)} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
              <Text style={styles.linkLabel}>See your profile</Text>
            </Pressable>
          </View>

          {pending ? <ActivityIndicator color={KueColors.ink3} style={styles.loading} /> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryLabelRow}>
        <Text style={styles.summaryLabel}>{label}</Text>
        {icon}
      </View>
      <Text style={styles.summaryValue}>
        {value}
        {unit ? <Text style={styles.summaryUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function ReviewTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewTile}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={1}>
        {value}
      </Text>
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
    gap: KueSpacing.md,
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
  },
  errorText: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KueSpacing.sm,
  },
  summaryCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
    gap: KueSpacing.sm,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
  },
  summaryLabel: {
    flex: 1,
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 38,
    lineHeight: 40,
  },
  summaryUnit: {
    color: KueColors.ink3,
    fontSize: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.lg,
    gap: KueSpacing.md,
  },
  cardTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  skeletonRows: {
    gap: KueSpacing.sm,
  },
  rows: {
    gap: KueSpacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
  },
  rowLabel: {
    width: 52,
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  genreLabel: {
    width: 84,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  rowValue: {
    width: 40,
    textAlign: 'right',
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 10,
  },
  emptyText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  heatCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
  },
  heatDate: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  heatCounts: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heatmap: {
    flexDirection: 'row',
    gap: 2,
  },
  heatColumn: {
    gap: 2,
  },
  heatColumnSelected: {
    backgroundColor: 'rgba(126,143,255,0.10)',
    borderRadius: 3,
  },
  heatCell: {
    borderRadius: 2,
  },
  legendCell: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  heat0: {
    backgroundColor: KueColors.surface3,
  },
  heat1: {
    backgroundColor: '#3b4170',
  },
  heat2: {
    backgroundColor: '#5a63a8',
  },
  heat3: {
    backgroundColor: KueColors.accent,
  },
  heatFuture: {
    backgroundColor: 'transparent',
  },
  heatSelected: {
    borderWidth: 1,
    borderColor: KueColors.accent,
  },
  heatHint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
  },
  recentDays: {
    marginTop: KueSpacing.xs,
  },
  recentTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: KueSpacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
    minHeight: 40,
    paddingHorizontal: KueSpacing.sm,
    borderRadius: 8,
  },
  recentDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
  },
  recentRowActive: {
    backgroundColor: KueColors.accentSoft,
  },
  recentDay: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 12,
  },
  recentValue: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: KueSpacing.xs,
  },
  legendText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginHorizontal: 5,
  },
  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KueSpacing.sm,
  },
  reviewTile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 4,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    padding: KueSpacing.md,
  },
  reviewLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  reviewValue: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 20,
    lineHeight: 24,
  },
  linkButton: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
  loading: {
    paddingVertical: KueSpacing.lg,
  },
});
