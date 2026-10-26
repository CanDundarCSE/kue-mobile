import * as WebBrowser from "expo-web-browser";
import {
  BarChart3,
  BookOpen,
  Clapperboard,
  Gamepad2,
  Layers,
  Lock,
  Sparkles,
  TrendingUp,
  Tv,
  Users,
} from "lucide-react-native";
import type { ComponentType, ReactNode } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { KueColors, KueFonts } from "@/constants/kue-theme";
import { ActivityHeatmap } from "@/features/landing/components/activity-heatmap";
import { FriendDemo, VagabondDemo } from "@/features/landing/components/feature-demos";
import { LandingButton } from "@/features/landing/components/landing-button";
import { LibraryPreview } from "@/features/landing/components/library-preview";
import {
  ACTIVITY,
  ACTIVITY_SUMMARY,
  LIBRARY_SUMMARY,
  MEDIA_FORMATS,
  MEDIA_TYPE_META,
  type MediaType,
} from "@/features/landing/data";
import { WEB_BASE_URL } from "@/lib/api/config";

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const FORMAT_ICONS: Record<MediaType, IconComponent> = {
  movie: Clapperboard,
  series: Tv,
  game: Gamepad2,
  anime: Sparkles,
  manga: BookOpen,
};

const RECAP: { label: string; value: string }[] = [
  { label: "Episodes", value: String(LIBRARY_SUMMARY.episodes) },
  { label: "Chapters", value: String(LIBRARY_SUMMARY.chapters) },
  { label: "Mean score", value: LIBRARY_SUMMARY.meanScore.toFixed(1) },
];

const PROMISES = [
  { icon: Layers, text: "Five formats on one shelf" },
  { icon: TrendingUp, text: "Progress that follows each format" },
  { icon: Users, text: "Friends, lists and one rating scale" },
  { icon: BarChart3, text: "Streaks, time and honest totals" },
];

const RECENT = [
  { title: "Frieren", detail: "Episode 19", when: "Today" },
  { title: "Vagabond", detail: "Chapter 141", when: "Yesterday" },
];

const LEGAL_LINKS = [
  { label: "Privacy", path: "/privacy-policy" },
  { label: "Cookies", path: "/cookies" },
  { label: "Terms", path: "/terms-of-service" },
];

export const TOUR_SLIDE_KEYS = [
  "welcome",
  "formats",
  "progress",
  "friends",
  "numbers",
  "ready",
] as const;

export const TOUR_SLIDE_COUNT = TOUR_SLIDE_KEYS.length;

function SlideFrame({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.frame}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>
          {title}
          <Text style={styles.accent}>.</Text>
        </Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

function WelcomeSlide({ onStartTour }: { onStartTour: () => void }) {
  return (
    <SlideFrame
      title="One shelf for your whole media life"
      body="Films, series, games, anime and manga tracked in one place. One scale, one set of numbers. Start the short tour, or skip straight to sign in.">
      <LibraryPreview />
      <LandingButton label="Start the tour" onPress={onStartTour} size="lg" fullWidth />
    </SlideFrame>
  );
}

function FormatsSlide() {
  return (
    <SlideFrame
      eyebrow="01 · ONE LIBRARY"
      title="Five formats, one shelf"
      body="Your film diary, series queue, game backlog, anime list and manga stack finally live together. Search once, add anywhere.">
      <View style={styles.formatGrid}>
        {MEDIA_FORMATS.map((format) => {
          const meta = MEDIA_TYPE_META[format.type];
          const Icon = FORMAT_ICONS[format.type];
          const wide = format.type === "manga";

          return (
            <View
              key={format.type}
              style={[
                styles.formatTile,
                wide && styles.formatTileWide,
                { borderColor: `${meta.color}30`, backgroundColor: `${meta.color}10` },
              ]}>
              <View
                style={[
                  styles.formatTop,
                  wide && styles.formatTopWide,
                ]}>
                <View style={[styles.formatIcon, { backgroundColor: `${meta.color}22` }]}>
                  <Icon size={16} color={meta.color} strokeWidth={2.2} />
                </View>
                <View style={styles.formatText}>
                  <Text style={styles.formatLabel}>{format.label}</Text>
                  <Text style={styles.formatSource}>{format.source}</Text>
                </View>
                <Text style={[styles.formatValue, wide && styles.formatValueWide]}>
                  {format.value}
                  {format.suffix}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.caption}>1.9M titles from TMDB, AniList and IGDB.</Text>
    </SlideFrame>
  );
}

function ProgressSlide() {
  return (
    <SlideFrame
      eyebrow="02 · PROGRESS"
      title="Progress that adds up"
      body="Update episodes, chapters, hours or films. The status follows the format, and every number feeds the same totals.">
      <View style={styles.demoCard}>
        <VagabondDemo />
      </View>
      <Text style={styles.hint}>The − and + are live. Try it.</Text>

      <View style={styles.demoCard}>
        <Text style={styles.demoLabel}>Recent activity</Text>
        {RECENT.map((entry, index) => (
          <View key={entry.title} style={[styles.recentRow, index > 0 && styles.recentDivider]}>
            <View style={styles.recentDot} />
            <Text style={styles.recentText} numberOfLines={1}>
              <Text style={styles.recentTitle}>{entry.title}</Text> · {entry.detail}
            </Text>
            <Text style={styles.recentWhen}>{entry.when}</Text>
          </View>
        ))}
      </View>
    </SlideFrame>
  );
}

function FriendsSlide() {
  return (
    <SlideFrame
      eyebrow="03 · FRIENDS"
      title="Your people, your taste"
      body="Follow friends, share lists and see what they are into. No comment sections, no hot takes. Just shelves you can trust.">
      <View style={styles.demoCard}>
        <FriendDemo />
      </View>

      <View style={styles.privacyCard}>
        <View style={styles.privacyIcon}>
          <Lock size={14} color={KueColors.accent} strokeWidth={2.2} />
        </View>
        <View style={styles.privacyCopy}>
          <Text style={styles.privacyTitle}>Your shelf, your rules</Text>
          <Text style={styles.privacyBody}>
            Mutual follows only. Hide a title, or keep your whole profile private.
          </Text>
        </View>
      </View>
    </SlideFrame>
  );
}

function NumbersSlide() {
  return (
    <SlideFrame
      eyebrow="04 · NUMBERS"
      title="The honest numbers"
      body="Time, genres, streaks and a live activity heatmap. Every format counted in the same honest totals, never split across apps.">
      <View style={styles.demoCard}>
        <View style={styles.heatHeader}>
          <Text style={styles.demoLabel}>Last 18 weeks</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{ACTIVITY_SUMMARY.activeDays} active days</Text>
          </View>
        </View>

        <ActivityHeatmap items={ACTIVITY} weeks={18} />

        <View style={styles.recapRow}>
          {RECAP.map((entry) => (
            <View key={entry.label} style={styles.recapItem}>
              <Text style={styles.recapValue}>{entry.value}</Text>
              <Text style={styles.recapLabel}>{entry.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </SlideFrame>
  );
}

function openWebPath(path: string) {
  if (!WEB_BASE_URL) {
    Alert.alert(
      "Open on the web",
      "This page lives on the Kue web app. Set EXPO_PUBLIC_KUE_WEB_URL to open it from here.",
    );
    return;
  }

  void WebBrowser.openBrowserAsync(`${WEB_BASE_URL}${path}`);
}

function ReadySlide({ onSignIn, onRegister }: { onSignIn: () => void; onRegister: () => void }) {
  return (
    <SlideFrame
      eyebrow="READY WHEN YOU ARE"
      title="Bring it all together"
      body="Free, no ads and no subscriptions. Sign in with the same account as the web app, or create one in a minute.">
      <View style={styles.readyCard}>
        {PROMISES.map((promise) => {
          const Icon = promise.icon;

          return (
            <View key={promise.text} style={styles.promiseRow}>
              <View style={styles.promiseIcon}>
                <Icon size={14} color={KueColors.accent} strokeWidth={2.2} />
              </View>
              <Text style={styles.promiseText}>{promise.text}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.readyActions}>
        <LandingButton label="Sign in" onPress={onSignIn} size="lg" fullWidth />
        <LandingButton
          label="Create an account"
          onPress={onRegister}
          variant="secondary"
          size="md"
          fullWidth
        />
      </View>

      <View style={styles.readyFooter}>
        <View style={styles.legalRow}>
          {LEGAL_LINKS.map((link) => (
            <Pressable
              key={link.label}
              onPress={() => openWebPath(link.path)}
              hitSlop={8}
              accessibilityRole="link">
              <Text style={styles.legalLink}>{link.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.copyright}>© 2026 Kue · Metadata by TMDB, AniList &amp; IGDB</Text>
      </View>
    </SlideFrame>
  );
}

export function TourSlide({
  index,
  onStartTour,
  onSignIn,
  onRegister,
}: {
  index: number;
  onStartTour: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}) {
  const key = TOUR_SLIDE_KEYS[index] ?? TOUR_SLIDE_KEYS[0];

  switch (key) {
    case "welcome":
      return <WelcomeSlide onStartTour={onStartTour} />;
    case "formats":
      return <FormatsSlide />;
    case "progress":
      return <ProgressSlide />;
    case "friends":
      return <FriendsSlide />;
    case "numbers":
      return <NumbersSlide />;
    case "ready":
      return <ReadySlide onSignIn={onSignIn} onRegister={onRegister} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 18,
  },
  copy: {
    gap: 10,
  },
  content: {
    gap: 12,
  },
  eyebrow: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1.9,
    textTransform: "uppercase",
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansBold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
  },
  accent: {
    color: KueColors.accent,
  },
  body: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 14.5,
    lineHeight: 22,
  },
  caption: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  hint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    textAlign: "center",
  },
  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  formatTile: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  formatTileWide: {
    flexBasis: "100%",
    flexGrow: 0,
  },
  formatTop: {
    gap: 8,
  },
  formatTopWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  formatIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  formatText: {
    flex: 1,
    minWidth: 0,
  },
  formatLabel: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
  formatSource: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  formatValue: {
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 12,
    opacity: 0.7,
  },
  formatValueWide: {
    fontSize: 13,
    opacity: 0.85,
  },
  demoCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    borderRadius: 22,
    backgroundColor: KueColors.surface2,
    padding: 16,
  },
  demoLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingTop: 10,
    paddingBottom: 4,
  },
  recentDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
    marginTop: 8,
  },
  recentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: KueColors.accent,
  },
  recentText: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12.5,
  },
  recentTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
  },
  recentWhen: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9.5,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    borderRadius: 18,
    backgroundColor: KueColors.surface2,
    padding: 14,
  },
  privacyIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KueColors.accentSoft,
  },
  privacyCopy: {
    flex: 1,
    gap: 3,
  },
  privacyTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  privacyBody: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  heatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: KueColors.surface3,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9.5,
  },
  recapRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
    marginTop: 16,
    paddingTop: 14,
  },
  recapItem: {
    flex: 1,
    gap: 2,
  },
  recapValue: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 19,
    letterSpacing: -0.5,
  },
  recapLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  readyCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    borderRadius: 22,
    backgroundColor: KueColors.surface2,
    padding: 18,
    gap: 14,
  },
  promiseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  promiseIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KueColors.accentSoft,
  },
  promiseText: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13.5,
  },
  readyActions: {
    gap: 10,
  },
  readyFooter: {
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },
  legalLink: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  copyright: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    textAlign: "center",
  },
});
