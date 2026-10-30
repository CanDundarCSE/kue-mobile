import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { LogoMark } from '@/features/landing/components/logo-mark';
import { ContinueCard } from '@/features/home/continue-card';
import { FriendsCard } from '@/features/home/friends-card';
import { SpotlightCard } from '@/features/home/spotlight-card';
import { useAuth } from '@/lib/auth/auth-context';
import { useResponsive } from '@/lib/responsive';

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { contentWidth, gutter, scale } = useResponsive();

  const now = new Date();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <LogoMark size={10} />
              <Text style={styles.brandText}>KUE</Text>
            </View>
          </View>

          <View style={styles.greeting}>
            <Text style={styles.date}>{dateLabel(now).toUpperCase()}</Text>
            <Text style={[styles.title, { fontSize: scale(30, 40), lineHeight: scale(34, 44) }]}>
              {greeting(now.getHours())}, {user?.username ?? 'there'}
              <Text style={styles.accent}>.</Text>
            </Text>
            <Text style={styles.subtitle}>Pick up where you left off.</Text>
          </View>

          <View style={styles.sections}>
            <ContinueCard gutter={gutter} />
            <SpotlightCard />
            <FriendsCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KueColors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    paddingTop: KueSpacing.lg,
    paddingBottom: KueSpacing.xxl,
    gap: KueSpacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandText: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 12,
    letterSpacing: 4,
  },
  greeting: {
    gap: KueSpacing.sm,
  },
  date: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
  },
  accent: {
    color: KueColors.accent,
  },
  subtitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
  },
  sections: {
    gap: KueSpacing.xxl,
  },
});
