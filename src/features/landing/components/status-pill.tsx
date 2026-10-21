import { BookOpen, Check, Eye, EyeOff, Gamepad2, Pause, Play } from "lucide-react-native";
import type { ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";

import { KueColors } from "@/constants/kue-theme";
import type { LandingStatus } from "@/features/landing/data";

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const STATUS_META: Record<
  LandingStatus,
  { label: string; color: string; Icon: IconComponent }
> = {
  watching: { label: "Watching", color: KueColors.accent, Icon: Play },
  playing: { label: "Playing", color: KueColors.game, Icon: Gamepad2 },
  reading: { label: "Reading", color: KueColors.series, Icon: BookOpen },
  hold: { label: "On hold", color: KueColors.ink3, Icon: Pause },
  done: { label: "Done", color: KueColors.game, Icon: Check },
  watched: { label: "Watched", color: KueColors.game, Icon: Eye },
  unwatched: { label: "Unwatched", color: KueColors.ink3, Icon: EyeOff },
};

export function StatusPill({ status, compact = false }: { status: LandingStatus; compact?: boolean }) {
  const meta = STATUS_META[status];

  if (compact) {
    return (
      <View style={styles.dotRow}>
        <View style={[styles.dot, { backgroundColor: meta.color }]} />
        <Text style={styles.dotLabel}>{meta.label}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.pill,
        { borderColor: `${meta.color}55`, backgroundColor: `${meta.color}1f` },
      ]}>
      <meta.Icon size={12} color={meta.color} strokeWidth={2.4} />
      <Text style={[styles.pillLabel, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pillLabel: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotLabel: {
    color: KueColors.ink2,
    fontSize: 12,
    fontWeight: "500",
  },
});
