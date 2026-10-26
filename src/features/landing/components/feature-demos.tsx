import { Minus, Plus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { KueColors, KueTextScale } from "@/constants/kue-theme";
import { MediaAvatarCard } from "@/features/landing/components/media-avatar-card";
import {
  COVERS,
  GENRE_PULL,
  SYNC_SOURCES,
  TIME_SPENT,
  type MediaType,
} from "@/features/landing/data";
import { selectionHaptic } from "@/lib/haptics";

function DemoLabel({ children }: { children: string }) {
  return <Text style={styles.demoLabel}>{children}</Text>;
}

export function MiniListDemo() {
  const entries: { title: string; type: MediaType; image?: string; meta: string }[] = [
    {
      title: "Frieren",
      type: "anime",
      image: COVERS["Frieren: Beyond Journey's End"],
      meta: "Anime · 18/28 ep",
    },
    { title: "Elden Ring", type: "game", image: COVERS["Elden Ring"], meta: "Game · 84/150 h" },
    { title: "Parasite", type: "movie", image: COVERS.Parasite, meta: "Film · Watched" },
  ];

  return (
    <View>
      <DemoLabel>One list, mixed formats</DemoLabel>
      {entries.map((entry, index) => (
        <View key={entry.title} style={[styles.listRow, index > 0 && styles.divider]}>
          <MediaAvatarCard title={entry.title} type={entry.type} image={entry.image} size="sm" />
          <Text style={styles.listTitle} numberOfLines={1}>
            {entry.title}
          </Text>
          <Text style={styles.listMeta} numberOfLines={1}>
            {entry.meta}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function FriendDemo() {
  const events = [
    { initials: "M", name: "Mia", rest: "finished Breaking Bad · 9.6/10" },
    { initials: "R", name: "Ren", rest: "is playing Elden Ring · 56%" },
    { initials: "A", name: "Aki", rest: "shared Cozy fantasy · ranked" },
  ];

  return (
    <View>
      <DemoLabel>A friend&apos;s shelf</DemoLabel>
      {events.map((event, index) => (
        <View key={event.name} style={[styles.friendRow, index > 0 && styles.divider]}>
          <View style={styles.friendAvatar}>
            <Text maxFontSizeMultiplier={KueTextScale.compact} style={styles.friendInitials}>
              {event.initials}
            </Text>
          </View>
          <Text style={styles.friendText}>
            <Text style={styles.friendName}>{event.name}</Text> {event.rest}
          </Text>
        </View>
      ))}
    </View>
  );
}

function barColor(label: string) {
  if (label === "Anime") return KueColors.anime;
  if (label === "Series") return KueColors.series;
  return KueColors.movie;
}

export function HoursDemo() {
  return (
    <View>
      <DemoLabel>Time spent by medium</DemoLabel>
      {TIME_SPENT.map((entry) => (
        <View key={entry.label} style={styles.hoursRow}>
          <Text style={styles.hoursLabel}>{entry.label}</Text>
          <View style={styles.hoursTrack}>
            <View
              style={[
                styles.hoursFill,
                { width: `${entry.share}%`, backgroundColor: barColor(entry.label) },
              ]}
            />
          </View>
          <Text style={styles.hoursValue}>{entry.hours} h</Text>
        </View>
      ))}

      <View style={styles.chips}>
        {GENRE_PULL.map((genre) => (
          <View key={genre} style={styles.chip}>
            <Text style={styles.chipText}>{genre}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function SyncDemo() {
  return (
    <View>
      <DemoLabel>One search, three providers</DemoLabel>
      {SYNC_SOURCES.map((source, index) => (
        <View key={source.name} style={[styles.syncRow, index > 0 && styles.divider]}>
          <View style={styles.syncDot} />
          <Text style={styles.syncName}>{source.name}</Text>
          <Text style={styles.syncScope}>{source.scope}</Text>
          <Text style={styles.syncCount}>{source.count}</Text>
        </View>
      ))}
    </View>
  );
}

const TOTAL = 327;
const START = 140;

export function VagabondDemo() {
  const [current, setCurrent] = useState(START);
  const percent = Math.round((current / TOTAL) * 100);
  const finished = current >= TOTAL;

  const bump = (delta: number) => {
    selectionHaptic();
    setCurrent((value) => Math.max(0, Math.min(TOTAL, value + delta)));
  };

  return (
    <View>
      <DemoLabel>Vagabond · Takehiko Inoue</DemoLabel>

      <View style={styles.vagabondTrack}>
        <View
          style={[
            styles.vagabondFill,
            {
              width: `${percent}%`,
              backgroundColor: finished ? KueColors.game : KueColors.accent,
            },
          ]}
        />
      </View>

      <View style={styles.vagabondRow}>
        <Pressable
          onPress={() => bump(-1)}
          accessibilityLabel="Decrease chapters read"
          hitSlop={10}
          android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
          style={({ pressed }) => [styles.stepper, pressed && styles.stepperPressed]}>
          <Minus size={16} color={KueColors.ink2} strokeWidth={2.4} />
        </Pressable>

        <Text style={styles.vagabondCount}>
          <Text style={styles.strong}>{current}</Text> / {TOTAL} ch ·{" "}
          <Text style={styles.strong}>{percent}%</Text>
        </Text>

        <Pressable
          onPress={() => bump(1)}
          accessibilityLabel="Increase chapters read"
          hitSlop={10}
          android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
          style={({ pressed }) => [styles.stepper, pressed && styles.stepperPressed]}>
          <Plus size={16} color={KueColors.ink2} strokeWidth={2.4} />
        </Pressable>

        <View style={styles.vagabondStatus}>
          <View
            style={[
              styles.vagabondDot,
              { backgroundColor: finished ? KueColors.game : KueColors.series },
            ]}
          />
          <Text style={styles.vagabondStatusText}>{finished ? "Done" : "On hold"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  demoLabel: {
    color: KueColors.ink3,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  listTitle: {
    flex: 1,
    color: KueColors.foreground,
    fontSize: 13.5,
    fontWeight: "600",
  },
  listMeta: {
    color: KueColors.ink3,
    fontSize: 11.5,
    fontWeight: "500",
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 9,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  friendInitials: {
    color: KueColors.foreground,
    fontSize: 13,
    fontWeight: "700",
  },
  friendText: {
    flex: 1,
    color: KueColors.ink2,
    fontSize: 13,
    lineHeight: 19,
  },
  friendName: {
    color: KueColors.foreground,
    fontWeight: "700",
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  hoursLabel: {
    width: 52,
    color: KueColors.ink2,
    fontSize: 12,
    fontWeight: "600",
  },
  hoursTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: KueColors.line,
    overflow: "hidden",
  },
  hoursFill: {
    height: "100%",
    borderRadius: 3,
  },
  hoursValue: {
    width: 48,
    textAlign: "right",
    color: KueColors.ink2,
    fontSize: 12,
    fontWeight: "500",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: KueColors.surface3,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: KueColors.ink2,
    fontSize: 11.5,
    fontWeight: "500",
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KueColors.game,
  },
  syncName: {
    color: KueColors.foreground,
    fontSize: 13.5,
    fontWeight: "600",
  },
  syncScope: {
    flex: 1,
    color: KueColors.ink3,
    fontSize: 12,
  },
  syncCount: {
    color: KueColors.ink3,
    fontSize: 11.5,
  },
  vagabondTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: KueColors.line,
    overflow: "hidden",
  },
  vagabondFill: {
    height: "100%",
    borderRadius: 3,
  },
  vagabondRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  vagabondCount: {
    color: KueColors.ink2,
    fontSize: 12.5,
    fontWeight: "500",
  },
  strong: {
    color: KueColors.foreground,
    fontWeight: "700",
  },
  stepper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stepperPressed: {
    opacity: 0.65,
  },
  vagabondStatus: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vagabondDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vagabondStatusText: {
    color: KueColors.ink2,
    fontSize: 12,
    fontWeight: "500",
  },
});
