import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Minus, Plus } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { KueColors, KueFonts, KueSpacing } from "@/constants/kue-theme";
import { lightHaptic } from "@/lib/haptics";
import {
  fetchContinue,
  updateProgress,
  type ContinueEntry,
} from "@/lib/api/home";

import { SectionLabel } from "./section-label";

const CARD_GAP = 12;
const MAX_DOTS = 7;

type Item = {
  mediaId: number;
  title: string;
  type: string;
  statusLabel: string;
  image?: string | null;
  current: number;
  total?: number;
  unit: string;
  episodic: boolean;
};

function toItem(entry: ContinueEntry): Item | null {
  // A progress step can complete a title; it should leave the rail.
  if (entry.status === "completed") return null;

  const type = entry.media?.mediaType ?? entry.mediaType ?? "movie";
  const episodic = type === "anime" || type === "series" || type === "manga";

  return {
    mediaId: entry.mediaId,
    title: entry.media?.title ?? "Untitled",
    type,
    statusLabel: statusLabel(entry.status, type),
    image: entry.media?.coverImage ?? null,
    current: entry.progress ?? 0,
    total: entry.media?.totalUnits ?? entry.totalUnits ?? undefined,
    unit: shortUnit(entry.media?.unitName ?? entry.unitName, type),
    episodic,
  };
}

function statusLabel(status: string, type: string) {
  if (status === "playing") return "Playing";
  if (status === "reading") return "Reading";
  if (type === "manga") return "Reading";
  if (type === "game") return "Playing";
  return "Watching";
}

function shortUnit(unitName: string | null | undefined, type: string) {
  const lower = (unitName ?? "").toLowerCase();
  if (lower.includes("chapter")) return "chapters";
  if (lower.includes("episode")) return "episodes";
  return type === "manga" ? "chapters" : "episodes";
}

export function ContinueCard({ gutter }: { gutter: number }) {
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();

  const continueQuery = useQuery({
    queryKey: ["continue"],
    queryFn: fetchContinue,
  });

  const mutation = useMutation({
    mutationFn: ({ mediaId, progress }: { mediaId: number; progress: number }) =>
      updateProgress(mediaId, progress),
    onSuccess: (updated) => {
      queryClient.setQueryData<ContinueEntry[]>(["continue"], (entries) =>
        entries?.flatMap((entry) =>
          entry.mediaId === updated.mediaId
            ? updated.status === "completed"
              ? []
              : [updated]
            : [entry],
        ),
      );
    },
  });

  const items = (continueQuery.data ?? [])
    .map(toItem)
    .filter((item): item is Item => item !== null);

  const cardWidth = Math.min(width * 0.8, 340);

  const [index, setIndex] = useState(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + CARD_GAP));
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    if (clamped !== index) setIndex(clamped);
  };

  if (continueQuery.isPending) {
    return (
      <View style={styles.section}>
        <SectionLabel>Continue</SectionLabel>
        <View style={[styles.card, styles.skeleton, { width: cardWidth, marginLeft: gutter }]}>
          <ActivityIndicator color={KueColors.ink3} />
        </View>
      </View>
    );
  }

  if (continueQuery.isError) {
    return (
      <View style={styles.section}>
        <SectionLabel>Continue</SectionLabel>
        <ErrorLine onRetry={() => void continueQuery.refetch()} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.section}>
        <SectionLabel>Continue</SectionLabel>
        <View style={[styles.empty, { marginHorizontal: gutter }]}>
          <Text style={styles.emptyTitle}>Nothing in progress.</Text>
          <Text style={styles.emptyBody}>
            Start a series, pick up a game, or crack open a manga — anything you are
            working through shows up here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionLabel>Continue</SectionLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + CARD_GAP}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ marginHorizontal: -gutter }}
        contentContainerStyle={[styles.rail, { paddingHorizontal: gutter }]}>
        {items.map((item) => {
          const busy = mutation.isPending && mutation.variables?.mediaId === item.mediaId;
          const percent =
            item.episodic && item.total && item.total > 0
              ? Math.min(100, Math.round((item.current / item.total) * 100))
              : null;

          const step = (delta: number) => {
            const next = Math.max(
              0,
              Math.min(item.total ?? Number.MAX_SAFE_INTEGER, item.current + delta),
            );
            if (next === item.current || busy) return;
            lightHaptic();
            mutation.mutate({ mediaId: item.mediaId, progress: next });
          };

          return (
            <View key={item.mediaId} style={[styles.card, { width: cardWidth }]}>
              <View style={styles.poster}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Text style={styles.posterFallback}>{item.title.charAt(0)}</Text>
                )}
              </View>

              <View style={styles.info}>
                <Text style={styles.status} numberOfLines={1}>
                  {item.statusLabel}
                </Text>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.progressBlock}>
                  {percent !== null ? (
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${percent}%` }]} />
                    </View>
                  ) : null}

                  <View style={styles.footerRow}>
                    <Text style={styles.counter} numberOfLines={1}>
                      {percent !== null
                        ? `${item.current} / ${item.total} ${item.unit}`
                        : item.statusLabel}
                    </Text>

                    {item.episodic ? (
                      <View style={styles.steps}>
                        <StepButton
                          label="Previous episode"
                          disabled={busy || item.current <= 0}
                          onPress={() => step(-1)}
                          icon={<Minus color={KueColors.ink2} size={16} strokeWidth={2} />}
                        />
                        <StepButton
                          label="Next episode"
                          disabled={busy || (item.total !== undefined && item.current >= item.total)}
                          onPress={() => step(1)}
                          icon={
                            busy ? (
                              <ActivityIndicator color={KueColors.ink2} size="small" />
                            ) : (
                              <Plus color={KueColors.ink2} size={16} strokeWidth={2} />
                            )
                          }
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {items.length > 0 ? (
        items.length > MAX_DOTS ? (
          <Text
            accessibilityLabel={`Card ${index + 1} of ${items.length}`}
            style={[styles.pageCounter, { paddingHorizontal: gutter }]}>
            <Text style={styles.pageCounterCurrent}>{index + 1}</Text> / {items.length}
          </Text>
        ) : (
          <View
            accessible
            accessibilityLabel={`Card ${index + 1} of ${items.length}`}
            style={[styles.dots, { paddingHorizontal: gutter }]}>
            {items.map((item, i) => (
              <View key={item.mediaId} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        )
      ) : null}
    </View>
  );
}

function StepButton({
  label,
  disabled,
  onPress,
  icon,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.stepButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {icon}
    </Pressable>
  );
}

export function ErrorLine({ onRetry }: { onRetry: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onRetry}
      style={({ pressed }) => [styles.error, pressed && styles.pressed]}>
      <Text style={styles.errorText}>Couldn&apos;t load — tap to retry.</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: KueSpacing.md,
  },
  rail: {
    gap: CARD_GAP,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KueColors.line2,
  },
  dotActive: {
    width: 18,
    backgroundColor: KueColors.accent,
  },
  pageCounter: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textAlign: "center",
  },
  pageCounterCurrent: {
    color: KueColors.accent,
  },
  card: {
    flexDirection: "row",
    gap: KueSpacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.lg,
  },
  skeleton: {
    height: 132,
    marginTop: KueSpacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.xl,
    gap: KueSpacing.sm,
  },
  emptyTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 20,
  },
  emptyBody: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  poster: {
    width: 56,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  posterFallback: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 24,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
    gap: KueSpacing.sm,
  },
  status: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  progressBlock: {
    gap: KueSpacing.sm,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: KueColors.surface3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: KueColors.accent,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: KueSpacing.sm,
  },
  counter: {
    flexShrink: 1,
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  steps: {
    flexDirection: "row",
    gap: 6,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
  error: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.xl,
  },
  errorText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    textAlign: "center",
  },
});
