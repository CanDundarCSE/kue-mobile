import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  checkForUpdate,
  currentVersionCode,
  currentVersionName,
  downloadAndInstall,
  openInstallPermissionSettings,
} from '@/lib/updates/updater';
import { type UpdateManifest } from '@/lib/updates/manifest';

type Result =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'current' }
  | { kind: 'unavailable' }
  | { kind: 'available'; manifest: UpdateManifest }
  | { kind: 'downloading'; manifest: UpdateManifest; progress: number }
  | { kind: 'blocked'; manifest: UpdateManifest }
  | { kind: 'error'; message: string };

export function AppUpdateSection() {
  const [result, setResult] = useState<Result>({ kind: 'idle' });

  const check = async () => {
    setResult({ kind: 'checking' });
    try {
      const update = await checkForUpdate();
      if (update.status === 'available') {
        setResult({ kind: 'available', manifest: update.manifest });
      } else {
        setResult({ kind: update.status === 'current' ? 'current' : 'unavailable' });
      }
    } catch (cause) {
      setResult({
        kind: 'error',
        message: cause instanceof Error ? cause.message : 'Could not check for updates.',
      });
    }
  };

  const install = async (manifest: UpdateManifest) => {
    setResult({ kind: 'downloading', manifest, progress: 0 });
    try {
      const outcome = await downloadAndInstall(manifest, (fraction) =>
        setResult({ kind: 'downloading', manifest, progress: fraction }),
      );
      setResult(
        outcome === 'installer-opened'
          ? { kind: 'idle' }
          : { kind: 'blocked', manifest },
      );
    } catch (cause) {
      setResult({
        kind: 'error',
        message: cause instanceof Error ? cause.message : 'Could not download the update.',
      });
    }
  };

  const busy = result.kind === 'checking' || result.kind === 'downloading';

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>App updates</Text>
      <Text style={styles.body}>
        Version {currentVersionName} · build {currentVersionCode}
      </Text>

      {result.kind === 'available' ? (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Kue {result.manifest.version} is available</Text>
          {result.manifest.notes ? (
            <Text style={styles.body}>{result.manifest.notes}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download and install update"
            onPress={() => void install(result.manifest)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>Download and install</Text>
          </Pressable>
        </View>
      ) : null}

      {result.kind === 'downloading' ? (
        <View style={styles.box}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${Math.round(result.progress * 100)}%` }]}
            />
          </View>
          <Text style={styles.meta}>Downloading {Math.round(result.progress * 100)}%</Text>
        </View>
      ) : null}

      {result.kind === 'blocked' ? (
        <View style={styles.box}>
          <Text style={styles.body}>
            Allow “Install unknown apps” for Kue, then install the downloaded update.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open install permission settings"
            onPress={() => void openInstallPermissionSettings()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryLabel}>Open settings</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Install downloaded update"
            onPress={() => void install(result.manifest)}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryLabel}>Try install again</Text>
          </Pressable>
        </View>
      ) : null}

      {result.kind === 'current' ? <Text style={styles.meta}>You are up to date.</Text> : null}
      {result.kind === 'unavailable' ? (
        <Text style={styles.meta}>Could not reach the update server.</Text>
      ) : null}
      {result.kind === 'error' ? <Text style={styles.error}>{result.message}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Check for updates"
        disabled={busy}
        onPress={() => void check()}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
          busy && styles.disabled,
        ]}>
        {result.kind === 'checking' ? (
          <ActivityIndicator color={KueColors.ink2} size="small" />
        ) : (
          <Text style={styles.secondaryLabel}>Check for updates</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>
        Updates download as an APK and install over this app. Android asks once for permission.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.lg,
    gap: KueSpacing.sm,
  },
  cardTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  body: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  meta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  hint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  box: {
    gap: KueSpacing.sm,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.background,
    padding: KueSpacing.md,
  },
  boxTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: KueColors.line2,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: KueColors.accent },
  primaryButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: KueColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: KueSpacing.lg,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  error: { color: KueColors.danger, fontFamily: KueFonts.sans, fontSize: 12 },
});
