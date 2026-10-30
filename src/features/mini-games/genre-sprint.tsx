import { Image } from 'expo-image';
import { ArrowLeft, Check, Flame, RotateCcw, Timer, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { fetchSprint, submitGame, type SprintRound } from '@/lib/api/mini-games';

const ROUNDS_PER_GAME = 10;
const TIME_LIMIT_MS = 10_000;
const LOW_TIME_MS = 3_000;

const SCOPES = [
  { id: 'movie', label: 'Film' },
  { id: 'series', label: 'Series' },
  { id: 'game', label: 'Game' },
  { id: 'anime', label: 'Anime' },
  { id: 'manga', label: 'Manga' },
];

function sprintPoints(streak: number) {
  return Math.min(15 + 5 * streak, 100);
}

type Phase = 'lobby' | 'loading' | 'playing' | 'revealed' | 'summary';

type SprintResult = {
  mediaId: number;
  correct: boolean;
  timedOut: boolean;
  points: number;
  streakAfter: number;
  title: string;
};

export function GenreSprint({
  onExit,
  onWalletChange,
}: {
  onExit: () => void;
  onWalletChange?: (balance: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [scope, setScope] = useState<string[]>([]);
  const [rounds, setRounds] = useState<SprintRound[]>([]);
  const [seen, setSeen] = useState<number[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(TIME_LIMIT_MS);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [results, setResults] = useState<SprintResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const round = rounds[roundIndex] ?? null;
  const total = results.reduce((sum, result) => sum + result.points, 0);
  const revealed = phase === 'revealed';
  const lowTime = remaining <= LOW_TIME_MS;

  const resolve = (index: number | null) => {
    if (!round) return;

    const correct = index !== null && index === round.answerIndex;
    const nextStreak = correct ? streak + 1 : 0;

    setPicked(index);
    setStreak(nextStreak);
    setBestStreak((best) => Math.max(best, nextStreak));
    setResults((prev) => [
      ...prev,
      {
        mediaId: round.media.id ?? 0,
        correct,
        timedOut: index === null,
        points: correct ? sprintPoints(nextStreak) : 0,
        streakAfter: nextStreak,
        title: round.media.title,
      },
    ]);
    setPhase('revealed');
  };

  const resolveRef = useRef(resolve);
  useEffect(() => {
    resolveRef.current = resolve;
  });

  useEffect(() => {
    if (phase !== 'playing') return;

    const deadline = Date.now() + TIME_LIMIT_MS;
    const timer = setInterval(() => {
      const left = deadline - Date.now();
      if (left <= 0) {
        clearInterval(timer);
        resolveRef.current(null);
      } else {
        setRemaining(left);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [phase, roundIndex]);

  const start = async () => {
    setPhase('loading');
    setError(null);
    try {
      const dealt = await fetchSprint(scope, ROUNDS_PER_GAME, seen);
      if (dealt.length === 0) {
        setError('Could not deal any rounds. Try again.');
        setPhase('lobby');
        return;
      }
      setRounds(dealt);
      setSeen((prev) => [
        ...prev,
        ...dealt
          .map((item) => item.media.id)
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ]);
      setRoundIndex(0);
      setPicked(null);
      setRemaining(TIME_LIMIT_MS);
      setStreak(0);
      setBestStreak(0);
      setResults([]);
      setPhase('playing');
    } catch {
      setError('Could not deal the rounds. Check your connection and try again.');
      setPhase('lobby');
    }
  };

  const next = async () => {
    if (roundIndex + 1 < rounds.length) {
      setRoundIndex(roundIndex + 1);
      setPicked(null);
      setRemaining(TIME_LIMIT_MS);
      setPhase('playing');
      return;
    }

    setPhase('summary');
    setSubmitting(true);
    try {
      const scored = await submitGame({
        game: 'genre-sprint',
        scope: scope.length > 0 ? scope : SCOPES.map((item) => item.id),
        rounds: results.map((result) => ({
          mediaId: result.mediaId,
          attemptsUsed: 1,
          hintsUsed: [],
          points: result.points,
        })),
      });
      onWalletChange?.(scored.balance);
    } catch {
      // The summary still shows the local score when submission fails.
    } finally {
      setSubmitting(false);
    }
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
      <Text style={styles.topTitle}>Genre sprint</Text>
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
          <Text style={styles.heading}>Name the genre at speed.</Text>
          <Text style={styles.bodyText}>
            10 posters, 10 seconds each. Right answers build a streak — payouts climb from 20
            to 100 points. Hesitate and the round is gone.
          </Text>

          <Text style={styles.label}>Pick your pool</Text>
          <View style={styles.scopeRow}>
            <ScopeChip label="All media" active={scope.length === 0} onPress={() => setScope([])} />
            {SCOPES.map((item) => (
              <ScopeChip
                key={item.id}
                label={item.label}
                active={scope.includes(item.id)}
                onPress={() =>
                  setScope((prev) =>
                    prev.includes(item.id)
                      ? prev.filter((value) => value !== item.id)
                      : [...prev, item.id],
                  )
                }
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
              <View key={`${result.title}-${position}`} style={styles.resultRow}>
                {result.correct ? (
                  <Check color={KueColors.accent} size={16} strokeWidth={2.5} />
                ) : (
                  <X color={KueColors.danger} size={16} strokeWidth={2.5} />
                )}
                <View style={styles.resultBody}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {result.title}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {result.correct
                      ? `Streak ${result.streakAfter}`
                      : result.timedOut
                        ? 'Timed out'
                        : 'Wrong genre'}
                  </Text>
                </View>
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

  if (!round) return null;

  const timeRatio = Math.max(0, Math.min(1, remaining / TIME_LIMIT_MS));

  return (
    <View style={styles.screen}>
      {topBar}

      <View style={styles.progressRow}>
        {rounds.map((_, position) => (
          <View
            key={position}
            style={[
              styles.progressSegment,
              position < roundIndex && styles.progressSegmentDone,
              position === roundIndex && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.timerRow}>
        <Timer color={lowTime ? KueColors.danger : KueColors.ink3} size={13} strokeWidth={2} />
        <View style={styles.timerTrack}>
          <View
            style={[
              styles.timerFill,
              { width: `${timeRatio * 100}%` },
              lowTime && styles.timerFillLow,
            ]}
          />
        </View>
        <Text style={[styles.timerText, lowTime && styles.timerTextLow]}>
          {Math.ceil(remaining / 1000)}s
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.posterWrap}>
          <Image
            source={{ uri: round.media.coverImage ?? '' }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          {revealed ? (
            <View style={styles.revealBar}>
              <Text style={styles.revealTitle} numberOfLines={2}>
                {round.media.title}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.options}>
          {round.options.map((option, index) => {
            const isCorrect = revealed && index === round.answerIndex;
            const isWrongPick = revealed && picked === index && index !== round.answerIndex;

            return (
              <Pressable
                key={`${option}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={option}
                disabled={revealed}
                onPress={() => resolve(index)}
                style={[
                  styles.option,
                  isCorrect && styles.optionCorrect,
                  isWrongPick && styles.optionWrong,
                ]}>
                <Text
                  style={[styles.optionLabel, isCorrect && styles.optionLabelCorrect]}
                  numberOfLines={2}>
                  {option}
                </Text>
                {isCorrect ? <Check color={KueColors.accent} size={15} strokeWidth={2.5} /> : null}
                {isWrongPick ? <X color={KueColors.danger} size={15} strokeWidth={2.5} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <View style={styles.streakRow}>
            <Flame
              color={streak > 1 ? KueColors.accent : KueColors.ink3}
              size={13}
              strokeWidth={2}
            />
            <Text style={styles.streakText}>
              {streak > 0 ? `Streak ${streak} · next ${sprintPoints(streak + 1)}` : 'No streak'}
            </Text>
          </View>

          {revealed ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={roundIndex + 1 >= rounds.length ? 'See results' : 'Next round'}
              onPress={() => void next()}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryLabel}>
                {roundIndex + 1 >= rounds.length ? 'See results' : 'Next round'}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.hint}>Tap the genre that fits this poster.</Text>
          )}
        </View>
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
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.xs,
  },
  timerTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
  },
  timerFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: KueColors.accent,
  },
  timerFillLow: {
    backgroundColor: KueColors.danger,
  },
  timerText: {
    width: 30,
    textAlign: 'right',
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 11,
  },
  timerTextLow: {
    color: KueColors.danger,
  },
  body: {
    flex: 1,
    paddingBottom: KueSpacing.xxl,
    gap: KueSpacing.sm,
  },
  posterWrap: {
    flex: 1,
    minHeight: 0,
    width: '62%',
    alignSelf: 'center',
    marginVertical: KueSpacing.sm,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    justifyContent: 'flex-end',
  },
  revealBar: {
    padding: KueSpacing.sm,
    backgroundColor: 'rgba(17,17,19,0.82)',
  },
  revealTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 16,
    lineHeight: 20,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KueSpacing.sm,
  },
  option: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 52,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
  },
  optionCorrect: {
    borderColor: 'rgba(126,143,255,0.7)',
    backgroundColor: KueColors.accentSoft,
  },
  optionWrong: {
    borderColor: 'rgba(217,112,90,0.6)',
    backgroundColor: 'rgba(217,112,90,0.10)',
  },
  optionLabel: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  optionLabelCorrect: {
    fontFamily: KueFonts.sansSemiBold,
  },
  footer: {
    gap: KueSpacing.sm,
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
  hint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    textAlign: 'center',
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
  bodyText: {
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
  resultBody: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  resultMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.7,
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
