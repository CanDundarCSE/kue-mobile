import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { HigherLower } from '@/features/mini-games/higher-lower';
import { GenreSprint } from '@/features/mini-games/genre-sprint';
import { MediaQuiz } from '@/features/mini-games/media-quiz';
import { PosterGuess } from '@/features/mini-games/poster-guess';
import { fetchLeaderboard, fetchWallet } from '@/lib/api/mini-games';
import { useAuth } from '@/lib/auth/auth-context';
import { useResponsive } from '@/lib/responsive';

type Tab = 'play' | 'board';
type GameId = 'poster' | 'quiz' | 'duel' | 'sprint';

const GAMES: {
  id: GameId;
  title: string;
  body: string;
  available: boolean;
}[] = [
  {
    id: 'duel',
    title: 'Higher or lower',
    body: 'Two posters, one call — which scores higher? Streaks multiply the payout.',
    available: true,
  },
  {
    id: 'poster',
    title: 'Poster guess',
    body: 'Blurred posters that clear with every miss. Name them before they do.',
    available: true,
  },
  {
    id: 'quiz',
    title: 'Media quiz',
    body: 'Catalog trivia and general knowledge mixed together.',
    available: true,
  },
  {
    id: 'sprint',
    title: 'Genre sprint',
    body: 'Name the genre from the artwork before the clock runs out.',
    available: true,
  },
];

const BOARDS: { id: string; label: string }[] = [
  { id: 'poster-guess', label: 'Poster' },
  { id: 'media-quiz', label: 'Quiz' },
  { id: 'higher-lower', label: 'Higher-Lower' },
  { id: 'genre-sprint', label: 'Sprint' },
];

export default function MiniGamesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();

  const [tab, setTab] = useState<Tab>('play');
  const [game, setGame] = useState<GameId | null>(null);
  const [board, setBoard] = useState('higher-lower');

  const walletQuery = useQuery({ queryKey: ['minigames-wallet'], queryFn: fetchWallet });
  const leaderboardQuery = useQuery({
    queryKey: ['minigames-leaderboard', board],
    queryFn: () => fetchLeaderboard(board, 20),
    enabled: tab === 'board',
  });

  const balance = walletQuery.data?.balance ?? null;
  const entries = leaderboardQuery.data?.entries ?? [];
  const mine = leaderboardQuery.data?.mine ?? null;

  const setBalance = (next: number) => {
    queryClient.setQueryData(['minigames-wallet'], (current: typeof walletQuery.data) => ({
      balance: next,
      totalEarned: current?.totalEarned ?? next,
    }));
    void queryClient.invalidateQueries({ queryKey: ['minigames-leaderboard'] });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {game !== null ? (
          <View style={styles.gameScreen}>
            {game === 'duel' ? (
              <HigherLower onExit={() => setGame(null)} onWalletChange={setBalance} />
            ) : game === 'poster' ? (
              <PosterGuess onExit={() => setGame(null)} onWalletChange={setBalance} />
            ) : game === 'quiz' ? (
              <MediaQuiz onExit={() => setGame(null)} onWalletChange={setBalance} />
            ) : game === 'sprint' ? (
              <GenreSprint onExit={() => setGame(null)} onWalletChange={setBalance} />
            ) : null}
          </View>
        ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.kicker}>Mini-games</Text>
            <View style={styles.wallet}>
              <Coins color={KueColors.accent} size={13} strokeWidth={2} />
              <Text style={styles.walletValue}>{balance === null ? '…' : `${balance} pts`}</Text>
            </View>
          </View>

          <Text style={styles.title}>
            Pick your game<Text style={styles.accent}>.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Pixelated posters, trivia, score duels and genre sprints — solve to earn points,
            spend them on hints, and climb the leaderboard.
          </Text>

          <View style={styles.segmented}>
            {(
              [
                { id: 'play', label: 'Play' },
                { id: 'board', label: 'Leaderboard' },
              ] as const
            ).map((item) => {
              const active = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item.label}
                  onPress={() => setTab(item.id)}
                  style={styles.segment}>
                  <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                    {item.label}
                  </Text>
                  <View style={[styles.segmentUnderline, active && styles.segmentUnderlineActive]} />
                </Pressable>
              );
            })}
          </View>

          {tab === 'play' ? (
              <View style={styles.gameList}>
                {GAMES.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    accessibilityState={{ disabled: !item.available }}
                    disabled={!item.available}
                    onPress={() => setGame(item.id)}
                    style={({ pressed }) => [
                      styles.gameCard,
                      !item.available && styles.gameCardDisabled,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.gameHeader}>
                      <Text style={styles.gameTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.available ? (
                        <Text style={styles.playLabel}>Play</Text>
                      ) : (
                        <Text style={styles.soonLabel}>Soon</Text>
                      )}
                    </View>
                    <Text style={styles.gameBody}>{item.body}</Text>
                  </Pressable>
                ))}
              </View>
          ) : (
            <View style={styles.board}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.boardChips}>
                {BOARDS.map((item) => {
                  const active = board === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={item.label}
                      onPress={() => setBoard(item.id)}
                      style={[styles.boardChip, active && styles.boardChipActive]}>
                      <Text style={[styles.boardChipLabel, active && styles.boardChipLabelActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.card}>
                {leaderboardQuery.isPending ? (
                  <View style={styles.boardList}>
                    {[0, 1, 2, 3, 4].map((row) => (
                      <View key={row} style={styles.boardRow}>
                        <Skeleton width={18} height={10} radius={4} />
                        <Skeleton width={30} height={30} radius={15} />
                        <View style={styles.boardRowBody}>
                          <Skeleton width="45%" height={12} />
                          <Skeleton width="28%" height={8} radius={4} />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : leaderboardQuery.isError ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void leaderboardQuery.refetch()}
                    style={styles.boardEmpty}>
                    <Text style={styles.boardEmptyText}>
                      Couldn&apos;t load the leaderboard — tap to retry.
                    </Text>
                  </Pressable>
                ) : entries.length === 0 ? (
                  <View style={styles.boardEmpty}>
                    <Text style={styles.boardEmptyTitle}>Be the first on the board.</Text>
                    <Text style={styles.boardEmptyText}>
                      Finish a game and your best score shows up here.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.boardList}>
                    {entries.map((entry, index) => {
                      const isMine = entry.username === user?.username;
                      return (
                        <View
                          key={entry.userId}
                          style={[styles.boardRow, isMine && styles.boardRowMine]}>
                          <Text style={styles.boardRank}>
                            {String(index + 1).padStart(2, '0')}
                          </Text>
                          <UserAvatar username={entry.username} avatarId={entry.avatarId} size={30} />
                          <View style={styles.boardRowBody}>
                            <Text style={styles.boardName} numberOfLines={1}>
                              {entry.username}
                              {isMine ? <Text style={styles.you}> · you</Text> : null}
                            </Text>
                            <Text style={styles.boardMeta}>
                              Best {entry.bestScore} · {entry.gamesPlayed}{' '}
                              {entry.gamesPlayed === 1 ? 'game' : 'games'}
                            </Text>
                          </View>
                          <Text style={styles.boardScore}>{entry.totalScore}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {mine && entries.length > 0 && !entries.some((item) => item.username === user?.username) ? (
                <Text style={styles.mineLine}>
                  Your total — {mine.totalScore} pts · best {mine.bestScore}
                </Text>
              ) : null}
            </View>
          )}
        </ScrollView>
        )}
      </SafeAreaView>
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
    gap: KueSpacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  walletValue: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
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
    marginBottom: KueSpacing.sm,
  },
  segmented: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
    marginBottom: KueSpacing.sm,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  segmentLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  segmentLabelActive: {
    color: KueColors.foreground,
  },
  segmentUnderline: {
    position: 'absolute',
    left: KueSpacing.xxl,
    right: KueSpacing.xxl,
    bottom: -StyleSheet.hairlineWidth,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  segmentUnderlineActive: {
    backgroundColor: KueColors.accent,
  },
  pressed: {
    opacity: 0.75,
  },
  gameList: {
    gap: KueSpacing.md,
  },
  gameCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.lg,
    gap: KueSpacing.xs,
  },
  gameCardDisabled: {
    opacity: 0.5,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameTitle: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 21,
    lineHeight: 25,
  },
  playLabel: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  soonLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  gameBody: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  gameScreen: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    paddingHorizontal: KueSpacing.sm,
  },
  board: {
    gap: KueSpacing.sm,
  },
  boardChips: {
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.xs,
  },
  boardChip: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  boardChipActive: {
    backgroundColor: KueColors.foreground,
    borderColor: KueColors.foreground,
  },
  boardChipLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  boardChipLabelActive: {
    color: KueColors.background,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
  },
  boardList: {
    gap: 2,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    paddingVertical: 9,
    paddingHorizontal: KueSpacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  boardRowMine: {
    borderRadius: 10,
    backgroundColor: KueColors.accentSoft,
    borderBottomColor: 'transparent',
  },
  boardRank: {
    width: 20,
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 11,
  },
  boardRowBody: {
    flex: 1,
    gap: 2,
  },
  boardName: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  you: {
    color: KueColors.accent,
  },
  boardMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  boardScore: {
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 13,
  },
  boardEmpty: {
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.xl,
  },
  boardEmptyTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 20,
  },
  boardEmptyText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  mineLine: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
