import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { KueColors, KueFonts } from '@/constants/kue-theme';
import { avatarSource, initialOf, isAvatarId } from '@/lib/avatars';

/**
 * The user's chosen avatar, or a first-letter badge when none is picked or the
 * image fails to load. Mirrors the web app's UserAvatar fallback.
 */
export function UserAvatar({
  username,
  avatarId,
  size = 36,
}: {
  username: string;
  avatarId?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const source = isAvatarId(avatarId) && !failed ? avatarSource(avatarId) : null;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.root,
        { width: size, height: size, borderRadius: size / 2 },
        source ? styles.picked : styles.fallback,
      ]}>
      {source ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initialOf(username)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
  },
  picked: {
    backgroundColor: KueColors.surface2,
  },
  fallback: {
    backgroundColor: KueColors.accentSoft,
  },
  initial: {
    color: KueColors.accent,
    fontFamily: KueFonts.sansSemiBold,
  },
});
