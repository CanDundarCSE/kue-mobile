import { Image } from 'expo-image';
import { ArrowLeft, Check, EyeOff, RotateCcw, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { submitGame, spendHint } from '@/lib/api/mini-games';
import { fetchQuiz, type QuizQuestion } from '@/lib/mini-games/quiz';

const QUESTIONS_PER_GAME = 10;
const POINTS_PER_CORRECT = 20;
const FIFTY_FIFTY_PRICE = 15;

const SCOPES = [
  { id: 'movie', label: 'Film' },
  { id: 'series', label: 'Series' },
  { id: 'game', label: 'Game' },
  { id: 'anime', label: 'Anime' },
  { id: 'manga', label: 'Manga' },
];

type Phase = 'lobby' | 'loading' | 'playing' | 'revealed' | 'summary';

type QuizResult = {
  mediaId: number;
  correct: boolean;
  lifelineUsed: boolean;
  points: number;
};

export function MediaQuiz({
  onExit,
  onWalletChange,
}: {
  onExit: () => void;
  onWalletChange?: (balance: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [scope, setScope] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [seenQuestions, setSeenQuestions] = useState<string[]>([]);
  const [seenMedia, setSeenMedia] = useState<number[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [lifelineBusy, setLifelineBusy] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const question = questions[qIndex] ?? null;
  const total = results.reduce((sum, result) => sum + result.points, 0);
  const revealed = phase === 'revealed';

  const start = async () => {
    setPhase('loading');
    setError(null);
    try {
      const dealt = await fetchQuiz(scope, QUESTIONS_PER_GAME, seenQuestions, seenMedia);
      if (dealt.length === 0) {
        setError('Could not write any questions. Try again.');
        setPhase('lobby');
        return;
      }
      setQuestions(dealt);
      setSeenQuestions((prev) => [...prev, ...dealt.map((item) => item.id)]);
      setSeenMedia((prev) => [
        ...prev,
        ...dealt
          .map((item) => item.mediaId)
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ]);
      setQIndex(0);
      setPicked(null);
      setEliminated([]);
      setResults([]);
      setPhase('playing');
    } catch {
      setError('Could not write questions. Check your connection and try again.');
      setPhase('lobby');
    }
  };

  const answer = (index: number) => {
    if (!question || picked !== null) return;

    const correct = index === question.answerIndex;
    setPicked(index);
    setResults((prev) => [
      ...prev,
      {
        mediaId: question.mediaId ?? 0,
        correct,
        lifelineUsed: eliminated.length > 0,
        points: correct ? POINTS_PER_CORRECT : 0,
      },
    ]);
    setPhase('revealed');
  };

  const buyLifeline = async () => {
    if (!question || picked !== null || eliminated.length > 0 || lifelineBusy) return;

    setLifelineBusy(true);
    setError(null);
    try {
      const result = await spendHint('fiftyFifty');
      onWalletChange?.(result.balance);

      const wrong = question.options
        .map((_, index) => index)
        .filter((index) => index !== question.answerIndex);
      const shuffled = [...wrong].sort(() => Math.random() - 0.5);
      setEliminated(shuffled.slice(0, Math.min(2, wrong.length)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not use the lifeline.');
    } finally {
      setLifelineBusy(false);
    }
  };

  const next = async () => {
    if (qIndex + 1 < questions.length) {
      setQIndex(qIndex + 1);
      setPicked(null);
      setEliminated([]);
      setPhase('playing');
      return;
    }

    setPhase('summary');
    setSubmitting(true);
    try {
      const scored = await submitGame({
        game: 'media-quiz',
        scope: scope.length > 0 ? scope : SCOPES.map((item) => item.id),
        rounds: results.map((round) => ({
          mediaId: round.mediaId,
          attemptsUsed: 1,
          hintsUsed: round.lifelineUsed ? ['fiftyFifty'] : [],
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
      <Text style={styles.topTitle}>Media quiz</Text>
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
          <Text style={styles.heading}>How broad is your knowledge?</Text>
          <Text style={styles.body}>
            10 questions, 20 points each. A mix of catalog trivia and general knowledge. Drop
            15 points for a 50/50 lifeline when you are stuck.
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
            accessibilityLabel="Start quiz"
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
              <Text style={styles.primaryLabel}>Start quiz</Text>
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
          <Text style={styles.body}>
            {results.filter((result) => result.correct).length} of {results.length} correct
          </Text>
          {submitting ? <ActivityIndicator color={KueColors.ink3} /> : null}

          <View style={styles.results}>
            {results.map((result, position) => (
              <View key={position} style={styles.resultRow}>
                {result.correct ? (
                  <Check color={KueColors.accent} size={16} strokeWidth={2.5} />
                ) : (
                  <X color={KueColors.danger} size={16} strokeWidth={2.5} />
                )}
                <Text style={styles.resultText}>
                  Question {position + 1}
                  {result.lifelineUsed ? ' · 50/50' : ''}
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

  if (!question) return null;

  const poster = question.posters[0];

  return (
    <View style={styles.screen}>
      {topBar}

      <View style={styles.progressRow}>
        {questions.map((_, position) => (
          <View
            key={position}
            style={[
              styles.progressSegment,
              position < qIndex && styles.progressSegmentDone,
              position === qIndex && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.questionBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.questionMeta}>
          Question {qIndex + 1} of {questions.length}
          {question.source === 'trivia' ? ' · general' : ' · catalog'}
        </Text>

        {poster?.image ? (
          <View style={styles.posterWrap}>
            <Image source={{ uri: poster.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
        ) : null}

        <Text style={styles.prompt}>{question.prompt}</Text>

        <View style={styles.options}>
          {question.options.map((option, index) => {
            const isCorrect = revealed && index === question.answerIndex;
            const isWrongPick = revealed && picked === index && index !== question.answerIndex;
            const isEliminated = eliminated.includes(index);

            return (
              <Pressable
                key={`${option}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={option}
                accessibilityState={{ disabled: isEliminated || revealed }}
                disabled={revealed || isEliminated}
                onPress={() => answer(index)}
                style={[
                  styles.option,
                  isCorrect && styles.optionCorrect,
                  isWrongPick && styles.optionWrong,
                  isEliminated && styles.optionEliminated,
                ]}>
                <Text
                  style={[
                    styles.optionLabel,
                    isCorrect && styles.optionLabelCorrect,
                    isEliminated && styles.optionLabelEliminated,
                  ]}
                  numberOfLines={3}>
                  {option}
                </Text>
                {isCorrect ? <Check color={KueColors.accent} size={16} strokeWidth={2.5} /> : null}
                {isWrongPick ? <X color={KueColors.danger} size={16} strokeWidth={2.5} /> : null}
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {revealed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={qIndex + 1 >= questions.length ? 'See results' : 'Next question'}
            onPress={() => void next()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>
              {qIndex + 1 >= questions.length ? 'See results' : 'Next question'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={eliminated.length > 0 ? '50/50 used' : 'Use 50/50 lifeline'}
            disabled={eliminated.length > 0 || lifelineBusy}
            onPress={() => void buyLifeline()}
            style={({ pressed }) => [
              styles.lifeline,
              eliminated.length > 0 && styles.lifelineUsed,
              pressed && styles.pressed,
            ]}>
            {lifelineBusy ? (
              <ActivityIndicator color={KueColors.ink2} size="small" />
            ) : (
              <EyeOff
                color={eliminated.length > 0 ? KueColors.accent : KueColors.ink2}
                size={14}
                strokeWidth={1.8}
              />
            )}
            <Text style={[styles.lifelineLabel, eliminated.length > 0 && styles.lifelineLabelUsed]}>
              {eliminated.length > 0 ? '50/50 used' : `50/50 · ${FIFTY_FIFTY_PRICE} pts`}
            </Text>
          </Pressable>
        )}
      </ScrollView>
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
  questionBody: {
    paddingTop: KueSpacing.md,
    paddingBottom: KueSpacing.xxl,
    gap: KueSpacing.md,
  },
  questionMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  posterWrap: {
    width: 128,
    aspectRatio: 42 / 54,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
  },
  prompt: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 24,
    lineHeight: 29,
  },
  options: {
    gap: KueSpacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
    minHeight: 54,
    paddingHorizontal: KueSpacing.md,
    paddingVertical: KueSpacing.sm,
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
  optionEliminated: {
    opacity: 0.3,
  },
  optionLabel: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 14,
    lineHeight: 19,
  },
  optionLabelCorrect: {
    fontFamily: KueFonts.sansSemiBold,
  },
  optionLabelEliminated: {
    textDecorationLine: 'line-through',
  },
  lifeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  lifelineUsed: {
    borderColor: 'rgba(126,143,255,0.5)',
    backgroundColor: KueColors.accentSoft,
  },
  lifelineLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  lifelineLabelUsed: {
    color: KueColors.foreground,
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
    marginTop: KueSpacing.sm,
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
    marginTop: KueSpacing.sm,
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
  resultText: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
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
