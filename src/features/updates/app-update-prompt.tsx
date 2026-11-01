import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  checkForUpdate,
  cleanupOldApks,
  currentVersionCode,
  currentVersionName,
  downloadAndInstall,
  openInstallPermissionSettings,
  type UpdateCheck,
} from '@/lib/updates/updater';

/**
 * Sideloaded builds cannot use store updates: check the published manifest on
 * launch and hand the new APK to the system installer.
 */
export function AppUpdatePrompt() {
  const [update, setUpdate] = useState<Extract<UpdateCheck, { status: 'available' }> | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  useEffect(() => {
    void cleanupOldApks();
    const timer = setTimeout(() => {
      void checkForUpdate()
        .then((result) => {
          if (result.status === 'available') setUpdate(result);
        })
        .catch(() => undefined);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!update) return null;

  const { manifest, mandatory } = update;

  const install = async () => {
    setDownloading(true);
    setError(null);
    setNeedsPermission(false);
    setProgress(0);
    try {
      const outcome = await downloadAndInstall(manifest, setProgress);
      if (outcome === 'unchanged') setNeedsPermission(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not download the update.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <BottomSheet
      visible
      onClose={() => {
        if (mandatory || downloading) return;
        setUpdate(null);
      }}>
      <Text style={styles.kicker}>Update available</Text>
      <Text style={styles.title}>
        Kue {manifest.version}
        <Text style={styles.accent}>.</Text>
      </Text>
      <Text style={styles.body}>
        You are on {currentVersionName} (build {currentVersionCode}). Android installs this
        update over the app; your library and session stay.
      </Text>

      {manifest.notes ? <Text style={styles.notes}>{manifest.notes}</Text> : null}

      {downloading ? (
        <View style={styles.progressBox}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            Downloading {Math.round(progress * 100)}%
          </Text>
        </View>
      ) : null}

      {needsPermission ? (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            Kue needs permission to install the update. Allow “Install unknown apps” for Kue, then
            tap Update again.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open install permission settings"
            onPress={() => void openInstallPermissionSettings()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryLabel}>Open settings</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {!mandatory ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Update later"
            disabled={downloading}
            onPress={() => setUpdate(null)}
            style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}>
            <Text style={styles.keepLabel}>Later</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Download and install update"
          disabled={downloading}
          onPress={() => void install()}
          style={({ pressed }) => [
            styles.primaryButton,
            mandatory && styles.primaryButtonFull,
            pressed && styles.pressed,
          ]}>
          {downloading ? (
            <ActivityIndicator color={KueColors.background} size="small" />
          ) : (
            <Text style={styles.primaryLabel}>
              {needsPermission ? 'Try again' : 'Update now'}
            </Text>
          )}
        </Pressable>
      </View>

      {mandatory ? (
        <Text style={styles.mandatory}>This version is required to keep using Kue.</Text>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 26,
    lineHeight: 30,
  },
  accent: { color: KueColors.accent },
  body: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  notes: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.background,
    padding: KueSpacing.md,
  },
  progressBox: { gap: 6 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: KueColors.line2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: KueColors.accent,
  },
  progressLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  hintBox: {
    gap: KueSpacing.sm,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.background,
    padding: KueSpacing.md,
  },
  hintText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  error: { color: KueColors.danger, fontFamily: KueFonts.sans, fontSize: 12 },
  actions: { flexDirection: 'row', gap: KueSpacing.sm, marginTop: KueSpacing.sm },
  keepButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepLabel: { color: KueColors.ink2, fontFamily: KueFonts.sansMedium, fontSize: 14 },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: KueColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonFull: { flex: 1 },
  primaryLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
  pressed: { opacity: 0.7 },
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
  mandatory: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
    textAlign: 'center',
  },
});
