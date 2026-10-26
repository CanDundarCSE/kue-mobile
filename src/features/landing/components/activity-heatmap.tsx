import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { KueColors } from "@/constants/kue-theme";
import {
  LANDING_RAMP,
  LANDING_TODAY,
  type ActivityHeatmapItem,
} from "@/features/landing/data";
import { useResponsive } from "@/lib/responsive";

const MS_PER_DAY = 86_400_000;
const GAP = 3;

function toUtcDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function startOfUtcDay(value: number) {
  return Math.floor(value / MS_PER_DAY) * MS_PER_DAY;
}

function buildLevels(values: number[], top: number) {
  const distinct = [...new Set(values)].sort((a, b) => a - b);
  const levels = new Map<number, number>();

  distinct.forEach((value, index) => {
    levels.set(value, 1 + Math.floor((index * top) / distinct.length));
  });

  return levels;
}

type Cell = { key: number; level: number | null };

export function ActivityHeatmap({
  items,
  today = LANDING_TODAY,
  weeks,
  ramp = LANDING_RAMP,
}: {
  items: ActivityHeatmapItem[];
  today?: number;
  weeks?: number;
  ramp?: string[];
}) {
  const { width, contentWidth } = useResponsive();
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const resolvedWeeks = useMemo(() => {
    if (weeks !== undefined) return weeks;
    if (width < 360) return 18;
    if (width < 420) return 21;
    if (width < 520) return 24;
    return 26;
  }, [weeks, width]);

  const cellSize = useMemo(() => {
    // Fall back to the page width before the card has measured itself.
    const available = measuredWidth > 0 ? measuredWidth : contentWidth - 48;
    const size = Math.floor((available - GAP * (resolvedWeeks - 1)) / resolvedWeeks);
    return Math.min(18, Math.max(6, size));
  }, [contentWidth, measuredWidth, resolvedWeeks]);

  const { weeksData, activeDays, addedTotal, completedTotal } = useMemo(() => {
    const lastDay = startOfUtcDay(today);
    const daysSinceMonday = (new Date(lastDay).getUTCDay() + 6) % 7;
    const currentMonday = lastDay - daysSinceMonday * MS_PER_DAY;
    // Start on a Monday and emit exactly `resolvedWeeks` columns so the grid
    // always fits the measured card width.
    const firstMonday = currentMonday - (resolvedWeeks - 1) * 7 * MS_PER_DAY;

    const byDay = new Map<number, { added: number; completed: number }>();
    for (const item of items) {
      const day = toUtcDay(item.date);
      if (Number.isNaN(day)) continue;
      const current = byDay.get(day) ?? { added: 0, completed: 0 };
      byDay.set(day, {
        added: current.added + (item.added ?? 0),
        completed: current.completed + (item.completed ?? 0),
      });
    }

    const active: number[] = [];
    let added = 0;
    let completed = 0;

    for (let day = firstMonday; day <= lastDay; day += MS_PER_DAY) {
      const total = byDay.get(day);
      if (!total) continue;
      added += total.added;
      completed += total.completed;
      const value = total.added + total.completed;
      if (value > 0) active.push(value);
    }

    const top = ramp.length - 1;
    const levels = buildLevels(active, top);

    const columns: Cell[][] = [];
    for (let weekIndex = 0; weekIndex < resolvedWeeks; weekIndex += 1) {
      const week: Cell[] = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const day = firstMonday + (weekIndex * 7 + dayIndex) * MS_PER_DAY;
        if (day > lastDay) {
          week.push({ key: day, level: null });
          continue;
        }
        const total = byDay.get(day) ?? { added: 0, completed: 0 };
        const value = total.added + total.completed;
        week.push({ key: day, level: value === 0 ? 0 : (levels.get(value) ?? top) });
      }
      columns.push(week);
    }

    return { weeksData: columns, activeDays: active.length, addedTotal: added, completedTotal: completed };
  }, [items, ramp, resolvedWeeks, today]);

  return (
    <View
      onLayout={(event) => setMeasuredWidth(event.nativeEvent.layout.width)}
      accessibilityRole="image"
      accessibilityLabel={`${activeDays} active days in the last ${resolvedWeeks} weeks, ${addedTotal} added, ${completedTotal} completed`}
      style={styles.row}>
      {weeksData.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.column}>
          {week.map((cell) => (
            <View
              key={cell.key}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  borderRadius: Math.max(2, Math.round(cellSize / 4)),
                  backgroundColor: cell.level === null ? "transparent" : ramp[cell.level],
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    gap: GAP,
  },
  column: {
    gap: GAP,
  },
  cell: {
    backgroundColor: KueColors.surface3,
  },
});
