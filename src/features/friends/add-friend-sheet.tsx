import { useQuery } from '@tanstack/react-query';
import { ScanLine, Search, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { UserAvatar } from '@/components/user-avatar';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  fetchIncomingRequests,
  lookupByKueId,
  removeFriend,
  respondToRequest,
  sendFriendRequestByKueId,
  type PublicProfile,
} from '@/lib/api/friends';
import { useAuth } from '@/lib/auth/auth-context';

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

export function AddFriendSheet({
  visible,
  onClose,
  onScan,
  onChanged,
}: {
  visible: boolean;
  onClose: () => void;
  onScan: () => void;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const incomingQuery = useQuery({
    queryKey: ['friends-incoming'],
    queryFn: fetchIncomingRequests,
    enabled: visible,
  });

  const [code, setCode] = useState('');
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [looking, setLooking] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const incoming = incomingQuery.data ?? [];
  const profileRequest = profile
    ? incoming.find((request) => request.requesterId === profile.id)
    : undefined;
  const isSelf = profile !== null && profile.id === user?.id;

  const lookup = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || looking) return;
    setLooking(true);
    setError(null);
    setNotice(null);
    setProfile(null);
    try {
      setProfile(await lookupByKueId(trimmed));
    } catch (cause) {
      setError(errorMessage(cause, `No account found for "${trimmed}".`));
    } finally {
      setLooking(false);
    }
  };

  const refreshProfile = async (fallbackId: string) => {
    try {
      setProfile(await lookupByKueId(profile?.kueId ?? fallbackId));
    } catch {
      // Keep the current card when the refresh fails.
    }
  };

  const run = async (key: string, action: () => Promise<unknown>, done: string, id: string) => {
    if (acting) return;
    setActing(key);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(done);
      onChanged();
      await refreshProfile(id);
    } catch (cause) {
      setError(errorMessage(cause, 'Something went wrong. Please try again.'));
    } finally {
      setActing(null);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Add a friend</Text>
      <Text style={styles.body}>Look someone up by their Kue ID, or scan their code.</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Search color={KueColors.ink3} size={15} strokeWidth={2} />
          <TextInput
            value={code}
            onChangeText={setCode}
            onSubmitEditing={() => void lookup(code)}
            placeholder="KUE-XXXXXX"
            placeholderTextColor={KueColors.ink3}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
            accessibilityLabel="Friend's Kue ID"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Look up Kue ID"
          disabled={looking || code.trim().length === 0}
          onPress={() => void lookup(code)}
          style={({ pressed }) => [
            styles.searchButton,
            pressed && styles.pressed,
            (looking || code.trim().length === 0) && styles.disabled,
          ]}>
          {looking ? (
            <ActivityIndicator color={KueColors.background} size="small" />
          ) : (
            <Text style={styles.searchButtonLabel}>Find</Text>
          )}
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scan a QR code"
        onPress={onScan}
        style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}>
        <ScanLine color={KueColors.ink2} size={15} strokeWidth={1.8} />
        <Text style={styles.scanButtonLabel}>Scan a code</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {profile ? (
        <View style={styles.profileCard}>
          <UserAvatar username={profile.username} avatarId={profile.avatarId} size={44} />
          <View style={styles.profileBody}>
            <Text style={styles.profileName} numberOfLines={1}>
              {profile.username}
            </Text>
            <Text style={styles.profileMeta} numberOfLines={1}>
              {profile.kueId ?? ''}
            </Text>
          </View>

          {isSelf ? (
            <Text style={styles.statusText}>That&apos;s you</Text>
          ) : profile.isFriend || profile.friendshipStatus === 'accepted' ? (
            <Text style={styles.friendStatus}>Friends</Text>
          ) : profileRequest ? (
            <SmallButton
              label="Accept"
              tone="accent"
              disabled={acting !== null}
              onPress={() =>
                void run(
                  'accept',
                  () => respondToRequest(profileRequest.id, 'accept'),
                  'You are now friends.',
                  profile.kueId ?? code,
                )
              }
            />
          ) : profile.friendshipStatus === 'pending_sent' ? (
            <SmallButton
              label="Cancel"
              disabled={acting !== null}
              onPress={() =>
                void run(
                  'cancel',
                  () => removeFriend(profile.username),
                  'Request cancelled.',
                  profile.kueId ?? code,
                )
              }
            />
          ) : (
            <SmallButton
              label="Add"
              disabled={acting !== null}
              onPress={() =>
                void run(
                  'add',
                  () => sendFriendRequestByKueId(profile.kueId ?? code.trim()),
                  'Friend request sent.',
                  profile.kueId ?? code,
                )
              }>
              <UserPlus color={KueColors.background} size={14} strokeWidth={2} />
            </SmallButton>
          )}
        </View>
      ) : null}
    </BottomSheet>
  );
}

function SmallButton({
  label,
  tone,
  disabled,
  onPress,
  children,
}: {
  label: string;
  tone?: 'accent';
  disabled?: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallButton,
        tone === 'accent' && styles.smallButtonAccent,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {children}
      <Text style={[styles.smallButtonLabel, tone === 'accent' && styles.smallButtonLabelAccent]}>
        {label}
      </Text>
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
  searchRow: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
    marginTop: KueSpacing.xs,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    height: 46,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.background,
  },
  searchInput: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    paddingVertical: 0,
  },
  searchButton: {
    height: 46,
    minWidth: 72,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 10,
    backgroundColor: KueColors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  scanButtonLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    marginTop: KueSpacing.sm,
    padding: KueSpacing.md,
    borderRadius: 12,
    backgroundColor: KueColors.background,
  },
  profileBody: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
  profileMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  friendStatus: {
    color: KueColors.game,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  smallButtonAccent: {
    backgroundColor: KueColors.accent,
    borderColor: KueColors.accent,
  },
  smallButtonLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  smallButtonLabelAccent: {
    color: KueColors.background,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
