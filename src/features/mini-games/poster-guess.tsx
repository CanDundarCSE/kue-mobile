import { Image } from 'expo-image';
import { ArrowLeft, Check, Lightbulb, RotateCcw, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  fetchPosters,
  spendHint,
  submitGame,
  type MiniGamePoster,
} from '@/lib/api/mini-games';

const ROUNDS_PER_GAME = 5;
const START_POINTS = 100;
const DECAY_PER_WRONG = 20;
const POINTS_FLOOR = 10;
const MAX_GUESSES = 6;

const HINTS = [
  { type: 'year', label: 'Year', price: 10 },
  { type: 'type', label: 'Type', price: 15 },
  { type: 'firstLetter', label: 'First letter', price: 25 },
] as const;

type HintType = (typeof HINTS)[number]['type'];

const SCOPES = [
  { id: 'movie', label: 'Film' },
  { id: 'series', label: 'Series' },
  { id: 'game', label: 'Game' },
  { id: 'anime', label: 'Anime' },
  { id: 'manga', label: 'Manga' },
];

const TYPE_LABEL: Record<string, string> = {
  anime: 'Anime',
  series: 'Series',
  manga: 'Manga',
  game: 'Game',
  movie: 'Film',
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an)\s+/, '');
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= b.length; j += 1) {
      next[j] = Math.min(
        prev[j] + 1,
        next[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = next;
  }
  return prev[b.length];
}

function isCorrect(guess: string, title: string) {
  const left = normalize(guess);
  const right = normalize(title);
  if (!left || !right) return false;
  if (left === right) return true;
  return levenshtein(left, right) <= Math.max(2, Math.floor(right.length * 0.12));
}

function pointsAtStake(wrongs: number) {
  return Math.max(START_POINTS - wrongs * DECAY_PER_WRONG, POINTS_FLOOR);
}

function blurFor(wrongs: number) {
  const levels = [26, 20, 14, 8, 4, 0];
  return levels[Math.min(wrongs, levels.length - 1)];
}

type Phase = 'lobby' | 'loading' | 'playing' | 'revealed' | 'summary';

type RoundResult = {
  mediaId: number;
  title: string;
  attemptsUsed: number;
  hintsUsed: string[];
  points: number;
  solved: boolean;
};

export function PosterGuess({
  onExit,
  onWalletChange,
}: {
  onExit: () => void;
  onWalletChange?: (balance: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [scope, setScope] = useState<string[]>([]);
  const [posters, setPosters] = useState<MiniGamePoster[]>([]);
  const [seen, setSeen] = useState<number[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState<HintType[]>([]);
  const [hintBusy, setHintBusy] = useState<HintType | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const poster = posters[roundIndex] ?? null;
  const stake = pointsAtStake(wrongs);
  const total = results.reduce((sum, result) => sum + result.points, 0);
  const revealed = phase === 'revealed';
  const singleType = scope.length === 1;
  const visibleHints = HINTS.filter((hint) => !(hint.type === 'type' && singleType));

  const start = async () => {
    setPhase('loading');
    setError(null);
    try {
      const dealt = await fetchPosters(scope, ROUNDS_PER_GAME, seen);
      if (dealt.length === 0) {
        setError('Could not deal any posters. Try again.');
        setPhase('lobby');
        return;
      }
      setPosters(dealt);
      setSeen((prev) => [...prev, ...dealt.map((item) => item.id)]);
      setRoundIndex(0);
      setWrongs(0);
      setGuess('');
      setFeedback(null);
      setHintsUsed([]);
      setResults([]);
      setPhase('playing');
    } catch {
      setError('Could not deal the posters. Check your connection and try again.');
      setPhase('lobby');
    }
  };

  const finishRound = (result: RoundResult) => {
    setResults((prev) => [...prev, result]);
    setPhase('revealed');
  };

  const submitGuess = () => {
    if (!poster || phase !== 'playing' || !guess.trim()) return;

    if (isCorrect(guess, poster.title)) {
      finishRound({
        mediaId: poster.id,
        title: poster.title,
        attemptsUsed: wrongs + 1,
        hintsUsed: [...hintsUsed],
        points: pointsAtStake(wrongs),
        solved: true,
      });
      return;
    }

    const nextWrongs = wrongs + 1;
    if (nextWrongs >= MAX_GUESSES) {
      finishRound({
        mediaId: poster.id,
        title: poster.title,
        attemptsUsed: nextWrongs,
        hintsUsed: [...hintsUsed],
        points: 0,
        solved: false,
      });
      return;
    }

    setWrongs(nextWrongs);
    setGuess('');
    setFeedback(
      `Not quite — the poster clears a little. ${pointsAtStake(nextWrongs)} pts left on this one.`,
    );
  };

  const buyHint = async (hint: HintType) => {
    if (!poster || phase !== 'playing' || hintsUsed.includes(hint) || hintBusy) return;
    setHintBusy(hint);
    setError(null);
    try {
      const result = await spendHint(hint);
      onWalletChange?.(result.balance);
      setHintsUsed((prev) => [...prev, hint]);
      setFeedback(null);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'Could not buy the hint.');
    } finally {
      setHintBusy(null);
    }
  };

  const giveUp = () => {
    if (!poster || phase !== 'playing') return;
    finishRound({
      mediaId: poster.id,
      title: poster.title,
      attemptsUsed: wrongs,
      hintsUsed: [...hintsUsed],
      points: 0,
      solved: false,
    });
  };

  const nextRound = async () => {
    if (roundIndex + 1 < posters.length) {
      setRoundIndex(roundIndex + 1);
      setWrongs(0);
      setGuess('');
      setFeedback(null);
      setHintsUsed([]);
      setPhase('playing');
      return;
    }

    setPhase('summary');
    setSubmitting(true);
    try {
      const scored = await submitGame({
        game: 'poster-guess',
        scope: scope.length > 0 ? scope : SCOPES.map((item) => item.id),
        rounds: results.map((round) => ({
          mediaId: round.mediaId,
          attemptsUsed: Math.max(1, round.attemptsUsed),
          hintsUsed: round.hintsUsed,
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

  const hintValue = (hint: HintType) => {
    if (!poster) return '';
    if (hint === 'year') return poster.year ? String(poster.year) : 'Unknown';
    if (hint === 'type') return TYPE_LABEL[poster.mediaType] ?? poster.mediaType;
    const title = poster.title.trim();
    return `"${title.charAt(0)}…" (${title.length} letters)`;
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
      <Text style={styles.topTitle}>Poster guess</Text>
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
          <Text style={styles.heading}>Name that poster.</Text>
          <Text style={styles.body}>
            5 posters, 100 points each. A miss clears the image a little but costs 20 points.
            You can also spend points on hints.
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
          {submitting ? <ActivityIndicator color={KueColors.ink3} /> : null}

          <View style={styles.results}>
            {results.map((result, position) => (
              <View key={`${result.mediaId}-${position}`} style={styles.resultRow}>
                {result.solved ? (
                  <Check color={KueColors.accent} size={16} strokeWidth={2.5} />
                ) : (
                  <X color={KueColors.danger} size={16} strokeWidth={2.5} />
                )}
                <View style={styles.resultBody}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {result.title}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {result.solved
                      ? `${result.attemptsUsed} ${result.attemptsUsed === 1 ? 'try' : 'tries'}`
                      : 'Unsolved'}
                    {result.hintsUsed.length > 0 ? ` · ${result.hintsUsed.length} hints` : ''}
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

  if (!poster) return null;

  return (
    <View style={styles.screen}>
      {topBar}

      <View style={styles.progressRow}>
        {posters.map((_, position) => (
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

      <View style={styles.posterWrap}>
        <Image
          source={{ uri: poster.coverImage ?? '' }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={revealed ? 0 : blurFor(wrongs)}
        />
        {revealed ? (
          <View style={styles.revealBar}>
            <Text style={styles.revealTitle} numberOfLines={2}>
              {poster.title}
            </Text>
            <Text style={styles.revealMeta}>{poster.year ?? ''}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        {revealed ? (
          <>
            <Text style={styles.revealFeedback}>
              {results[results.length - 1]?.solved
                ? `Solved for ${results[results.length - 1]?.points} pts.`
                : 'Out of guesses.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={roundIndex + 1 >= posters.length ? 'See results' : 'Next poster'}
              onPress={() => void nextRound()}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryLabel}>
                {roundIndex + 1 >= posters.length ? 'See results' : 'Next poster'}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>
                Round {roundIndex + 1} of {posters.length}
              </Text>
              <Text style={styles.statusStake}>{stake} pts</Text>
            </View>

            <View style={styles.hintRow}>
              {visibleHints.map((hint) => {
                const used = hintsUsed.includes(hint.type);
                return (
                  <Pressable
                    key={hint.type}
                    accessibilityRole="button"
                    accessibilityLabel={`${hint.label} hint`}
                    disabled={used || hintBusy !== null}
                    onPress={() => void buyHint(hint.type)}
                    style={[styles.hintChip, used && styles.hintChipUsed]}>
                    {hintBusy === hint.type ? (
                      <ActivityIndicator color={KueColors.ink2} size="small" />
                    ) : (
                      <Lightbulb color={used ? KueColors.accent : KueColors.ink3} size={12} strokeWidth={2} />
                    )}
                    <Text style={[styles.hintLabel, used && styles.hintLabelUsed]}>
                      {used ? hintValue(hint.type) : `${hint.label} · ${hint.price}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.guessRow}>
              <TextInput
                value={guess}
                onChangeText={setGuess}
                onSubmitEditing={submitGuess}
                placeholder="Type the title…"
                placeholderTextColor={KueColors.ink3}
                autoCorrect={false}
                returnKeyType="search"
                style={styles.guessInput}
                accessibilityLabel="Your guess"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Submit guess"
                disabled={guess.trim().length === 0}
                onPress={submitGuess}
                style={({ pressed }) => [
                  styles.guessButton,
                  pressed && styles.pressed,
                  guess.trim().length === 0 && styles.disabled,
                ]}>
                <Text style={styles.guessButtonLabel}>Guess</Text>
              </Pressable>
            </View>

            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Give up"
              onPress={giveUp}
              style={styles.giveUp}>
              <Text style={styles.giveUpLabel}>Give up</Text>
            </Pressable>
          </>
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
  posterWrap: {
    flex: 1,
    minHeight: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    marginVertical: KueSpacing.sm,
    justifyContent: 'flex-end',
  },
  revealBar: {
    padding: KueSpacing.md,
    backgroundColor: 'rgba(17,17,19,0.82)',
  },
  revealTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 20,
    lineHeight: 24,
  },
  revealMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  footer: {
    gap: KueSpacing.sm,
    paddingBottom: KueSpacing.xxl,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  statusStake: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 11,
  },
  hintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KueSpacing.sm,
  },
  hintChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  hintChipUsed: {
    borderColor: 'rgba(126,143,255,0.5)',
    backgroundColor: KueColors.accentSoft,
  },
  hintLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  hintLabelUsed: {
    color: KueColors.foreground,
  },
  guessRow: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
  },
  guessInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 14,
  },
  guessButton: {
    minWidth: 84,
    height: 48,
    borderRadius: 12,
    backgroundColor: KueColors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
  },
  guessButtonLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  feedback: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  giveUp: {
    alignSelf: 'center',
    minHeight: 34,
    justifyContent: 'center',
  },
  giveUpLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  revealFeedback: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
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
