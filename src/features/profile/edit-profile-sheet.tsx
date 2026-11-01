import { Image } from 'expo-image';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import type { AuthUser } from '@/lib/api/types';
import { updateMe } from '@/lib/api/me';
import { AVATAR_IDS, avatarSource, initialOf, isAvatarId } from '@/lib/avatars';

export function EditProfileSheet({
  user,
  onSaved,
  onClose,
}: {
  user: AuthUser;
  onSaved: (next: AuthUser) => void;
  onClose: () => void;
}) {
  const [avatarId, setAvatarId] = useState<string | null>(
    isAvatarId(user.avatarId) ? user.avatarId : null,
  );
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? '');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateMe({
        username: trimmed !== user.username ? trimmed : undefined,
        bio: bio.trim(),
        avatarId: avatarId ?? '',
        isPrivate,
      });
      onSaved(updated);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close editor"
                hitSlop={8}
                onPress={onClose}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
                <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
              </Pressable>
              <Text style={styles.topTitle}>Edit profile</Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Avatar</Text>
              <View style={styles.avatarGrid}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use initials"
                  accessibilityState={{ selected: avatarId === null }}
                  onPress={() => setAvatarId(null)}
                  style={[
                    styles.avatarOption,
                    styles.initialOption,
                    avatarId === null && styles.avatarSelected,
                  ]}>
                  <Text style={styles.initialText}>{initialOf(user.username)}</Text>
                </Pressable>

                {AVATAR_IDS.map((id) => (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityLabel={`Avatar ${id}`}
                    accessibilityState={{ selected: avatarId === id }}
                    onPress={() => setAvatarId(id)}
                    style={[styles.avatarOption, avatarId === id && styles.avatarSelected]}>
                    <Image source={avatarSource(id)} style={styles.avatarImage} contentFit="cover" />
                    {avatarId === id ? (
                      <View style={styles.avatarCheck}>
                        <Check color={KueColors.background} size={10} strokeWidth={3} />
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={50}
                style={styles.input}
                accessibilityLabel="Username"
              />

              <Text style={styles.label}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="A line about you"
                placeholderTextColor={KueColors.ink3}
                multiline
                textAlignVertical="top"
                maxLength={500}
                style={styles.textarea}
                accessibilityLabel="Bio"
              />
              <Text style={styles.counter}>{bio.trim().length}/500</Text>

              <View style={styles.switchRow}>
                <View style={styles.switchBody}>
                  <Text style={styles.switchLabel}>Private profile</Text>
                  <Text style={styles.switchHint}>
                    Only friends can see your library, lists and reviews.
                  </Text>
                </View>
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  trackColor={{ false: KueColors.line2, true: KueColors.accentSoft }}
                  thumbColor={isPrivate ? KueColors.accent : KueColors.ink3}
                  accessibilityLabel="Private profile"
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save profile"
                disabled={saving}
                onPress={() => void save()}
                style={({ pressed }) => [
                  styles.save,
                  pressed && styles.pressed,
                  saving && styles.disabled,
                ]}>
                {saving ? (
                  <ActivityIndicator color={KueColors.background} />
                ) : (
                  <Text style={styles.saveLabel}>Save changes</Text>
                )}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
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
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingHorizontal: KueSpacing.lg,
    paddingVertical: KueSpacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -KueSpacing.sm,
  },
  topTitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: KueSpacing.lg,
    paddingBottom: KueSpacing.xxl,
    gap: KueSpacing.sm,
  },
  label: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: KueSpacing.md,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KueSpacing.sm,
    marginTop: KueSpacing.xs,
  },
  avatarOption: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialOption: {
    backgroundColor: KueColors.accentSoft,
  },
  initialText: {
    color: KueColors.accent,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 18,
  },
  avatarSelected: {
    borderColor: KueColors.accent,
    borderWidth: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarCheck: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: KueColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
    paddingHorizontal: KueSpacing.md,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 14,
  },
  textarea: {
    minHeight: 110,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  counter: {
    alignSelf: 'flex-end',
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.md,
    minHeight: 56,
    marginTop: KueSpacing.md,
  },
  switchBody: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  switchHint: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  error: {
    color: KueColors.danger,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  save: {
    minHeight: 50,
    marginTop: KueSpacing.md,
    borderRadius: 14,
    backgroundColor: KueColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
});
