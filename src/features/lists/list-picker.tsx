import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { fetchLibrary } from '@/lib/api/library';

const TYPE_LABEL: Record<string, string> = {
  movie: 'Film',
  series: 'Series',
  game: 'Game',
  anime: 'Anime',
  manga: 'Manga',
};

export function ListPicker({
  exclude,
  busyId,
  onPick,
  onClose,
}: {
  exclude: Set<number>;
  busyId: number | null;
  onPick: (mediaId: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const libraryQuery = useQuery({
    queryKey: ['library-picker'],
    queryFn: () => fetchLibrary({ page: 1, pageSize: 100 }),
    staleTime: 60_000,
  });

  const items = (libraryQuery.data?.items ?? [])
    .filter((entry) => !exclude.has(entry.mediaId))
    .filter((entry) => {
      const needle = search.trim().toLowerCase();
      return !needle || entry.media.title.toLowerCase().includes(needle);
    });

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close picker"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <ArrowLeft color={KueColors.foreground} size={20} strokeWidth={2} />
            </Pressable>
            <Text style={styles.topTitle}>Add a title</Text>
          </View>

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

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {libraryQuery.isPending ? (
              <ActivityIndicator color={KueColors.ink3} style={styles.loading} />
            ) : items.length === 0 ? (
              <Text style={styles.empty}>
                {search ? 'No titles match that search.' : 'Everything is already in this list.'}
              </Text>
            ) : (
              items.map((entry) => {
                const busy = busyId === entry.mediaId;
                return (
                  <Pressable
                    key={entry.mediaId}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${entry.media.title}`}
                    disabled={busyId !== null}
                    onPress={() => onPick(entry.mediaId)}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                    <View style={styles.poster}>
                      {entry.media.coverImage ? (
                        <Image
                          source={{ uri: entry.media.coverImage }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.posterFallback}>{entry.media.title.charAt(0)}</Text>
                      )}
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {entry.media.title}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {[TYPE_LABEL[entry.mediaType] ?? entry.mediaType, entry.media.year]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    {busy ? (
                      <ActivityIndicator color={KueColors.ink3} size="small" />
                    ) : (
                      <Text style={styles.addLabel}>Add</Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
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
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    height: 44,
    marginHorizontal: KueSpacing.lg,
    marginBottom: KueSpacing.sm,
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
  content: {
    paddingHorizontal: KueSpacing.lg,
    paddingBottom: KueSpacing.xxl,
  },
  loading: {
    paddingVertical: KueSpacing.xxl,
  },
  empty: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    paddingVertical: KueSpacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    paddingVertical: KueSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  poster: {
    width: 36,
    height: 48,
    borderRadius: 6,
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
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  rowMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  addLabel: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
