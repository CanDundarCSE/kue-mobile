import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { ChevronDown, Heart, Minus, Plus, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OptionSheet, type SheetOption } from '@/components/option-sheet';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { mediaTypeOf, progressUnit, statusOf } from '@/features/library/library-row';
import type { LibraryEntry, UpdateLibraryParams } from '@/lib/api/library';

const STATUS_CHOICES: { value: string; label: string }[] = [
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'planning', label: 'Planned' },
  { value: 'completed', label: 'Done' },
  { value: 'dropped', label: 'Dropped' },
];

const TYPE_LABEL: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

export function EditSheet({
  entry,
  onClose,
  onSave,
  onDelete,
}: {
  entry: LibraryEntry | null;
  onClose: () => void;
  onSave: (mediaId: number, params: UpdateLibraryParams) => Promise<void>;
  onDelete: (mediaId: number) => Promise<void>;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      statusBarTranslucent
      visible={entry !== null}
      onRequestClose={onClose}>
      {entry ? <EditForm key={entry.id} entry={entry} onClose={onClose} onSave={onSave} onDelete={onDelete} /> : null}
    </Modal>
  );
}

function EditForm({
  entry,
  onClose,
  onSave,
  onDelete,
}: {
  entry: LibraryEntry;
  onClose: () => void;
  onSave: (mediaId: number, params: UpdateLibraryParams) => Promise<void>;
  onDelete: (mediaId: number) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [sheetHeight, setSheetHeight] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  const type = mediaTypeOf(entry);
  const total = entry.totalUnits ?? entry.media.totalUnits ?? null;
  const editableProgress = type === 'anime' || type === 'series' || type === 'manga' || type === 'game';
  const unit = progressUnit(entry);

  const [status, setStatus] = useState(entry.status);
  const [current, setCurrent] = useState(entry.progress ?? 0);
  const [rating, setRating] = useState<number | null>(entry.rating ?? null);
  const [favorite, setFavorite] = useState(entry.isFavorite);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [platform, setPlatform] = useState(entry.platform ?? '');

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || 620, 0],
  });

  const busy = saving || deleting;
  const max = total ?? Number.MAX_SAFE_INTEGER;

  const statusOptions: SheetOption<string>[] = STATUS_CHOICES.map((choice) => ({
    value: choice.value,
    label: choice.label,
    dot: statusOf(choice.value).color,
  }));

  // Mirrors the web sheet: the game's own platform list when the API has one,
  // otherwise the generic console choices.
  const platforms = (() => {
    const known = entry.media.platforms ?? [];
    const list = known.length > 0 ? [...known] : ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch'];
    if (platform && !list.some((item) => item.toLowerCase() === platform.toLowerCase())) {
      list.push(platform);
    }
    return list;
  })();

  const platformOptions: SheetOption<string>[] = [
    { value: '', label: 'Not set' },
    ...platforms.map((name) => ({ value: name, label: name })),
  ];

  const setStatusChoice = (value: string) => {
    setStatus(value);
    if (value === 'completed' && total !== null) setCurrent(total);
  };

  const step = (delta: number) => {
    setCurrent((value) => Math.max(0, Math.min(max, value + delta)));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const params: UpdateLibraryParams = { status, isFavorite: favorite };
      if (editableProgress) params.progress = current;
      if (rating !== null) params.rating = rating;
      if (type === 'game') params.platform = platform;

      await onSave(entry.mediaId, params);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Remove this title?', `${entry.media.title} will leave your library.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleting(true);
            setError(null);
            try {
              await onDelete(entry.mediaId);
              onClose();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : 'Could not remove this title.');
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={busy ? undefined : onClose} accessibilityLabel="Close" />

      <Animated.View
        accessibilityViewIsModal
        onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
        style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.grabber} />

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + KueSpacing.lg }}>
          <View style={styles.header}>
            <View style={styles.poster}>
              {entry.media.coverImage ? (
                <Image source={{ uri: entry.media.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Text style={styles.posterFallback}>{entry.media.title.charAt(0)}</Text>
              )}
            </View>

            <View style={styles.headerBody}>
              <Text style={styles.title} numberOfLines={2}>
                {entry.media.title}
              </Text>
              <Text style={styles.meta}>
                {[TYPE_LABEL[type] ?? type, entry.media.year].filter(Boolean).join(' · ')}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              disabled={busy}
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <X color={KueColors.ink2} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Status</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Status: ${statusOf(status).label}`}
            disabled={busy}
            onPress={() => setStatusOpen(true)}
            style={({ pressed }) => [styles.picker, pressed && styles.pressed]}>
            <View style={[styles.statusDot, { backgroundColor: statusOf(status).color }]} />
            <Text style={styles.pickerValue}>{statusOf(status).label}</Text>
            <ChevronDown color={KueColors.ink3} size={14} strokeWidth={2} />
          </Pressable>

          {type === 'game' ? (
            <>
              <Text style={styles.sectionLabel}>Platform</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Platform: ${platform || 'Not set'}`}
                disabled={busy}
                onPress={() => setPlatformOpen(true)}
                style={({ pressed }) => [styles.picker, pressed && styles.pressed]}>
                <Text style={[styles.pickerValue, !platform && styles.pickerEmpty]}>
                  {platform || 'Not set'}
                </Text>
                <ChevronDown color={KueColors.ink3} size={14} strokeWidth={2} />
              </Pressable>
            </>
          ) : null}

          {editableProgress ? (
            <>
              <Text style={styles.sectionLabel}>Progress</Text>
              <View style={styles.stepperRow}>
                <StepButton label="Decrease progress" disabled={busy || current <= 0} onPress={() => step(-1)}>
                  <Minus color={KueColors.foreground} size={18} strokeWidth={2} />
                </StepButton>

                <View style={styles.progressBlock}>
                  <Text style={styles.progressValue}>
                    {current}
                    {total !== null ? <Text style={styles.progressTotal}> / {total}</Text> : null}
                    <Text style={styles.progressUnit}> {unit}</Text>
                  </Text>
                  {total !== null && total > 0 ? (
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${Math.min(100, Math.round((current / total) * 100))}%` },
                        ]}
                      />
                    </View>
                  ) : null}
                </View>

                <StepButton
                  label="Increase progress"
                  disabled={busy || current >= max}
                  onPress={() => step(1)}>
                  <Plus color={KueColors.foreground} size={18} strokeWidth={2} />
                </StepButton>
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Rating</Text>
          <View style={styles.ratingRow}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={rating ?? 5}
              minimumTrackTintColor={KueColors.accent}
              maximumTrackTintColor={KueColors.line2}
              thumbTintColor={KueColors.accent}
              disabled={busy}
              onValueChange={(value) => setRating(Math.round(value))}
              accessibilityLabel="Rating out of 10"
            />
            <Text style={[styles.ratingValue, rating === null && styles.ratingEmpty]}>
              {rating === null ? '—' : `${rating}/10`}
            </Text>
          </View>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: favorite }}
            accessibilityLabel="Favorite"
            disabled={busy}
            onPress={() => setFavorite((value) => !value)}
            style={({ pressed }) => [styles.favoriteRow, pressed && styles.pressed]}>
            <Heart
              color={favorite ? KueColors.movie : KueColors.ink3}
              fill={favorite ? KueColors.movie : 'transparent'}
              size={18}
              strokeWidth={1.8}
            />
            <Text style={styles.favoriteLabel}>Favorite</Text>
            <Switch
              value={favorite}
              onValueChange={setFavorite}
              disabled={busy}
              trackColor={{ false: KueColors.line2, true: KueColors.accentSoft }}
              thumbColor={favorite ? KueColors.accent : KueColors.ink3}
            />
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save changes"
            disabled={busy}
            onPress={() => void save()}
            style={({ pressed }) => [styles.save, pressed && styles.pressed, busy && styles.disabled]}>
            {saving ? (
              <ActivityIndicator color={KueColors.background} />
            ) : (
              <Text style={styles.saveLabel}>Save changes</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove from library"
            disabled={busy}
            onPress={confirmDelete}
            style={({ pressed }) => [styles.deleteRow, pressed && styles.pressed, busy && styles.disabled]}>
            {deleting ? (
              <ActivityIndicator color={KueColors.danger} />
            ) : (
              <>
                <Trash2 color={KueColors.danger} size={16} strokeWidth={1.8} />
                <Text style={styles.deleteLabel}>Remove from library</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </Animated.View>

      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={statusOptions}
        value={status}
        onSelect={(next) => {
          setStatusChoice(next);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />

      <OptionSheet
        visible={platformOpen}
        title="Platform"
        options={platformOptions}
        value={platform}
        onSelect={(next) => {
          setPlatform(next);
          setPlatformOpen(false);
        }}
        onClose={() => setPlatformOpen(false)}
      />
    </View>
  );
}

function StepButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: KueColors.surface2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    paddingHorizontal: KueSpacing.xl,
    paddingTop: KueSpacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: KueColors.line2,
    marginBottom: KueSpacing.lg,
  },
  header: {
    flexDirection: 'row',
    gap: KueSpacing.md,
    alignItems: 'center',
    marginBottom: KueSpacing.lg,
  },
  poster: {
    width: 52,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterFallback: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 24,
  },
  headerBody: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  meta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: KueSpacing.md,
    marginBottom: KueSpacing.sm,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    minHeight: 48,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.background,
  },
  pickerValue: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 14,
  },
  pickerEmpty: {
    color: KueColors.ink3,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  progressValue: {
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 15,
  },
  progressTotal: {
    color: KueColors.ink2,
  },
  progressUnit: {
    color: KueColors.ink3,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  track: {
    height: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: KueColors.accent,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  ratingValue: {
    width: 48,
    textAlign: 'right',
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 13,
  },
  ratingEmpty: {
    color: KueColors.ink3,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    minHeight: 52,
    paddingHorizontal: KueSpacing.sm,
    borderRadius: 10,
    marginTop: KueSpacing.md,
  },
  favoriteLabel: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 14,
  },
  error: {
    color: KueColors.danger,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    marginTop: KueSpacing.md,
  },
  save: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: KueColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: KueSpacing.lg,
  },
  saveLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: KueSpacing.sm,
    minHeight: 48,
    marginTop: KueSpacing.sm,
    borderRadius: 12,
  },
  deleteLabel: {
    color: KueColors.danger,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
