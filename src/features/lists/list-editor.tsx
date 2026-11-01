import { ArrowLeft, Globe, Lock, Users } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import {
  createList,
  updateList,
  type CustomList,
  type ListPayload,
  type ListVisibility,
} from '@/lib/api/lists';

const VISIBILITIES: { value: ListVisibility; label: string; hint: string }[] = [
  { value: 'public', label: 'Public', hint: 'Anyone on your profile can see it.' },
  { value: 'friends', label: 'Friends', hint: 'Only you and your friends can see it.' },
  { value: 'private', label: 'Private', hint: 'Only you can see it.' },
];

function normalizeVisibility(value?: string | null): ListVisibility {
  return value === 'friends' || value === 'private' ? value : 'public';
}

export function ListEditor({
  list,
  onSaved,
  onClose,
}: {
  list: CustomList | null;
  onSaved: (saved: CustomList) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(list?.name ?? '');
  const [description, setDescription] = useState(list?.description ?? '');
  const [visibility, setVisibility] = useState<ListVisibility>(
    normalizeVisibility(list?.visibility),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give this list a name.');
      return;
    }

    const payload: ListPayload = {
      name: trimmed,
      description: description.trim() || null,
      visibility,
    };

    setSaving(true);
    setError(null);
    try {
      const saved = list ? await updateList(list.id, payload) : await createList(payload);
      onSaved(saved);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this list.');
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
                accessibilityLabel="Close list editor"
                hitSlop={8}
                onPress={onClose}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
                <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
              </Pressable>
              <Text style={styles.topTitle}>{list ? 'Edit list' : 'New list'}</Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Best of 2026"
                placeholderTextColor={KueColors.ink3}
                maxLength={150}
                style={styles.input}
                accessibilityLabel="List name"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What belongs here?"
                placeholderTextColor={KueColors.ink3}
                multiline
                textAlignVertical="top"
                maxLength={1000}
                style={styles.textarea}
                accessibilityLabel="List description"
              />

              <Text style={styles.label}>Visibility</Text>
              <View style={styles.visibilityRow}>
                {VISIBILITIES.map((option) => {
                  const active = visibility === option.value;
                  const Icon =
                    option.value === 'private' ? Lock : option.value === 'friends' ? Users : Globe;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={option.label}
                      onPress={() => setVisibility(option.value)}
                      style={[styles.visibilityChip, active && styles.visibilityChipActive]}>
                      <Icon
                        color={active ? KueColors.background : KueColors.ink2}
                        size={13}
                        strokeWidth={1.8}
                      />
                      <Text
                        style={[styles.visibilityLabel, active && styles.visibilityLabelActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.hint}>
                {VISIBILITIES.find((option) => option.value === visibility)?.hint}
              </Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save list"
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
                  <Text style={styles.saveLabel}>{list ? 'Save changes' : 'Create list'}</Text>
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
    minHeight: 100,
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
  visibilityRow: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
  },
  visibilityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  visibilityChipActive: {
    backgroundColor: KueColors.foreground,
    borderColor: KueColors.foreground,
  },
  visibilityLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  visibilityLabelActive: {
    color: KueColors.background,
  },
  hint: {
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
