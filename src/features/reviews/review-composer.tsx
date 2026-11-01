import Slider from '@react-native-community/slider';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ArrowLeft, Lock, Globe, Search } from 'lucide-react-native';
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
import { fetchLibrary } from '@/lib/api/library';
import type { ReviewPayload, SpoilerRange, UserReview } from '@/lib/api/reviews';
import { SpoilerText } from '@/features/reviews/spoiler-text';

const MAX_LENGTH = 255;

const TYPE_LABEL: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

export type ComposerMedia = {
  id: number;
  title: string;
  mediaType: string;
  coverImage?: string | null;
  year?: number | null;
};

export function ReviewComposer({
  review,
  busy,
  error,
  onSubmit,
  onClose,
}: {
  /** Present when editing an existing review. */
  review: UserReview | null;
  busy: boolean;
  error: string | null;
  onSubmit: (payload: ReviewPayload & { mediaId: number }) => void;
  onClose: () => void;
}) {
  const [media, setMedia] = useState<ComposerMedia | null>(
    review
      ? {
          id: review.mediaId,
          title: review.mediaTitle,
          mediaType: review.mediaType,
          coverImage: review.mediaCoverImage,
          year: review.mediaYear,
        }
      : null,
  );
  const [content, setContent] = useState(review?.content ?? '');
  const [rating, setRating] = useState<number | null>(review?.rating ?? null);
  const [spoilers, setSpoilers] = useState(review?.containsSpoilers ?? false);
  const [ranges, setRanges] = useState<SpoilerRange[]>(review?.spoilers ?? []);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [rangeHint, setRangeHint] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(review?.isPublic ?? true);
  const [search, setSearch] = useState('');

  const libraryQuery = useQuery({
    queryKey: ['library-picker'],
    queryFn: () => fetchLibrary({ page: 1, pageSize: 100 }),
    enabled: review === null,
    staleTime: 60_000,
  });

  const options: ComposerMedia[] = (libraryQuery.data?.items ?? [])
    .map((entry) => ({
      id: entry.mediaId,
      title: entry.media.title,
      mediaType: entry.mediaType || entry.media.mediaType,
      coverImage: entry.media.coverImage,
      year: entry.media.year,
    }))
    .filter((item) => {
      const needle = search.trim().toLowerCase();
      return !needle || item.title.toLowerCase().includes(needle);
    });

  const canSave = media !== null && content.trim().length > 0 && !busy;
  const selectedLength = Math.max(0, selection.end - selection.start);

  const changeContent = (value: string) => {
    setContent(value);
    if (ranges.length > 0) {
      setRanges([]);
      setRangeHint('Spoiler marks cleared — select the text again and tap Mark spoiler.');
    }
  };

  const markSelection = () => {
    if (selectedLength === 0) return;

    const next = [...ranges, { start: selection.start, end: selection.end }].sort(
      (a, b) => a.start - b.start,
    );
    const merged: SpoilerRange[] = [];
    next.forEach((range) => {
      const last = merged[merged.length - 1];
      if (last && range.start <= last.end) {
        last.end = Math.max(last.end, range.end);
        return;
      }
      merged.push({ ...range });
    });

    setRanges(merged);
    setRangeHint(null);
  };

  const submit = () => {
    if (!media || !canSave) return;
    onSubmit({
      mediaId: media.id,
      content: content.trim(),
      rating,
      containsSpoilers: spoilers || ranges.length > 0,
      spoilers: ranges,
      isPublic,
    });
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
                accessibilityLabel="Close composer"
                hitSlop={8}
                onPress={onClose}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
                <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
              </Pressable>
              <Text style={styles.topTitle}>{review ? 'Edit review' : 'New review'}</Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {review === null ? (
                media ? (
                  <View style={styles.selected}>
                    <View style={styles.selectedPoster}>
                      {media.coverImage ? (
                        <Image
                          source={{ uri: media.coverImage }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.posterFallback}>{media.title.charAt(0)}</Text>
                      )}
                    </View>
                    <View style={styles.selectedBody}>
                      <Text style={styles.selectedTitle} numberOfLines={2}>
                        {media.title}
                      </Text>
                      <Text style={styles.selectedMeta}>
                        {[TYPE_LABEL[media.mediaType] ?? media.mediaType, media.year]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Change title"
                      onPress={() => setMedia(null)}
                      hitSlop={8}>
                      <Text style={styles.change}>Change</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <Text style={styles.label}>Pick a title from your library</Text>
                    <View style={styles.searchField}>
                      <Search color={KueColors.ink3} size={14} strokeWidth={2} />
                      <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search your library"
                        placeholderTextColor={KueColors.ink3}
                        autoCorrect={false}
                        style={styles.searchInput}
                        accessibilityLabel="Search your library"
                      />
                    </View>

                    {libraryQuery.isPending ? (
                      <ActivityIndicator color={KueColors.ink3} style={styles.loading} />
                    ) : options.length === 0 ? (
                      <Text style={styles.empty}>
                        {search ? 'No titles match that search.' : 'Your library is empty.'}
                      </Text>
                    ) : (
                      <View style={styles.optionList}>
                        {options.map((item) => (
                          <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            accessibilityLabel={item.title}
                            onPress={() => setMedia(item)}
                            style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                            <View style={styles.optionPoster}>
                              {item.coverImage ? (
                                <Image
                                  source={{ uri: item.coverImage }}
                                  style={StyleSheet.absoluteFill}
                                  contentFit="cover"
                                />
                              ) : (
                                <Text style={styles.posterFallback}>{item.title.charAt(0)}</Text>
                              )}
                            </View>
                            <View style={styles.optionBody}>
                              <Text style={styles.optionTitle} numberOfLines={1}>
                                {item.title}
                              </Text>
                              <Text style={styles.optionMeta}>
                                {[TYPE_LABEL[item.mediaType] ?? item.mediaType, item.year]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </>
                )
              ) : (
                <View style={styles.selected}>
                  <View style={styles.selectedPoster}>
                    {media?.coverImage ? (
                      <Image
                        source={{ uri: media.coverImage }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.posterFallback}>{media?.title.charAt(0) ?? '?'}</Text>
                    )}
                  </View>
                  <View style={styles.selectedBody}>
                    <Text style={styles.selectedTitle} numberOfLines={2}>
                      {media?.title}
                    </Text>
                    <Text style={styles.selectedMeta}>
                      {[TYPE_LABEL[media?.mediaType ?? ''] ?? media?.mediaType, media?.year]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.label}>Your review</Text>
              <TextInput
                value={content}
                onChangeText={changeContent}
                onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
                placeholder="What did you think?"
                placeholderTextColor={KueColors.ink3}
                multiline
                textAlignVertical="top"
                maxLength={MAX_LENGTH}
                style={styles.textarea}
                accessibilityLabel="Review text"
              />
              <Text style={styles.counter}>
                {content.trim().length}/{MAX_LENGTH}
              </Text>

              <View style={styles.spoilerTools}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mark selected text as spoiler"
                  disabled={selectedLength === 0}
                  onPress={markSelection}
                  style={({ pressed }) => [
                    styles.spoilerButton,
                    selectedLength > 0 && styles.spoilerButtonActive,
                    pressed && styles.pressed,
                    selectedLength === 0 && styles.disabled,
                  ]}>
                  <Text
                    style={[
                      styles.spoilerButtonLabel,
                      selectedLength > 0 && styles.spoilerButtonLabelActive,
                    ]}>
                    {selectedLength > 0 ? `Mark spoiler · ${selectedLength} chars` : 'Mark spoiler'}
                  </Text>
                </Pressable>

                {ranges.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear spoiler marks"
                    onPress={() => {
                      setRanges([]);
                      setRangeHint(null);
                    }}
                    hitSlop={8}>
                    <Text style={styles.clearMarks}>Clear ({ranges.length})</Text>
                  </Pressable>
                ) : null}
              </View>

              {rangeHint ? <Text style={styles.rangeHint}>{rangeHint}</Text> : null}

              {content.trim().length > 0 ? (
                <View style={styles.preview}>
                  <Text style={styles.previewLabel}>Preview</Text>
                  <SpoilerText
                    content={content}
                    spoilers={ranges}
                    maskAll={spoilers && ranges.length === 0}
                    style={styles.previewText}
                  />
                </View>
              ) : null}

              <Text style={styles.label}>Rating</Text>
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
                  onValueChange={(value) => setRating(Math.round(value))}
                  accessibilityLabel="Rating out of 10"
                />
                <Text style={[styles.ratingValue, rating === null && styles.ratingEmpty]}>
                  {rating === null ? '—' : `${rating}/10`}
                </Text>
                {rating !== null ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear rating"
                    hitSlop={8}
                    onPress={() => setRating(null)}>
                    <Text style={styles.clear}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Contains spoilers</Text>
                <Switch
                  value={spoilers}
                  onValueChange={setSpoilers}
                  trackColor={{ false: KueColors.line2, true: KueColors.accentSoft }}
                  thumbColor={spoilers ? KueColors.accent : KueColors.ink3}
                  accessibilityLabel="Contains spoilers"
                />
              </View>

              <Text style={styles.label}>Visibility</Text>
              <View style={styles.visibility}>
                <VisibilityButton
                  label="Public"
                  icon={<Globe color={isPublic ? KueColors.background : KueColors.ink2} size={13} strokeWidth={1.8} />}
                  active={isPublic}
                  onPress={() => setIsPublic(true)}
                />
                <VisibilityButton
                  label="Private"
                  icon={<Lock color={!isPublic ? KueColors.background : KueColors.ink2} size={13} strokeWidth={1.8} />}
                  active={!isPublic}
                  onPress={() => setIsPublic(false)}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save review"
                disabled={!canSave}
                onPress={submit}
                style={({ pressed }) => [
                  styles.save,
                  pressed && styles.pressed,
                  !canSave && styles.disabled,
                ]}>
                {busy ? (
                  <ActivityIndicator color={KueColors.background} />
                ) : (
                  <Text style={styles.saveLabel}>{review ? 'Save changes' : 'Publish review'}</Text>
                )}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function VisibilityButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.visibilityButton, active && styles.visibilityActive]}>
      {icon}
      <Text style={[styles.visibilityLabel, active && styles.visibilityLabelActive]}>{label}</Text>
    </Pressable>
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
  pressed: {
    opacity: 0.7,
  },
  topTitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
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
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
  },
  selectedPoster: {
    width: 42,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBody: {
    flex: 1,
    gap: 2,
  },
  selectedTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 18,
    lineHeight: 22,
  },
  selectedMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  change: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  posterFallback: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 18,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    height: 44,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
  },
  searchInput: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    paddingVertical: 0,
  },
  loading: {
    paddingVertical: KueSpacing.lg,
  },
  empty: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    paddingVertical: KueSpacing.md,
  },
  optionList: {
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    paddingVertical: KueSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  optionPoster: {
    width: 36,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  optionMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  textarea: {
    minHeight: 140,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 14,
    lineHeight: 20,
    padding: KueSpacing.md,
  },
  counter: {
    alignSelf: 'flex-end',
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
  },
  spoilerTools: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
    marginTop: KueSpacing.xs,
  },
  spoilerButton: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  spoilerButtonActive: {
    borderColor: 'rgba(207,165,68,0.5)',
    backgroundColor: 'rgba(207,165,68,0.10)',
  },
  spoilerButtonLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  spoilerButtonLabelActive: {
    color: KueColors.series,
  },
  clearMarks: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rangeHint: {
    color: KueColors.series,
    fontFamily: KueFonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  preview: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.background,
    padding: KueSpacing.md,
    gap: 6,
  },
  previewLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  previewText: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
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
    width: 46,
    textAlign: 'right',
    color: KueColors.foreground,
    fontFamily: KueFonts.mono,
    fontSize: 12,
  },
  ratingEmpty: {
    color: KueColors.ink3,
  },
  clear: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginTop: KueSpacing.sm,
  },
  switchLabel: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 13,
  },
  visibility: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
  },
  visibilityButton: {
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
  visibilityActive: {
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
  disabled: {
    opacity: 0.5,
  },
});
