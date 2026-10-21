import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { API_HEALTH_URL } from '@/lib/api/config';
import { useAuth } from '@/lib/auth/auth-context';
import { useResponsive } from '@/lib/responsive';

async function checkApi(): Promise<string> {
  const response = await fetch(API_HEALTH_URL, {
    headers: { Accept: 'application/json' },
  }).catch(() => null);

  if (!response) throw new Error("Couldn't reach the API.");

  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) throw new Error(body?.message ?? `API returned ${response.status}.`);

  return body?.message ?? 'Connected';
}

function ApiStatus() {
  const query = useQuery({
    queryKey: ['api-health'],
    queryFn: checkApi,
    retry: 1,
  });

  const label = query.isPending
    ? 'Checking…'
    : query.isError
      ? 'Offline'
      : (query.data ?? 'Connected');

  const color = query.isError ? KueColors.danger : query.isPending ? KueColors.series : KueColors.game;

  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={styles.statusLabel}>RENDER API</Text>
      <Text style={styles.statusValue} numberOfLines={1}>
        {label}
      </Text>
      {query.isError ? (
        <Pressable onPress={() => query.refetch()} hitSlop={8}>
          <Text style={styles.retry}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { contentWidth, gutter, scale } = useResponsive();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.content, { width: contentWidth, paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>KUE</Text>
          <Text style={[styles.title, { fontSize: scale(28, 40), lineHeight: scale(32, 44) }]}>
            {user ? `Hey, ${user.username}` : 'Welcome to Kue'}
            <Text style={styles.accent}>.</Text>
          </Text>
          <Text style={styles.subtitle}>
            You&apos;re signed in. Library, Discover, Lists and Profile are the next screens to build.
          </Text>

          <ApiStatus />

          <View style={styles.card}>
            <Text style={styles.kicker}>ACCOUNT</Text>
            <Text style={styles.cardTitle}>{user?.username ?? 'Signed out'}</Text>
            <Text style={styles.cardBody}>{user?.email ?? '—'}</Text>
            {user?.kueId ? <Text style={styles.cardMeta}>KUE ID · {user.kueId}</Text> : null}
            {user?.roles?.length ? (
              <Text style={styles.cardMeta}>ROLES · {user.roles.join(', ')}</Text>
            ) : null}
          </View>

          <Pressable
            onPress={logout}
            disabled={busy}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            {busy ? (
              <ActivityIndicator color={KueColors.foreground} />
            ) : (
              <Text style={styles.secondaryButtonText}>Sign out</Text>
            )}
          </Pressable>

          <Text style={styles.footer}>KUE · ANDROID</Text>
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
    flexGrow: 1,
    paddingTop: KueSpacing.xxl,
    paddingBottom: KueSpacing.xxl,
    gap: KueSpacing.lg,
  },
  brand: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 12,
    letterSpacing: 4,
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
    fontSize: 14,
    lineHeight: 21,
    marginTop: -KueSpacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    borderRadius: 12,
    paddingHorizontal: KueSpacing.lg,
    paddingVertical: KueSpacing.md,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  statusValue: {
    color: KueColors.foreground,
    flex: 1,
    textAlign: 'right',
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  retry: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 11,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    borderRadius: 16,
    padding: KueSpacing.xl,
    gap: KueSpacing.md,
  },
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  cardTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 22,
  },
  cardBody: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  cardMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  secondaryButton: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    marginTop: KueSpacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 12,
    letterSpacing: 1.4,
  },
  footer: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textAlign: 'center',
    marginTop: KueSpacing.lg,
  },
});
