import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { BottomSheet } from '@/components/bottom-sheet';
import { WEB_BASE_URL } from '@/lib/api/config';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';

export function MyCodeSheet({
  visible,
  onClose,
  kueId,
}: {
  visible: boolean;
  onClose: () => void;
  kueId: string;
}) {
  const [copied, setCopied] = useState(false);
  const addLink = kueId ? `${WEB_BASE_URL}/friends?add=${encodeURIComponent(kueId)}` : '';

  const copy = async () => {
    if (!kueId) return;
    await Clipboard.setStringAsync(kueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const share = () => {
    if (!kueId) return;
    void Share.share({ message: `Add me on Kue — my Kue ID is ${kueId}` });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Your code</Text>
      <Text style={styles.body}>
        A friend can scan this with their camera to send you a request, or look up your Kue ID.
      </Text>

      {addLink ? (
        <View style={styles.qrWrap}>
          <QRCode value={addLink} size={168} color="#111113" backgroundColor="#ffffff" />
        </View>
      ) : null}

      <Text style={styles.kueId}>{kueId || '—'}</Text>

      <View style={styles.actions}>
        <SheetButton label={copied ? 'Copied' : 'Copy ID'} onPress={() => void copy()}>
          {copied ? (
            <Check color={KueColors.game} size={15} strokeWidth={2.2} />
          ) : (
            <Copy color={KueColors.ink2} size={15} strokeWidth={1.8} />
          )}
        </SheetButton>
        <SheetButton label="Share" onPress={share}>
          <Share2 color={KueColors.ink2} size={15} strokeWidth={1.8} />
        </SheetButton>
      </View>
    </BottomSheet>
  );
}

function SheetButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      {children}
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
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
  qrWrap: {
    alignSelf: 'center',
    padding: KueSpacing.md,
    borderRadius: 14,
    backgroundColor: KueColors.white,
    marginTop: KueSpacing.sm,
  },
  kueId: {
    textAlign: 'center',
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 20,
    letterSpacing: 1.4,
    marginTop: KueSpacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: KueSpacing.sm,
    marginTop: KueSpacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: KueSpacing.lg,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  buttonLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
});
