import { ChevronRight, ExternalLink, LogOut, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { UserAvatar } from '@/components/user-avatar';
import { WEB_BASE_URL } from '@/lib/api/config';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { EditProfileSheet } from '@/features/profile/edit-profile-sheet';
import { changePassword, deleteAccount, updateMe } from '@/lib/api/me';
import { useAuth } from '@/lib/auth/auth-context';
import { useResponsive } from '@/lib/responsive';
import { useTheme } from '@/theme/theme-provider';
import type { ThemeMode } from '@/theme/palette';

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

export default function SettingsScreen() {
  const { user, signOut, updateUser } = useAuth();
  const { contentWidth, gutter } = useResponsive();
  const { mode: themeMode, setMode } = useTheme();

  const [editingProfile, setEditingProfile] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const saveEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed || trimmed === user?.email) return;

    setSavingEmail(true);
    setError(null);
    setEmailNotice(null);
    try {
      const updated = await updateMe({ email: trimmed });
      await updateUser(updated);
      setEmailNotice('Email updated.');
    } catch (cause) {
      setError(errorMessage(cause, 'Could not update your email.'));
    } finally {
      setSavingEmail(false);
    }
  };

  const savePassword = async () => {
    if (currentPassword.length === 0 || newPassword.length < 8) {
      setError('Enter your current password and a new one of at least 8 characters.');
      return;
    }

    setSavingPassword(true);
    setError(null);
    setPasswordNotice(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordNotice('Password changed.');
    } catch (cause) {
      setError(errorMessage(cause, 'Could not change your password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmDelete = async () => {
    setDeletingAccount(false);
    setError(null);
    try {
      await deleteAccount();
      await signOut();
    } catch (cause) {
      setError(errorMessage(cause, 'Could not delete your account.'));
    }
  };

  const askDelete = () => {
    setDeletingAccount(true);
  };

  const signOutNow = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const openLegal = (path: string) => {
    void Linking.openURL(`${WEB_BASE_URL}${path}`).catch(() => undefined);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>Settings</Text>
          <Text style={styles.title}>
            Your account<Text style={styles.accent}>.</Text>
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile</Text>
            <View style={styles.profileRow}>
              <UserAvatar username={user?.username ?? '?'} avatarId={user?.avatarId} size={44} />
              <View style={styles.profileBody}>
                <Text style={styles.profileName}>{user?.username}</Text>
                <Text style={styles.profileMeta}>
                  {user?.kueId ?? ''} · {user?.bio ? 'Bio added' : 'No bio'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                onPress={() => setEditingProfile(true)}
                style={({ pressed }) => [styles.rowButton, pressed && styles.pressed]}>
                <Text style={styles.rowButtonLabel}>Edit</Text>
                <ChevronRight color={KueColors.ink3} size={14} strokeWidth={2} />
              </Pressable>
            </View>
            <Text style={styles.hint}>
              Avatar, username, bio and profile privacy live in Edit profile.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
              accessibilityLabel="Email"
            />
            <View style={styles.cardFooter}>
              {emailNotice ? <Text style={styles.notice}>{emailNotice}</Text> : <View />}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save email"
                disabled={savingEmail || email.trim() === user?.email}
                onPress={() => void saveEmail()}
                style={({ pressed }) => [
                  styles.smallButton,
                  pressed && styles.pressed,
                  (savingEmail || email.trim() === user?.email) && styles.disabled,
                ]}>
                {savingEmail ? (
                  <ActivityIndicator color={KueColors.background} size="small" />
                ) : (
                  <Text style={styles.smallButtonLabel}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Password</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor={KueColors.ink3}
              secureTextEntry
              style={styles.input}
              accessibilityLabel="Current password"
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password (8+ characters)"
              placeholderTextColor={KueColors.ink3}
              secureTextEntry
              style={styles.input}
              accessibilityLabel="New password"
            />
            <View style={styles.cardFooter}>
              {passwordNotice ? <Text style={styles.notice}>{passwordNotice}</Text> : <View />}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change password"
                disabled={savingPassword}
                onPress={() => void savePassword()}
                style={({ pressed }) => [
                  styles.smallButton,
                  pressed && styles.pressed,
                  savingPassword && styles.disabled,
                ]}>
                {savingPassword ? (
                  <ActivityIndicator color={KueColors.background} size="small" />
                ) : (
                  <Text style={styles.smallButtonLabel}>Update</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Appearance</Text>
            <View style={styles.appearanceRow}>
              <Text style={styles.appearanceLabel}>Theme</Text>
            </View>
            <View style={styles.appearanceOptions}>
              {(['dark', 'light', 'system'] as ThemeMode[]).map((option) => {
                const active = themeMode === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Theme ${option}`}
                    onPress={() => setMode(option)}
                    style={[styles.appearanceOption, active && styles.appearanceOptionActive]}>
                    <Text
                      style={[
                        styles.appearanceOptionLabel,
                        active && styles.appearanceOptionLabelActive,
                      ]}>
                      {option === 'system' ? 'System' : option === 'light' ? 'Light' : 'Dark'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>
              System follows your device appearance. The choice is saved on this device.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Privacy policy"
              onPress={() => openLegal('/privacy-policy')}
              style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
              <Text style={styles.linkLabel}>Privacy policy</Text>
              <ExternalLink color={KueColors.ink3} size={14} strokeWidth={1.8} />
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Terms of service"
              onPress={() => openLegal('/terms-of-service')}
              style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
              <Text style={styles.linkLabel}>Terms of service</Text>
              <ExternalLink color={KueColors.ink3} size={14} strokeWidth={1.8} />
            </Pressable>
            <Text style={styles.version}>Kue mobile · 1.0.0</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            disabled={signingOut}
            onPress={() => void signOutNow()}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
            {signingOut ? (
              <ActivityIndicator color={KueColors.ink2} />
            ) : (
              <LogOut color={KueColors.ink2} size={16} strokeWidth={1.8} />
            )}
            <Text style={styles.signOutLabel}>Sign out</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            onPress={askDelete}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
            <Trash2 color={KueColors.danger} size={16} strokeWidth={1.8} />
            <Text style={styles.deleteLabel}>Delete account</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {editingProfile && user ? (
        <EditProfileSheet
          user={user}
          onClose={() => setEditingProfile(false)}
          onSaved={(next) => void updateUser(next)}
        />
      ) : null}

      <BottomSheet visible={deletingAccount} onClose={() => setDeletingAccount(false)}>
        <Text style={styles.sheetTitle}>Delete your account?</Text>
        <Text style={styles.sheetBody}>
          This permanently removes your library, lists, reviews and settings. It cannot be undone.
        </Text>
        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Keep account"
            onPress={() => setDeletingAccount(false)}
            style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}>
            <Text style={styles.keepLabel}>Keep</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete account permanently"
            onPress={() => void confirmDelete()}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}>
            <Text style={styles.dangerLabel}>Delete</Text>
          </Pressable>
        </View>
      </BottomSheet>
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
    gap: KueSpacing.md,
  },
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 32,
    lineHeight: 36,
  },
  accent: {
    color: KueColors.accent,
  },
  error: {
    color: KueColors.danger,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
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
    letterSpacing: 0.8,
  },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 38,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  rowButtonLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.background,
    paddingHorizontal: KueSpacing.md,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
  },
  notice: {
    flex: 1,
    color: KueColors.game,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  smallButton: {
    minWidth: 84,
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: KueColors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
  },
  smallButtonLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  appearanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  appearanceLabel: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 13,
  },
  appearanceOptions: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
  },
  appearanceOption: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceOptionActive: {
    backgroundColor: KueColors.foreground,
    borderColor: KueColors.foreground,
  },
  appearanceOptionLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  appearanceOptionLabelActive: {
    color: KueColors.background,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  linkLabel: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 13,
  },
  version: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: KueSpacing.xs,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  signOutLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(217,112,90,0.4)',
  },
  deleteLabel: {
    color: KueColors.danger,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
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
