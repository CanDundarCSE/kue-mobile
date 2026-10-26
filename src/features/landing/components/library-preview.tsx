import { LinearGradient } from "expo-linear-gradient";
import { Check, Minus, Plus } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { KueColors, KueFonts, KueTextScale } from "@/constants/kue-theme";
import { MediaAvatarCard } from "@/features/landing/components/media-avatar-card";
import { StatusPill } from "@/features/landing/components/status-pill";
import {
  MEDIA_TYPE_META,
  MOCK_ROWS,
  type LandingRow,
  type MediaType,
} from "@/features/landing/data";

const PREVIEW_ROWS: LandingRow[] = ["frieren", "elden-ring", "severance", "parasite"]
  .map((id) => MOCK_ROWS.find((row) => row.id === id))
  .filter((row): row is LandingRow => Boolean(row));

const FILTERS: { type: MediaType | "all"; label: string }[] = [
  { type: "all", label: "All" },
  { type: "movie", label: "Film" },
  { type: "series", label: "Series" },
  { type: "game", label: "Games" },
  { type: "anime", label: "Anime" },
  { type: "manga", label: "Manga" },
];

function countFor(type: MediaType | "all") {
  if (type === "all") return MOCK_ROWS.length;
  return MOCK_ROWS.filter((row) => row.type === type).length;
}

function PreviewRow({ row }: { row: LandingRow }) {
  const meta = MEDIA_TYPE_META[row.type];
  const percent = Math.min(100, Math.round((row.current / row.total) * 100));
  const isMovie = row.type === "movie";

  return (
    <View style={styles.row}>
      <MediaAvatarCard
        title={row.title}
        year={row.year}
        type={row.type}
        image={row.image}
      />

      <View style={styles.rowBody}>
        <Text
          maxFontSizeMultiplier={KueTextScale.control}
          style={styles.rowTitle}
          numberOfLines={1}>
          {row.title}
        </Text>

        <View style={styles.metaRow}>
          <View style={[styles.metaDot, { backgroundColor: meta.color }]} />
          <Text
            maxFontSizeMultiplier={KueTextScale.control}
            style={styles.metaText}
            numberOfLines={1}>
            {meta.label} · {row.year}
          </Text>
          <StatusPill status={row.status} compact />
        </View>

        {isMovie ? null : (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percent}%`,
                    backgroundColor: percent >= 100 ? KueColors.game : KueColors.accent,
                  },
                ]}
              />
            </View>
            <Text maxFontSizeMultiplier={KueTextScale.compact} style={styles.progressText}>
              {row.current}/{row.total} {row.unit}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.steppers}>
        {isMovie ? (
          <View style={styles.stepper}>
            <Check size={14} color={KueColors.game} strokeWidth={2.6} />
          </View>
        ) : (
          <>
            <View style={styles.stepper}>
              <Minus size={14} color={KueColors.ink2} strokeWidth={2.4} />
            </View>
            <View style={styles.stepper}>
              <Plus size={14} color={KueColors.ink2} strokeWidth={2.4} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

/**
 * A cropped, non-interactive peek at the signed-in library. It exists to make
 * the first carousel slide concrete: the product is a list you update, not a
 * marketing headline. The real screen arrives after sign-in.
 */
export function LibraryPreview() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Preview of a Kue library: Frieren, Elden Ring, Severance and Parasite with progress, statuses and counters."
      style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Your library</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{MOCK_ROWS.length} titles</Text>
        </View>
      </View>

      <View style={styles.chipsWrap}>
        <View style={styles.chips}>
          {FILTERS.map((filter) => {
            const active = filter.type === "all";

            return (
              <View key={filter.type} style={[styles.chip, active && styles.chipActive]}>
                <Text
                  maxFontSizeMultiplier={KueTextScale.compact}
                  style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {filter.label}
                </Text>
                <Text
                  maxFontSizeMultiplier={KueTextScale.compact}
                  style={[styles.chipCount, active && styles.chipCountActive]}>
                  {countFor(filter.type)}
                </Text>
              </View>
            );
          })}
        </View>
        <LinearGradient
          pointerEvents="none"
          colors={["transparent", KueColors.surface2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chipFade}
        />
      </View>

      <View>
        {PREVIEW_ROWS.map((row) => (
          <PreviewRow key={row.id} row={row} />
        ))}
      </View>

      <LinearGradient
        pointerEvents="none"
        colors={["transparent", KueColors.surface2]}
        style={styles.bottomFade}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    borderRadius: 22,
    backgroundColor: KueColors.surface2,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  countPill: {
    borderRadius: 999,
    backgroundColor: KueColors.surface3,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  countText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 10,
  },
  chipsWrap: {
    paddingLeft: 14,
  },
  chips: {
    flexDirection: "row",
    gap: 7,
    paddingRight: 40,
    paddingBottom: 12,
    overflow: "hidden",
  },
  chipFade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 12,
    width: 52,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: KueColors.surface3,
  },
  chipActive: {
    backgroundColor: KueColors.accent,
  },
  chipLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansMedium,
    fontSize: 11.5,
  },
  chipLabelActive: {
    color: KueColors.background,
  },
  chipCount: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
  },
  chipCountActive: {
    color: KueColors.background,
    opacity: 0.65,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 5,
    rowGap: 2,
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  metaText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 10.5,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  progressTrack: {
    flex: 1,
    height: 3,
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
    fontFamily: KueFonts.mono,
    fontSize: 9.5,
  },
  steppers: {
    flexDirection: "row",
    gap: 6,
  },
  stepper: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
  },
});
