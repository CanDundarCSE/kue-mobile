import { Image } from 'expo-image';
import { ArrowLeft, Check, Flame, RotateCcw, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { MEDIA_ACCENT } from '@/features/library/library-row';
import { fetchDuels, submitGame, type DuelPair } from '@/lib/api/mini-games';

const DUELS_PER_GAME = 8;
const BASE_POINTS = 10;

const SCOPES = [
  { id: 'movie', label: 'Film' },
  { id: 'series', label: 'Series' },
  { id: 'game', label: 'Game' },
  { id: 'anime', label: 'Anime' },
  { id: 'manga', label: 'Manga' },
];

function streakPoints(streak: number) {
  return Math.min(BASE_POINTS * 2 ** Math.max(0, streak - 1), 100);
}

type Phase = 'lobby' | 'loading' | 'playing' | 'revealed' | 'summary';

type RoundResult = {
  mediaId: number;
  correct: boolean;
  points: number;
  aTitle: string;
  bTitle: string;
  aScore: number;
  bScore: number;
};

export function HigherLower({
  onExit,
  onWalletChange,
}: {
  onExit: () => void;
  onWalletChange?: (balance: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [scope, setScope] = useState<string[]>([]);
  const [pairs, setPairs] = useState<DuelPair[]>([]);
  const [seen, setSeen] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pair = pairs[index] ?? null;
  const total = results.reduce((sum, result) => sum + result.points, 0);
  const winner: 'a' | 'b' | null =
    pair && typeof pair.a.score === 'number' && typeof pair.b.score === 'number'
      ? pair.a.score > pair.b.score
        ? 'a'
        : 'b'
      : null;

  const start = async () => {
    setPhase('loading');
    setError(null);
    try {
      const dealt = await fetchDuels(scope, DUELS_PER_GAME, seen);
      if (dealt.length === 0) {
        setError('Could not deal any duels. Try again.');
        setPhase('lobby');
        return;
      }
      setPairs(dealt);
      setSeen((prev) => [
        ...prev,
        ...dealt.flatMap((item) =>
          [item.a.id, item.b.id].filter((id): id is number => typeof id === 'number' && id > 0),
        ),
      ]);
      setIndex(0);
      setPicked(null);
      setStreak(0);
      setBestStreak(0);
      setResults([]);
      setPhase('playing');
    } catch {
      setError('Could not deal the duels. Check your connection and try again.');
      setPhase('lobby');
    }
  };

  const pick = (side: 'a' | 'b') => {
    if (!pair || picked !== null || !winner) return;

    const correct = side === winner;
    const nextStreak = correct ? streak + 1 : 0;
    const points = correct ? streakPoints(nextStreak) : 0;
    const pickedSide = side === 'a' ? pair.a : pair.b;

    setPicked(side);
    setStreak(nextStreak);
    setBestStreak((best) => Math.max(best, nextStreak));
    setResults((prev) => [
      ...prev,
      {
        mediaId: pickedSide.id,
        correct,
        points,
        aTitle: pair.a.title,
        bTitle: pair.b.title,
        aScore: pair.a.score ?? 0,
        bScore: pair.b.score ?? 0,
      },
    ]);
    setPhase('revealed');
  };

  const next = async () => {
    if (index + 1 < pairs.length) {
      setIndex(index + 1);
      setPicked(null);
      setPhase('playing');
      return;
    }

    setPhase('summary');
    setSubmitting(true);
    try {
      const scored = await submitGame({
        game: 'higher-lower',
        scope: scope.length > 0 ? scope : SCOPES.map((item) => item.id),
        rounds: results.map((round) => ({
          mediaId: round.mediaId,
          attemptsUsed: 1,
          hintsUsed: [],
          points: round.points,
        })),
      });
      onWalletChange?.(scored.balance);
    } catch {
      // The summary still shows the local score when submission fails.
    } finally {
      setSubmitting(false);
    }
  };

  const toggleScope = (id: string) => {
    setScope((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const topBar = (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to all games"
        hitSlop={10}
        onPress={onExit}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
      </Pressable>
      <Text style={styles.topTitle}>Higher or lower</Text>
      <Text style={styles.topPoints}>{total} pts</Text>
    </View>
  );

  if (phase === 'lobby' || phase === 'loading') {
    return (
      <View style={styles.screen}>
        {topBar}
        <ScrollView
          contentContainerStyle={[styles.lobby, styles.lobbyIntro]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Which scores higher?</Text>
          <Text style={styles.body}>
            8 head-to-head score battles. Wins stack a streak — payouts climb from 10 to 100
            points. One miss resets it.
          </Text>

          <Text style={styles.label}>Pick your pool</Text>
          <View style={styles.scopeRow}>
            <ScopeChip label="All media" active={scope.length === 0} onPress={() => setScope([])} />
            {SCOPES.map((item) => (
              <ScopeChip
                key={item.id}
                label={item.label}
                active={scope.includes(item.id)}
                onPress={() => toggleScope(item.id)}
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start game"
            disabled={phase === 'loading'}
            onPress={() => void start()}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              phase === 'loading' && styles.disabled,
            ]}>
            {phase === 'loading' ? (
              <ActivityIndicator color={KueColors.background} />
            ) : (
              <Text style={styles.primaryLabel}>Start game</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'summary') {
    return (
      <View style={styles.screen}>
        {topBar}
        <ScrollView contentContainerStyle={styles.lobby} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Results</Text>
          <Text style={styles.total}>
            {total}
            <Text style={styles.totalUnit}> pts</Text>
          </Text>
          <View style={styles.streakRow}>
            <Flame color={KueColors.accent} size={14} strokeWidth={2} />
            <Text style={styles.streakText}>Best streak {bestStreak}</Text>
            {submitting ? <ActivityIndicator color={KueColors.ink3} size="small" /> : null}
          </View>

          <View style={styles.results}>
            {results.map((result, position) => (
              <View key={`${result.aTitle}-${position}`} style={styles.resultRow}>
                {result.correct ? (
                  <Check color={KueColors.accent} size={16} strokeWidth={2.5} />
                ) : (
                  <X color={KueColors.danger} size={16} strokeWidth={2.5} />
                )}
                <Text style={styles.resultText} numberOfLines={2}>
                  <Text style={styles.resultTitle}>{result.aTitle}</Text>{' '}
                  {result.aScore.toFixed(1)} vs{' '}
                  <Text style={styles.resultTitle}>{result.bTitle}</Text>{' '}
                  {result.bScore.toFixed(1)}
                </Text>
                <Text style={[styles.resultPoints, result.points === 0 && styles.resultPointsZero]}>
                  +{result.points}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Play again"
              onPress={() => void start()}
              style={({ pressed }) => [styles.primaryButton, styles.flexButton, pressed && styles.pressed]}>
              <RotateCcw color={KueColors.background} size={14} strokeWidth={2.2} />
              <Text style={styles.primaryLabel}>Play again</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change pool"
              onPress={() => setPhase('lobby')}
              style={({ pressed }) => [styles.ghostButton, styles.flexButton, pressed && styles.pressed]}>
              <Text style={styles.ghostLabel}>Change pool</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!pair) {
    return (
      <View style={styles.screen}>
        {topBar}
        <View style={styles.lobby}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={10} />
        </View>
      </View>
    );
  }

  const revealed = phase === 'revealed';
  const lastResult = revealed ? results[results.length - 1] : null;

  return (
    <View style={styles.screen}>
      {topBar}

      <View style={styles.progressRow}>
        {pairs.map((_, position) => (
          <View
            key={position}
            style={[
              styles.progressSegment,
              position < index && styles.progressSegmentDone,
              position === index && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>

      <Text style={styles.prompt}>
        {revealed ? (lastResult?.correct ? 'Correct.' : 'Not quite.') : 'Which scores higher?'}
      </Text>

      <View style={styles.duelArea}>
        {(['a', 'b'] as const).map((side) => {
          const card = side === 'a' ? pair.a : pair.b;
          const isWinner = winner === side;
          const isPicked = picked === side;

          return (
            <Pressable
              key={side}
              accessibilityRole="button"
              accessibilityLabel={card.title}
              disabled={revealed}
              onPress={() => pick(side)}
              style={[
                styles.duelCard,
                revealed && isWinner && styles.duelWinner,
                revealed && isPicked && !isWinner && styles.duelLost,
                revealed && !isWinner && !isPicked && styles.duelDimmed,
              ]}>
              <View
                style={[
                  styles.poster,
                  { borderLeftColor: MEDIA_ACCENT[card.mediaType] ?? KueColors.line2 },
                ]}>
                {card.coverImage ? (
                  <Image
                    source={{ uri: card.coverImage }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.posterFallback}>{card.title.charAt(0)}</Text>
                )}
              </View>

              <Text style={styles.duelTitle} numberOfLines={2}>
                {card.title}
              </Text>
              <View style={styles.duelFooter}>
                <Text style={styles.duelMeta}>{card.year ?? '—'}</Text>
                {revealed && typeof card.score === 'number' ? (
                  <Text style={[styles.duelScore, isWinner && styles.duelScoreWin]}>
                    {card.score.toFixed(1)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}

        <View pointerEvents="none" style={styles.vsBadge}>
          <Text style={styles.vsLabel}>VS</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.roundLabel}>
            Duel {index + 1} of {pairs.length}
          </Text>
          <View style={styles.streakRow}>
            <Flame
              color={streak > 1 ? KueColors.accent : KueColors.ink3}
              size={13}
              strokeWidth={2}
            />
            <Text style={styles.streakText}>
              {streak > 0 ? `Streak ${streak} · next ${streakPoints(streak + 1)}` : 'No streak'}
            </Text>
            {revealed && lastResult ? (
              <Text style={styles.resultFlash}>+{lastResult.points}</Text>
            ) : null}
          </View>
        </View>

        {revealed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={index + 1 >= pairs.length ? 'See results' : 'Next duel'}
            onPress={() => void next()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>
              {index + 1 >= pairs.length ? 'See results' : 'Next duel'}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>Tap the poster with the higher score.</Text>
        )}
      </View>
    </View>
  );
}

function ScopeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.scopeChip, active && styles.scopeChipActive]}>
      <Text style={[styles.scopeLabel, active && styles.scopeLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -KueSpacing.sm,
  },
  topTitle: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  topPoints: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: KueSpacing.xs,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: KueColors.surface3,
  },
  progressSegmentDone: {
    backgroundColor: KueColors.ink3,
  },
  progressSegmentActive: {
    backgroundColor: KueColors.accent,
  },
  prompt: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 20,
    textAlign: 'center',
    marginTop: KueSpacing.md,
  },
  duelArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.lg,
    paddingVertical: KueSpacing.sm,
    minHeight: 0,
  },
  vsBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -19,
    marginTop: -19,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KueColors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  vsLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  duelCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.sm,
    gap: 6,
  },
  duelWinner: {
    borderColor: 'rgba(126,143,255,0.7)',
    backgroundColor: KueColors.accentSoft,
  },
  duelLost: {
    borderColor: 'rgba(217,112,90,0.6)',
  },
  duelDimmed: {
    opacity: 0.7,
  },
  poster: {
    width: '100%',
    aspectRatio: 42 / 54,
    borderRadius: 10,
    borderLeftWidth: 3,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterFallback: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 32,
  },
  duelTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  duelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duelMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  duelScore: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 16,
  },
  duelScoreWin: {
    color: KueColors.accent,
  },
  footer: {
    gap: KueSpacing.md,
    paddingTop: KueSpacing.sm,
    paddingBottom: KueSpacing.xxl,
  },
  footerInfo: {
    gap: 2,
  },
  roundLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  hint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: KueSpacing.sm,
  },
  lobby: {
    paddingBottom: KueSpacing.xxl,
    gap: KueSpacing.sm,
  },
  lobbyIntro: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  heading: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 26,
    lineHeight: 30,
  },
  body: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: KueSpacing.md,
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KueSpacing.sm,
  },
  scopeChip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  scopeChipActive: {
    backgroundColor: KueColors.foreground,
    borderColor: KueColors.foreground,
  },
  scopeLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  scopeLabelActive: {
    color: KueColors.background,
  },
  error: {
    color: KueColors.danger,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: KueColors.foreground,
    paddingHorizontal: KueSpacing.lg,
  },
  primaryLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
  ghostButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    paddingHorizontal: KueSpacing.lg,
  },
  ghostLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
  flexButton: {
    flex: 1,
  },
  total: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 44,
    lineHeight: 46,
  },
  totalUnit: {
    color: KueColors.ink3,
    fontSize: 20,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  resultFlash: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 11,
    marginLeft: 'auto',
  },
  results: {
    marginTop: KueSpacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  resultText: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  resultTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
  },
  resultPoints: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 12,
  },
  resultPointsZero: {
    color: KueColors.ink3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
    marginTop: KueSpacing.md,
  },
});
