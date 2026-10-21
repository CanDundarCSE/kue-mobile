import * as WebBrowser from "expo-web-browser";
import {
  ArrowDown,
  BarChart3,
  BookOpen,
  Clapperboard,
  Gamepad2,
  Layers,
  Sparkles,
  TrendingUp,
  Tv,
  Users,
} from "lucide-react-native";
import { useState, type ComponentType, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { KueColors } from "@/constants/kue-theme";
import { ActivityHeatmap } from "@/features/landing/components/activity-heatmap";
import { FaqList, type FaqItem } from "@/features/landing/components/accordion";
import { CountUp } from "@/features/landing/components/count-up";
import {
  FriendDemo,
  HoursDemo,
  MiniListDemo,
  VagabondDemo,
} from "@/features/landing/components/feature-demos";
import { LandingButton } from "@/features/landing/components/landing-button";
import { LibraryMock } from "@/features/landing/components/library-mock";
import { LogoMark } from "@/features/landing/components/logo-mark";
import { Reveal } from "@/features/landing/components/reveal";
import {
  ACTIVITY,
  ACTIVITY_SUMMARY,
  LIBRARY_SUMMARY,
  MEDIA_FORMATS,
  MEDIA_TYPE_META,
  type MediaType,
} from "@/features/landing/data";
import { WEB_BASE_URL } from "@/lib/api/config";
import { useResponsive } from "@/lib/responsive";

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const FORMAT_ICONS: Record<MediaType, IconComponent> = {
  movie: Clapperboard,
  series: Tv,
  game: Gamepad2,
  anime: Sparkles,
  manga: BookOpen,
};

const FEATURES: {
  icon: IconComponent;
  tint: string;
  title: string;
  body: string;
  demo: ReactNode;
}[] = [
  {
    icon: Layers,
    tint: KueColors.accent,
    title: "One library",
    body: "Films, series, games, anime and manga live on the same shelf, with one search and one rating scale.",
    demo: <MiniListDemo />,
  },
  {
    icon: TrendingUp,
    tint: KueColors.game,
    title: "Progress that adds up",
    body: "Update episodes, chapters, hours or films. Statuses follow the format and every number counts.",
    demo: <VagabondDemo />,
  },
  {
    icon: Users,
    tint: KueColors.anime,
    title: "Your people, your taste",
    body: "Follow friends, share lists and see what they are into. No comment sections, no hot takes.",
    demo: <FriendDemo />,
  },
  {
    icon: BarChart3,
    tint: KueColors.series,
    title: "The honest numbers",
    body: "Your time, genres, streak and a six-month heatmap — every format in the same honest totals.",
    demo: <HoursDemo />,
  },
];

const RECAP = [
  { tag: "Episodes", value: String(LIBRARY_SUMMARY.episodes), detail: "anime + series" },
  { tag: "Chapters", value: String(LIBRARY_SUMMARY.chapters), detail: "manga" },
  {
    tag: "Longest streak",
    value: `${ACTIVITY_SUMMARY.longestStreak} days`,
    detail: "consecutive days",
  },
  {
    tag: "Mean score",
    value: LIBRARY_SUMMARY.meanScore.toFixed(1),
    detail: "across the library",
  },
];

const FAQ: FaqItem[] = [
  {
    question: "Are all five formats really in one place?",
    answer:
      "Yes. One library, one search and one rating scale for all five formats. Nothing lives in a separate app, and your totals add up no matter what you are into.",
  },
  {
    question: "Where does the catalog data come from?",
    answer:
      "Films and series come from TMDB, anime and manga from AniList, and games from IGDB. Search a title and Kue fills in the cover, runtime and episode count. Your own progress is never touched.",
  },
  {
    question: "Can I import my existing lists?",
    answer:
      "Bring your library over from MyAnimeList, AniList or Trakt exports, or a CSV. Kue matches every entry against the catalog, so you are not retyping anything.",
  },
  {
    question: "What does it cost?",
    answer:
      "Nothing. Kue is free, there are no ads, and your library is not the product. There is nothing to upgrade to.",
  },
];

const LEGAL_LINKS = [
  { label: "Privacy", path: "/privacy-policy" },
  { label: "Cookies", path: "/cookies" },
  { label: "Terms", path: "/terms-of-service" },
];

function SectionHeader({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
    </View>
  );
}

export function HeroSection({
  onSignIn,
  onExplore,
}: {
  onSignIn: () => void;
  onExplore: () => void;
}) {
  const { scale } = useResponsive();

  return (
    <Reveal style={styles.hero}>
      <View style={styles.heroBadge}>
        <Sparkles size={14} color={KueColors.accent} strokeWidth={2.2} />
        <Text style={styles.heroBadgeText}>Free. No ads. No subscriptions.</Text>
      </View>

      <Text style={[styles.heroTitle, { fontSize: scale(33, 40), lineHeight: scale(37, 44) }]}>
        Your whole media life, in one library<Text style={styles.accent}>.</Text>
      </Text>

      <Text style={styles.heroBody}>
        Films, series, games, anime and manga — tracked together, rated on one scale and counted
        in one place.
      </Text>

      <View style={styles.heroActions}>
        <LandingButton label="Sign in" onPress={onSignIn} size="lg" fullWidth />
        <Pressable
          onPress={onExplore}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => [styles.explore, pressed && styles.pressed]}>
          <Text style={styles.exploreText}>Explore the app</Text>
          <ArrowDown size={16} color={KueColors.accent} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.formatPills}>
        {MEDIA_FORMATS.map((format) => (
          <View key={format.type} style={styles.formatPill}>
            <View
              style={[
                styles.formatPillDot,
                { backgroundColor: MEDIA_TYPE_META[format.type].color },
              ]}
            />
            <Text style={styles.formatPillText}>{format.label}</Text>
          </View>
        ))}
      </View>
    </Reveal>
  );
}

export function LibrarySection() {
  return (
    <View style={styles.section}>
      <Reveal>
        <SectionHeader
          title="Your library, live"
          body="Filter by format and update progress. This is the same interaction you get after signing in."
        />
      </Reveal>
      <Reveal delay={80}>
        <LibraryMock />
      </Reveal>
    </View>
  );
}

export function FormatsSection({ pageGutter }: { pageGutter: number }) {
  const { width } = useResponsive();
  const cardWidth = Math.min(320, Math.max(232, (width - pageGutter * 2) * 0.84));
  const gap = 12;
  const [active, setActive] = useState(0);

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + gap));
    setActive(Math.max(0, Math.min(MEDIA_FORMATS.length - 1, next)));
  };

  return (
    <View style={styles.section}>
      <Reveal>
        <SectionHeader
          title="Five formats, one shelf"
          body="Your anime list, film diary, game backlog and manga queue finally live together."
        />
      </Reveal>

      <Reveal delay={80}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + gap}
          snapToAlignment="start"
          onMomentumScrollEnd={onMomentumEnd}
          style={{ marginHorizontal: -pageGutter }}
          contentContainerStyle={{
            paddingHorizontal: pageGutter,
            gap,
            alignItems: "stretch",
          }}>
          {MEDIA_FORMATS.map((format) => {
            const meta = MEDIA_TYPE_META[format.type];
            const Icon = FORMAT_ICONS[format.type];

            return (
              <View key={format.type} style={[styles.formatCard, { width: cardWidth }]}>
                <View style={styles.formatCardTop}>
                  <View style={[styles.formatIcon, { backgroundColor: `${meta.color}22` }]}>
                    <Icon size={22} color={meta.color} strokeWidth={2} />
                  </View>
                  <View style={styles.sourcePill}>
                    <Text style={styles.sourceText}>{format.source}</Text>
                  </View>
                </View>

                <Text style={styles.formatCount}>
                  <CountUp value={format.value} decimals={format.decimals} suffix={format.suffix} />
                </Text>
                <Text style={styles.formatName}>{format.name}</Text>
                <Text style={styles.formatCopy}>{format.copy}</Text>
              </View>
            );
          })}
        </ScrollView>
      </Reveal>

      <View style={styles.dots}>
        {MEDIA_FORMATS.map((format, index) => (
          <View key={format.type} style={[styles.dot, index === active && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.catalogNote}>1.9M titles from TMDB, AniList and IGDB.</Text>
    </View>
  );
}

export function FeaturesSection() {
  return (
    <View style={styles.section}>
      <Reveal>
        <SectionHeader
          title="Built for the way you consume"
          body="Tracking should take seconds, not a spreadsheet."
        />
      </Reveal>

      <View style={styles.featureList}>
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Reveal key={feature.title} delay={index * 50}>
              <View style={styles.featureCard}>
                <View style={styles.featureHeader}>
                  <View style={[styles.featureIcon, { backgroundColor: `${feature.tint}20` }]}>
                    <Icon size={22} color={feature.tint} strokeWidth={2} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                </View>

                <Text style={styles.featureBody}>{feature.body}</Text>
                <View style={styles.featureDemo}>{feature.demo}</View>
              </View>
            </Reveal>
          );
        })}
      </View>
    </View>
  );
}

export function YearSection() {
  return (
    <View style={styles.section}>
      <Reveal>
        <SectionHeader
          title="Your year in media"
          body="One activity feed across all five formats. Every square is a day."
        />
      </Reveal>

      <Reveal delay={80}>
        <View style={styles.yearCard}>
          <View style={styles.yearHeader}>
            <Text style={styles.yearLabel}>Last 26 weeks</Text>
            <View style={styles.yearPill}>
              <View style={styles.yearPillDot} />
              <Text style={styles.yearPillText}>
                {ACTIVITY_SUMMARY.activeDays} active days
              </Text>
            </View>
          </View>

          <ActivityHeatmap items={ACTIVITY} />

          <Text style={styles.heatmapCaption}>Busiest {ACTIVITY_SUMMARY.busiestMonth}</Text>

          <View style={styles.yearDivider} />

          <View style={styles.recapGrid}>
            {RECAP.map((entry) => (
              <View key={entry.tag} style={styles.recapItem}>
                <Text style={styles.recapTag}>{entry.tag}</Text>
                <Text style={styles.recapValue}>{entry.value}</Text>
                <Text style={styles.recapDetail}>{entry.detail}</Text>
              </View>
            ))}
          </View>
        </View>
      </Reveal>
    </View>
  );
}

export function FaqSection() {
  return (
    <View style={styles.section}>
      <Reveal>
        <SectionHeader title="Good to know" body="A few things people ask before signing in." />
      </Reveal>
      <Reveal delay={80}>
        <FaqList items={FAQ} />
      </Reveal>
    </View>
  );
}

export function EndSection({ onSignIn }: { onSignIn: () => void }) {
  const openLegal = (path: string) => {
    if (!WEB_BASE_URL) {
      Alert.alert(
        "Open on the web",
        "The legal pages live on the Kue web app. Set EXPO_PUBLIC_KUE_WEB_URL to open them from here.",
      );
      return;
    }

    void WebBrowser.openBrowserAsync(`${WEB_BASE_URL}${path}`);
  };

  return (
    <View style={styles.end}>
      <Reveal>
        <View style={styles.endCard}>
          <LogoMark size={12} />
          <Text style={styles.endTitle}>Ready to bring it all together?</Text>
          <Text style={styles.endBody}>
            Your library, progress and ratings in one place. Free, with no ads.
          </Text>
          <LandingButton label="Sign in" onPress={onSignIn} size="lg" fullWidth />
        </View>
      </Reveal>

      <View style={styles.legalRow}>
        {LEGAL_LINKS.map((link) => (
          <Pressable
            key={link.label}
            onPress={() => openLegal(link.path)}
            hitSlop={8}
            accessibilityRole="link">
            <Text style={styles.legalLink}>{link.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.notes}>© 2026 Kue · Metadata by TMDB, AniList &amp; IGDB</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 44,
  },
  sectionHeader: {
    gap: 6,
    marginBottom: 18,
  },
  sectionTitle: {
    color: KueColors.foreground,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  sectionBody: {
    color: KueColors.ink2,
    fontSize: 14.5,
    lineHeight: 21,
  },
  accent: {
    color: KueColors.accent,
  },
  hero: {
    paddingTop: 20,
    gap: 14,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    backgroundColor: KueColors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(126,143,255,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: KueColors.accent,
    fontSize: 12.5,
    fontWeight: "600",
  },
  heroTitle: {
    color: KueColors.foreground,
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  heroBody: {
    color: KueColors.ink2,
    fontSize: 15.5,
    lineHeight: 23,
  },
  heroActions: {
    gap: 8,
    marginTop: 2,
  },
  explore: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exploreText: {
    color: KueColors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
  formatPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  formatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    backgroundColor: KueColors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  formatPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  formatPillText: {
    color: KueColors.ink2,
    fontSize: 12.5,
    fontWeight: "500",
  },
  formatCard: {
    minHeight: 190,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: 18,
    gap: 2,
  },
  formatCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  formatIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sourcePill: {
    borderRadius: 999,
    backgroundColor: KueColors.surface3,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  sourceText: {
    color: KueColors.ink3,
    fontSize: 10.5,
    fontWeight: "600",
  },
  formatCount: {
    color: KueColors.foreground,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 16,
  },
  formatName: {
    color: KueColors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  formatCopy: {
    color: KueColors.ink2,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
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
  catalogNote: {
    color: KueColors.ink3,
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  featureList: {
    gap: 12,
  },
  featureCard: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: 18,
    gap: 10,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    flex: 1,
    color: KueColors.foreground,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  featureBody: {
    color: KueColors.ink2,
    fontSize: 14,
    lineHeight: 21,
  },
  featureDemo: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.background,
    padding: 14,
    marginTop: 4,
  },
  yearCard: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: 18,
    gap: 14,
  },
  yearHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  yearLabel: {
    color: KueColors.ink2,
    fontSize: 13,
    fontWeight: "600",
  },
  yearPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: KueColors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  yearPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KueColors.accent,
  },
  yearPillText: {
    color: KueColors.accent,
    fontSize: 11.5,
    fontWeight: "600",
  },
  heatmapCaption: {
    color: KueColors.ink3,
    fontSize: 12,
    lineHeight: 17,
  },
  yearDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: KueColors.line,
    marginVertical: 2,
  },
  recapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 16,
  },
  recapItem: {
    width: "47%",
    gap: 2,
  },
  recapTag: {
    color: KueColors.ink3,
    fontSize: 12.5,
    fontWeight: "500",
  },
  recapValue: {
    color: KueColors.foreground,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  recapDetail: {
    color: KueColors.ink3,
    fontSize: 11.5,
  },
  end: {
    paddingTop: 48,
    paddingBottom: 8,
  },
  endCard: {
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(126,143,255,0.28)",
    backgroundColor: KueColors.accentSoft,
    padding: 24,
    gap: 12,
  },
  endTitle: {
    color: KueColors.foreground,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 4,
  },
  endBody: {
    color: KueColors.ink2,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
  },
  legalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 18,
    marginTop: 24,
  },
  legalLink: {
    color: KueColors.ink3,
    fontSize: 12.5,
    fontWeight: "500",
  },
  notes: {
    color: KueColors.ink3,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 8,
  },
});
