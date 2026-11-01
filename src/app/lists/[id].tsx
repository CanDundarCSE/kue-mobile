import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { Skeleton } from '@/components/skeleton';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { ListEditor } from '@/features/lists/list-editor';
import { ListPicker } from '@/features/lists/list-picker';
import {
  addListItem,
  deleteList,
  fetchListDetail,
  removeListItem,
} from '@/lib/api/lists';
import { mediaHref } from '@/lib/media-href';
import { useResponsive } from '@/lib/responsive';

const TYPE_LABEL: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

function first(value: string | string[] | undefined) {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' ? single : '';
}

export default function ListDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const listId = Number(first(id)) || 0;

  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['list', listId],
    queryFn: () => fetchListDetail(listId),
    enabled: listId > 0,
  });

  const list = listQuery.data;
  const items = list?.items ?? [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['list', listId] });
    await queryClient.invalidateQueries({ queryKey: ['my-lists'] });
    await queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };

  const addItem = async (mediaId: number) => {
    if (busyId !== null) return;
    setBusyId(mediaId);
    setError(null);
    try {
      await addListItem(listId, mediaId);
      setPicking(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add that title.');
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (mediaId: number) => {
    if (busyId !== null) return;
    setBusyId(mediaId);
    setError(null);
    try {
      await removeListItem(listId, mediaId);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove that title.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(false);
    setError(null);
    try {
      await deleteList(listId);
      await queryClient.invalidateQueries({ queryKey: ['my-lists'] });
      await queryClient.invalidateQueries({ queryKey: ['user-lists'] });
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete this list.');
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { width: contentWidth, paddingHorizontal: gutter },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
            </Pressable>
            <Text style={styles.topTitle}>List</Text>
          </View>

          {listQuery.isPending ? (
            <View style={styles.card}>
              <Skeleton width="55%" height={22} />
              <Skeleton width="35%" height={10} />
              <Skeleton height={64} radius={10} />
            </View>
          ) : listQuery.isError || !list ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>List not found.</Text>
              <Text style={styles.emptyBody}>It may have been deleted.</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.title}>{list.name}</Text>
                <Text style={styles.meta}>
                  {items.length} {items.length === 1 ? 'title' : 'titles'} ·{' '}
                  {list.visibility === 'private'
                    ? 'Private'
                    : list.visibility === 'friends'
                      ? 'Friends'
                      : 'Public'}
                </Text>
                {list.description ? (
                  <Text style={styles.description}>{list.description}</Text>
                ) : null}

                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit list"
                    onPress={() => setEditing(true)}
                    style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
                    <Pencil color={KueColors.ink2} size={13} strokeWidth={1.8} />
                    <Text style={styles.ghostLabel}>Edit</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete list"
                    onPress={() => setDeleting(true)}
                    style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}>
                    <Trash2 color={KueColors.danger} size={13} strokeWidth={1.8} />
                    <Text style={[styles.ghostLabel, styles.dangerLabel]}>Delete</Text>
                  </Pressable>
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Titles</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add a title"
                  onPress={() => setPicking(true)}
                  style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                  <Plus color={KueColors.accent} size={13} strokeWidth={2.2} />
                  <Text style={styles.addLabel}>Add title</Text>
                </Pressable>
              </View>

              {items.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.emptyTitle}>Nothing here yet.</Text>
                  <Text style={styles.emptyBody}>Add titles from your library to fill this list.</Text>
                </View>
              ) : (
                <View style={styles.itemStack}>
                  {items.map((item) => (
                    <View key={item.id} style={styles.item}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={item.media.title}
                        onPress={() =>
                          router.push(mediaHref({ id: item.mediaId, mediaType: item.media.mediaType }))
                        }
                        style={styles.itemMain}>
                        <View style={styles.poster}>
                          {item.media.coverImage ? (
                            <Image
                              source={{ uri: item.media.coverImage }}
                              style={StyleSheet.absoluteFill}
                              contentFit="cover"
                            />
                          ) : (
                            <Text style={styles.posterFallback}>
                              {item.media.title.charAt(0)}
                            </Text>
                          )}
                        </View>
                        <View style={styles.itemBody}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {item.media.title}
                          </Text>
                          <Text style={styles.itemMeta}>
                            {[
                              TYPE_LABEL[item.media.mediaType] ?? item.media.mediaType,
                              item.media.year,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </View>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.media.title}`}
                        disabled={busyId !== null}
                        hitSlop={6}
                        onPress={() => void removeItem(item.mediaId)}
                        style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                        {busyId === item.mediaId ? (
                          <ActivityIndicator color={KueColors.ink3} size="small" />
                        ) : (
                          <X color={KueColors.ink3} size={16} strokeWidth={2} />
                        )}
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {editing && list ? (
        <ListEditor
          list={list}
          onClose={() => setEditing(false)}
          onSaved={() => void refresh()}
        />
      ) : null}

      {picking ? (
        <ListPicker
          exclude={new Set(items.map((item) => item.mediaId))}
          busyId={busyId}
          onPick={(mediaId) => void addItem(mediaId)}
          onClose={() => setPicking(false)}
        />
      ) : null}

      <BottomSheet visible={deleting} onClose={() => setDeleting(false)}>
        <Text style={styles.sheetTitle}>Delete this list?</Text>
        <Text style={styles.sheetBody}>
          “{list?.name}” and its place on your profile will be removed. The titles stay in your
          library.
        </Text>
        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Keep list"
            onPress={() => setDeleting(false)}
            style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}>
            <Text style={styles.keepLabel}>Keep</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete list"
            onPress={() => void confirmDelete()}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
            <Text style={styles.deleteLabel}>Delete</Text>
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
    paddingTop: KueSpacing.sm,
    paddingBottom: KueSpacing.xxl,
    gap: KueSpacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
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
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.lg,
    gap: KueSpacing.sm,
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 28,
    lineHeight: 32,
  },
  meta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  description: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
    marginTop: KueSpacing.xs,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 38,
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
  dangerLabel: {
    color: KueColors.danger,
  },
  error: {
    color: KueColors.danger,
    fontFamily: KueFonts.sans,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  addLabel: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  itemStack: {
    gap: KueSpacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.sm,
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
  },
  poster: {
    width: 40,
    height: 52,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterFallback: {
    color: KueColors.ink3,
    fontFamily: KueFonts.serif,
    fontSize: 18,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  itemMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 18,
  },
  emptyBody: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
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
  deleteButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: KueColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
});
