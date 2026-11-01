import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Globe, Lock, Plus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { ListEditor } from '@/features/lists/list-editor';
import { fetchMyLists, type CustomList } from '@/lib/api/lists';

function visibilityMeta(list: CustomList) {
  if (list.visibility === 'private') return { label: 'Private', Icon: Lock };
  if (list.visibility === 'friends') return { label: 'Friends', Icon: Users };
  return { label: 'Public', Icon: Globe };
}

export function MyListsSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const listsQuery = useQuery({ queryKey: ['my-lists'], queryFn: fetchMyLists });
  const lists = listsQuery.data ?? [];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Lists</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New list"
          onPress={() => setCreating(true)}
          style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}>
          <Plus color={KueColors.accent} size={13} strokeWidth={2.2} />
          <Text style={styles.newLabel}>New list</Text>
        </Pressable>
      </View>

      {listsQuery.isPending ? (
        <View style={styles.card}>
          <View style={styles.skeleton} />
        </View>
      ) : lists.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No lists yet.</Text>
          <Text style={styles.emptyBody}>
            Group favourites, rank a year, or keep a watchlist — start with a name.
          </Text>
        </View>
      ) : (
        <View style={styles.stack}>
          {lists.map((list) => {
            const { label, Icon } = visibilityMeta(list);
            return (
              <Pressable
                key={list.id}
                accessibilityRole="button"
                accessibilityLabel={`Open list ${list.name}`}
                onPress={() =>
                  router.push({ pathname: '/lists/[id]', params: { id: String(list.id) } })
                }
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.listName} numberOfLines={1}>
                    {list.name}
                  </Text>
                  <View style={styles.meta}>
                    <Icon color={KueColors.ink3} size={11} strokeWidth={1.8} />
                    <Text style={styles.metaText}>
                      {list.itemCount} {list.itemCount === 1 ? 'title' : 'titles'} · {label}
                    </Text>
                  </View>
                </View>

                {list.description ? (
                  <Text style={styles.description} numberOfLines={2}>
                    {list.description}
                  </Text>
                ) : null}

                {(list.previewCoverImages ?? []).length > 0 ? (
                  <View style={styles.previewRow}>
                    {(list.previewCoverImages ?? []).slice(0, 5).map((image, index) => (
                      <View key={`${image}-${index}`} style={styles.previewThumb}>
                        <Image
                          source={{ uri: image }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}

      {creating ? (
        <ListEditor
          list={null}
          onClose={() => setCreating(false)}
          onSaved={(saved) => {
            void queryClient.invalidateQueries({ queryKey: ['my-lists'] });
            router.push({ pathname: '/lists/[id]', params: { id: String(saved.id) } });
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: KueSpacing.sm,
  },
  header: {
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
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  newLabel: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stack: {
    gap: KueSpacing.sm,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.md,
    gap: KueSpacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: KueSpacing.sm,
  },
  listName: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  description: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 4,
  },
  previewThumb: {
    width: 30,
    height: 40,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: KueColors.surface3,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    backgroundColor: KueColors.surface2,
    padding: KueSpacing.lg,
    gap: KueSpacing.xs,
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
  skeleton: {
    height: 12,
    width: '55%',
    borderRadius: 6,
    backgroundColor: KueColors.surface3,
  },
  pressed: {
    opacity: 0.7,
  },
});
