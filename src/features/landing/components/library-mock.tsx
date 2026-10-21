import * as Haptics from "expo-haptics";
import { Check, Eye, Minus, Plus } from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { KueColors } from "@/constants/kue-theme";
import { MediaAvatarCard } from "@/features/landing/components/media-avatar-card";
import { StatusPill } from "@/features/landing/components/status-pill";
import {
  MEDIA_TYPE_META,
  MOCK_ROWS,
  type LandingRow,
  type LandingStatus,
  type MediaType,
} from "@/features/landing/data";
import { useResponsive } from "@/lib/responsive";

const TABS: { label: string; type: MediaType | "all" }[] = [
  { label: "All", type: "all" },
  { label: "Film", type: "movie" },
  { label: "Series", type: "series" },
  { label: "Games", type: "game" },
  { label: "Anime", type: "anime" },
  { label: "Manga", type: "manga" },
];

const RESUME: Record<MediaType, LandingStatus> = {
  anime: "watching",
  series: "watching",
  manga: "reading",
  game: "playing",
  movie: "watched",
};

function Stepper({
  label,
  onPress,
  compact,
  children,
}: {
  label: string;
  onPress: () => void;
  compact: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={8}
      android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
      style={({ pressed }) => [
        styles.stepper,
        compact && styles.stepperCompact,
        pressed && styles.stepperPressed,
      ]}>
      {children}
    </Pressable>
  );
}

function MockRow({
  row,
  compact,
  onBump,
  onToggleWatched,
}: {
  row: LandingRow;
  compact: boolean;
  onBump: (id: string, delta: number) => void;
  onToggleWatched: (id: string) => void;
}) {
  const percent = Math.min(100, Math.round((row.current / row.total) * 100));
  const isMovie = row.type === "movie";
  const meta = MEDIA_TYPE_META[row.type];
  const complete = percent >= 100;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <MediaAvatarCard
        title={row.title}
        year={row.year}
        type={row.type}
        image={row.image}
        size={compact ? "sm" : "md"}
      />

      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {row.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={[styles.metaDot, { backgroundColor: meta.color }]} />
          <Text style={styles.metaText} numberOfLines={1}>
            {meta.label} · {row.year}
          </Text>
          <StatusPill status={row.status} compact />
        </View>

        {!isMovie ? (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percent}%`,
                    backgroundColor: complete ? KueColors.game : KueColors.accent,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {row.current}/{row.total} {row.unit} · {percent}%
            </Text>
          </View>
        ) : null}
      </View>

      {isMovie ? (
        <Stepper
          compact={compact}
          label={row.status === "watched" ? `Mark ${row.title} unwatched` : `Mark ${row.title} watched`}
          onPress={() => {
            void Haptics.selectionAsync();
            onToggleWatched(row.id);
          }}>
          {row.status === "watched" ? (
            <Check size={16} color={KueColors.game} strokeWidth={2.6} />
          ) : (
            <Eye size={16} color={KueColors.ink2} strokeWidth={2.2} />
          )}
        </Stepper>
      ) : (
        <View style={styles.stepperGroup}>
          <Stepper
            compact={compact}
            label={`Decrease ${row.title}`}
            onPress={() => {
              void Haptics.selectionAsync();
              onBump(row.id, -1);
            }}>
            <Minus size={16} color={KueColors.ink2} strokeWidth={2.4} />
          </Stepper>
          <Stepper
            compact={compact}
            label={`Increase ${row.title}`}
            onPress={() => {
              void Haptics.selectionAsync();
              onBump(row.id, 1);
            }}>
            <Plus size={16} color={KueColors.ink2} strokeWidth={2.4} />
          </Stepper>
        </View>
      )}
    </View>
  );
}

export function LibraryMock() {
  const [rows, setRows] = useState<LandingRow[]>(MOCK_ROWS);
  const [tab, setTab] = useState<MediaType | "all">("all");
  const { width } = useResponsive();
  const compact = width < 360;

  const visible = useMemo(
    () => rows.filter((row) => tab === "all" || row.type === tab),
    [rows, tab],
  );

  const countFor = (type: MediaType | "all") =>
    type === "all" ? rows.length : rows.filter((row) => row.type === type).length;

  const bump = (id: string, delta: number) => {
    setRows((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry;

        const next = Math.max(0, Math.min(entry.total, entry.current + delta));
        const finished = next >= entry.total && entry.status !== "done";

        return {
          ...entry,
          current: next,
          status: finished ? "done" : entry.status === "done" ? RESUME[entry.type] : entry.status,
        };
      }),
    );
  };

  const toggleWatched = (id: string) => {
    setRows((current) =>
      current.map((entry) =>
        entry.id === id
          ? { ...entry, status: entry.status === "watched" ? "unwatched" : "watched" }
          : entry,
      ),
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Your library</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {visible.length} {visible.length === 1 ? "title" : "titles"}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {TABS.map((entry) => {
          const active = tab === entry.type;

          return (
            <Pressable
              key={entry.type}
              onPress={() => {
                void Haptics.selectionAsync();
                setTab(entry.type);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}>
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{entry.label}</Text>
              <Text style={[styles.chipCount, active && styles.chipCountActive]}>
                {countFor(entry.type)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View>
        {visible.map((row) => (
          <MockRow
            key={row.id}
            row={row}
            compact={compact}
            onBump={bump}
            onToggleWatched={toggleWatched}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    borderRadius: 24,
    backgroundColor: KueColors.surface2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cardTitle: {
    color: KueColors.foreground,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  countPill: {
    borderRadius: 999,
    backgroundColor: KueColors.surface3,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countText: {
    color: KueColors.ink2,
    fontSize: 12,
    fontWeight: "600",
  },
  chips: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: KueColors.surface3,
    overflow: "hidden",
  },
  chipActive: {
    backgroundColor: KueColors.accent,
  },
  chipPressed: {
    opacity: 0.75,
  },
  chipLabel: {
    color: KueColors.ink2,
    fontSize: 12.5,
    fontWeight: "600",
  },
  chipLabelActive: {
    color: KueColors.background,
  },
  chipCount: {
    color: KueColors.ink3,
    fontSize: 11.5,
    fontWeight: "700",
  },
  chipCountActive: {
    color: KueColors.background,
    opacity: 0.65,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
  },
  rowCompact: {
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowTitle: {
    color: KueColors.foreground,
    fontSize: 14.5,
    fontWeight: "600",
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 6,
    rowGap: 3,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaText: {
    color: KueColors.ink3,
    fontSize: 12,
    fontWeight: "500",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: KueColors.line,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    color: KueColors.ink3,
    fontSize: 11.5,
    fontWeight: "500",
  },
  stepperGroup: {
    flexDirection: "row",
    gap: 8,
  },
  stepper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stepperCompact: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  stepperPressed: {
    opacity: 0.65,
  },
});
