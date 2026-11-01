import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Loader2, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  createAddonCredential,
  fetchAddonStatus,
  revokeAddonCredential,
  type AddonCreated,
  type AddonCredential,
} from '@/lib/api/addon';

function formatWhen(value: string | null | undefined) {
  if (!value) return 'never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function NuvioSection() {
  const queryClient = useQueryClient();
  const statusQuery = useQuery({ queryKey: ['addon-status'], queryFn: fetchAddonStatus });

  const [label, setLabel] = useState('');
  const [created, setCreated] = useState<AddonCreated | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const status = statusQuery.data;
  const configured = status?.configured ?? false;
  const credentials = status?.credentials ?? [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['addon-status'] });
  };

  const generate = async () => {
    if (busy) return;
    setBusy('generate');
    setError(null);
    setNotice(null);
    setCopied(false);
    try {
      const result = await createAddonCredential(label.trim() || 'Mobile device');
      setCreated(result);
      setLabel('');
      await refresh();
      setNotice('Addon URL created. Install it in Nuvio on this device.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the addon URL.');
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!created) return;
    await Clipboard.setStringAsync(created.manifestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const revoke = async (credential: AddonCredential) => {
    if (busy) return;
    setBusy(`revoke-${credential.id}`);
    setError(null);
    setNotice(null);
    try {
      await revokeAddonCredential(credential.id);
      if (created?.id === credential.id) setCreated(null);
      await refresh();
      setNotice('Device disconnected. Other devices stay connected.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke this device.');
    } finally {
      setBusy(null);
    }
  };

  const revokeAll = async () => {
    setConfirmRevokeAll(false);
    setBusy('revoke-all');
    setError(null);
    setNotice(null);
    try {
      await revokeAddonCredential();
      setCreated(null);
      await refresh();
      setNotice('All addon URLs revoked.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke the addon URLs.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Nuvio connection</Text>
        {configured ? (
          <View style={styles.connected}>
            <Check color={KueColors.game} size={11} strokeWidth={2.4} />
            <Text style={styles.connectedLabel}>
              Connected{credentials.length > 1 ? ` · ${credentials.length}` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.body}>
        Connect Nuvio once and Kue keeps your library in sync as you watch.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {configured
            ? 'Nuvio is connected. Movies and series you open are added to your library automatically. Movie completion is still managed in Kue.'
            : 'No addon URL is active. Generate one below and install it in Nuvio to start tracking automatically.'}
        </Text>
        <Text style={styles.infoHint}>
          Each device needs its own URL. Opening a title never marks it completed.
        </Text>
      </View>

      {created ? (
        <View style={styles.createdBox}>
          <Text style={styles.createdLabel}>
            Addon manifest URL{created.label ? ` · ${created.label}` : ''}
          </Text>
          <Text selectable style={styles.url}>
            {created.manifestUrl}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Copied addon URL' : 'Copy addon URL'}
            onPress={() => void copy()}
            style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
            {copied ? (
              <Check color={KueColors.game} size={13} strokeWidth={2.2} />
            ) : (
              <Copy color={KueColors.ink2} size={13} strokeWidth={1.8} />
            )}
            <Text style={styles.ghostLabel}>{copied ? 'Copied' : 'Copy URL'}</Text>
          </Pressable>
          <Text style={styles.infoHint}>
            Copy it now — Kue stores only a hash and cannot show this URL again.
          </Text>
        </View>
      ) : null}

      {credentials.length > 0 ? (
        <View style={styles.devices}>
          <Text style={styles.createdLabel}>Connected devices</Text>
          {credentials.map((credential, index) => (
            <View key={credential.id} style={[styles.deviceRow, index > 0 && styles.divider]}>
              <View style={styles.deviceBody}>
                <Text style={styles.deviceName} numberOfLines={1}>
                  {credential.label ?? 'Addon connection'}
                </Text>
                <Text style={styles.deviceMeta}>
                  Created {formatWhen(credential.createdAt)} · last used{' '}
                  {formatWhen(credential.lastUsedAt)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Revoke ${credential.label ?? 'addon connection'}`}
                disabled={busy !== null}
                onPress={() => void revoke(credential)}
                style={({ pressed }) => [styles.revokeButton, pressed && styles.pressed]}>
                {busy === `revoke-${credential.id}` ? (
                  <ActivityIndicator color={KueColors.danger} size="small" />
                ) : (
                  <Trash2 color={KueColors.danger} size={13} strokeWidth={1.8} />
                )}
                <Text style={styles.revokeLabel}>Revoke</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.generateRow}>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Label this device"
          placeholderTextColor={KueColors.ink3}
          maxLength={40}
          style={styles.input}
          accessibilityLabel="Device label"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={configured ? 'Add device' : 'Generate addon URL'}
          disabled={busy !== null}
          onPress={() => void generate()}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          {busy === 'generate' ? (
            <Loader2 color={KueColors.background} size={13} strokeWidth={2} />
          ) : (
            <Plus color={KueColors.background} size={13} strokeWidth={2.2} />
          )}
          <Text style={styles.primaryLabel}>{configured ? 'Add device' : 'Generate'}</Text>
        </Pressable>
      </View>

      {configured ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Disconnect all devices"
          disabled={busy !== null}
          onPress={() => setConfirmRevokeAll(true)}
          style={styles.revokeAllRow}>
          <Text style={styles.revokeAllLabel}>Disconnect all devices</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <BottomSheet visible={confirmRevokeAll} onClose={() => setConfirmRevokeAll(false)}>
        <Text style={styles.sheetTitle}>Disconnect every device?</Text>
        <Text style={styles.sheetBody}>
          Every addon URL will be revoked. Nuvio stops syncing until you generate a new URL.
        </Text>
        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Keep connections"
            onPress={() => setConfirmRevokeAll(false)}
            style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}>
            <Text style={styles.keepLabel}>Keep</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Revoke all addon URLs"
            onPress={() => void revokeAll()}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}>
            <Text style={styles.dangerLabel}>Disconnect</Text>
          </Pressable>
        </View>
      </BottomSheet>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
  },
  cardTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  connected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(95,174,124,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  connectedLabel: {
    color: KueColors.game,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  infoBox: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.background,
    padding: KueSpacing.md,
    gap: 6,
  },
  infoText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  infoHint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  createdBox: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.background,
    padding: KueSpacing.md,
    gap: KueSpacing.sm,
  },
  createdLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  url: {
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 11,
    lineHeight: 16,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  ghostLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
  devices: {
    gap: 2,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.sm,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
  },
  deviceBody: {
    flex: 1,
    gap: 2,
  },
  deviceName: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  deviceMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 10,
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(217,112,90,0.4)',
  },
  revokeLabel: {
    color: KueColors.danger,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  generateRow: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
    alignItems: 'center',
    marginTop: KueSpacing.xs,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.background,
    paddingHorizontal: KueSpacing.md,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 42,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    backgroundColor: KueColors.foreground,
  },
  primaryLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  revokeAllRow: {
    alignSelf: 'flex-start',
    minHeight: 34,
    justifyContent: 'center',
  },
  revokeAllLabel: {
    color: KueColors.danger,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  error: {
    color: KueColors.danger,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  notice: {
    color: KueColors.game,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  sheetTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 22,
  },
  sheetBody: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
    marginTop: KueSpacing.sm,
  },
  keepButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansMedium,
    fontSize: 14,
  },
  dangerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: KueColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
});
