import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing, KueTextScale } from '@/constants/kue-theme';
import { useAuth } from '@/lib/auth/auth-context';
import { useResponsive } from '@/lib/responsive';

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

          <View style={styles.card}>
            <Text style={styles.kicker}>ACCOUNT</Text>
            <Text style={styles.cardTitle}>{user?.username ?? 'Signed out'}</Text>
            <Text style={styles.cardBody}>{user?.email ?? 'No email on file'}</Text>
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
              <Text maxFontSizeMultiplier={KueTextScale.control} style={styles.secondaryButtonText}>
                Sign out
              </Text>
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
