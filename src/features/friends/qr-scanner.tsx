import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';

/** Pull a Kue ID out of a scanned code: our add link or a bare ID. */
export function extractKueId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const add = url.searchParams.get('add');
    if (add) return add.trim().toUpperCase();
  } catch {
    // Not a URL; fall through to plain-ID matching.
  }

  const match = value.match(/KUE-[A-Z0-9]+/i);
  return match ? match[0].toUpperCase() : null;
}

export function QrScanner({
  onClose,
  onScanned,
}: {
  onClose: () => void;
  onScanned: (kueId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [handled, setHandled] = useState(false);

  const granted = permission?.granted ?? false;

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={
              handled
                ? undefined
                : (event) => {
                    const kueId = extractKueId(event.data);
                    if (!kueId) return;
                    setHandled(true);
                    onScanned(kueId);
                  }
            }
          />
        ) : null}

        <View style={styles.overlay} pointerEvents="box-none">
          <View style={[styles.header, { paddingTop: insets.top + KueSpacing.sm }]}>
            <Text style={styles.title}>Scan a Kue code</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close scanner"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <X color={KueColors.foreground} size={20} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.frameWrap} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={styles.hint}>
              Point the camera at a friend&apos;s Kue QR code. Requests send automatically.
            </Text>
          </View>

          {!granted ? (
            <View style={styles.permission}>
              {permission === null ? (
                <ActivityIndicator color={KueColors.accent} />
              ) : (
                <>
                  <Text style={styles.permissionText}>
                    Camera access is needed to scan a friend&apos;s QR code.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Allow camera"
                    onPress={() => void requestPermission()}
                    style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}>
                    <Text style={styles.permissionButtonLabel}>Allow camera</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: KueSpacing.lg,
    paddingBottom: KueSpacing.md,
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  frameWrap: {
    alignItems: 'center',
    gap: KueSpacing.lg,
    paddingHorizontal: KueSpacing.xl,
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: KueColors.accent,
    backgroundColor: 'transparent',
  },
  hint: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },
  permission: {
    alignItems: 'center',
    gap: KueSpacing.md,
    padding: KueSpacing.xl,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  permissionText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    textAlign: 'center',
  },
  permissionButton: {
    minHeight: 44,
    paddingHorizontal: KueSpacing.xl,
    borderRadius: 12,
    backgroundColor: KueColors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
});
