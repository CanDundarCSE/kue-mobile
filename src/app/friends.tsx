import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QrCode, Search, UserMinus, UserPlus, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/bottom-sheet';
import { Skeleton } from '@/components/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';
import { AddFriendSheet } from '@/features/friends/add-friend-sheet';
import { MyCodeSheet } from '@/features/friends/my-code-sheet';
import { QrScanner } from '@/features/friends/qr-scanner';
import {
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  removeFriend,
  respondToRequest,
  sendFriendRequestByKueId,
  type Friend,
} from '@/lib/api/friends';
import { useAuth } from '@/lib/auth/auth-context';
import { useResponsive } from '@/lib/responsive';

type Tab = 'friends' | 'requests' | 'sent';

const TABS: { id: Tab; label: string }[] = [
  { id: 'friends', label: 'Friends' },
  { id: 'requests', label: 'Requests' },
  { id: 'sent', label: 'Sent' },
];

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { contentWidth, gutter } = useResponsive();

  const friendsQuery = useQuery({ queryKey: ['friends'], queryFn: fetchFriends });
  const incomingQuery = useQuery({
    queryKey: ['friends-incoming'],
    queryFn: fetchIncomingRequests,
  });
  const outgoingQuery = useQuery({
    queryKey: ['friends-outgoing'],
    queryFn: fetchOutgoingRequests,
  });

  const [tab, setTab] = useState<Tab>('friends');
  const [search, setSearch] = useState('');
  const [codeOpen, setCodeOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Friend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const friends = friendsQuery.data ?? [];
  const incoming = incomingQuery.data ?? [];
  const outgoing = outgoingQuery.data ?? [];
  const kueId = user?.kueId ?? '';

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['friends'] }),
      queryClient.invalidateQueries({ queryKey: ['friends-incoming'] }),
      queryClient.invalidateQueries({ queryKey: ['friends-outgoing'] }),
    ]);
  };

  const perform = async (key: string, action: () => Promise<unknown>, done?: string) => {
    if (acting) return;
    setActing(key);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (done) setNotice(done);
      await refreshAll();
    } catch (cause) {
      setError(errorMessage(cause, 'Something went wrong. Please try again.'));
    } finally {
      setActing(null);
    }
  };

  const handleScanned = async (scannedId: string) => {
    setScanning(false);
    setActing('scan');
    setError(null);
    setNotice(null);
    try {
      await sendFriendRequestByKueId(scannedId);
      setNotice(`Friend request sent to ${scannedId}.`);
      await refreshAll();
    } catch (cause) {
      setError(errorMessage(cause, 'Could not send that request.'));
    } finally {
      setActing(null);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const friend = removing;
    setRemoving(null);
    await perform(`friend-${friend.userId}`, () => removeFriend(friend.username));
  };

  const needle = search.trim().toLowerCase();
  const filteredFriends = needle
    ? friends.filter(
        (friend) =>
          friend.username.toLowerCase().includes(needle) ||
          (friend.kueId ?? '').toLowerCase().includes(needle),
      )
    : friends;

  const counts: Record<Tab, number> = {
    friends: friends.length,
    requests: incoming.length,
    sent: outgoing.length,
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={friendsQuery.isRefetching && !friendsQuery.isPending}
              onRefresh={() => {
                void friendsQuery.refetch();
                void incomingQuery.refetch();
                void outgoingQuery.refetch();
              }}
              tintColor={KueColors.ink3}
              colors={[KueColors.accent]}
            />
          }>
          <View style={styles.topRow}>
            <Text style={styles.title}>
              Your circle<Text style={styles.accent}>.</Text>
            </Text>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="My QR code"
                onPress={() => setCodeOpen(true)}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <QrCode color={KueColors.ink2} size={18} strokeWidth={1.8} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a friend"
                onPress={() => setAddOpen(true)}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <UserPlus color={KueColors.accent} size={18} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>

          {tab === 'friends' ? (
            <View style={styles.searchField}>
              <Search color={KueColors.ink3} size={15} strokeWidth={2} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search friends"
                placeholderTextColor={KueColors.ink3}
                autoCorrect={false}
                style={styles.searchInput}
                accessibilityLabel="Search friends"
              />
              {search.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                  onPress={() => setSearch('')}>
                  <X color={KueColors.ink3} size={14} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.segmented}>
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${item.label}, ${counts[item.id]}`}
                  onPress={() => setTab(item.id)}
                  style={styles.segment}>
                  <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.segmentCount, active && styles.segmentCountActive]}>
                    {counts[item.id]}
                  </Text>
                  <View style={[styles.segmentUnderline, active && styles.segmentUnderlineActive]} />
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          {tab === 'friends' ? (
            <>
              {incoming.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${incoming.length} pending requests`}
                  onPress={() => setTab('requests')}
                  style={({ pressed }) => [styles.requestsStrip, pressed && styles.pressed]}>
                  <View style={styles.avatarStack}>
                    {incoming.slice(0, 4).map((request, index) => (
                      <View key={request.id} style={[styles.stackItem, index > 0 && styles.stackOverlap]}>
                        <UserAvatar
                          username={request.requesterUsername}
                          avatarId={request.requesterAvatarId}
                          size={30}
                        />
                      </View>
                    ))}
                  </View>
                  <Text style={styles.requestsStripText}>
                    {incoming.length} pending {incoming.length === 1 ? 'request' : 'requests'}
                  </Text>
                  <Text style={styles.requestsStripAction}>Review</Text>
                </Pressable>
              ) : null}

              {friendsQuery.isPending ? (
                <View style={styles.list}>
                  {[0, 1, 2, 3].map((row) => (
                    <View key={row} style={styles.row}>
                      <Skeleton width={44} height={44} radius={22} />
                      <View style={styles.rowBody}>
                        <Skeleton width="45%" height={12} />
                        <Skeleton width="28%" height={8} radius={4} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : friendsQuery.isError ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void friendsQuery.refetch()}
                  style={styles.empty}>
                  <Text style={styles.emptyText}>Couldn&apos;t load your friends — tap to retry.</Text>
                </Pressable>
              ) : filteredFriends.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>
                    {search ? 'No friends match that search.' : 'No friends yet.'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {search
                      ? 'Try a different name or Kue ID.'
                      : 'Share your code so people can add you.'}
                  </Text>
                  {!search ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setCodeOpen(true)}
                      style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}>
                      <QrCode color={KueColors.accent} size={14} strokeWidth={1.8} />
                      <Text style={styles.emptyActionLabel}>Show my code</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <View style={styles.list}>
                  {filteredFriends.map((friend) => (
                    <View key={friend.friendshipId} style={styles.row}>
                      <UserAvatar username={friend.username} avatarId={friend.avatarId} size={44} />
                      <View style={styles.rowBody}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {friend.username}
                        </Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {friend.kueId ?? 'Friend'}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Manage ${friend.username}`}
                        hitSlop={6}
                        onPress={() => {
                          setNotice(null);
                          setRemoving(friend);
                        }}
                        style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
                        <UserMinus color={KueColors.ink3} size={18} strokeWidth={1.8} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}

          {tab === 'requests' ? (
            incomingQuery.isPending ? (
              <View style={styles.list}>
                {[0, 1].map((row) => (
                  <View key={row} style={styles.row}>
                    <Skeleton width={44} height={44} radius={22} />
                    <View style={styles.rowBody}>
                      <Skeleton width="45%" height={12} />
                      <Skeleton width="30%" height={8} radius={4} />
                    </View>
                  </View>
                ))}
              </View>
            ) : incoming.length === 0 ? (
              <EmptyState
                title="No requests right now."
                body="When someone adds you by your Kue ID, their request shows up here."
              />
            ) : (
              <View style={styles.list}>
                {incoming.map((request) => (
                  <View key={request.id} style={styles.row}>
                    <UserAvatar
                      username={request.requesterUsername}
                      avatarId={request.requesterAvatarId}
                      size={44}
                    />
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {request.requesterUsername}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        Wants to be friends
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Accept ${request.requesterUsername}`}
                      disabled={acting !== null}
                      onPress={() =>
                        void perform(
                          `in-${request.id}`,
                          () => respondToRequest(request.id, 'accept'),
                          'You are now friends.',
                        )
                      }
                      style={({ pressed }) => [
                        styles.confirmButton,
                        pressed && styles.pressed,
                        acting !== null && styles.disabled,
                      ]}>
                      {acting === `in-${request.id}` ? (
                        <ActivityIndicator color={KueColors.background} size="small" />
                      ) : (
                        <Text style={styles.confirmLabel}>Confirm</Text>
                      )}
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Decline ${request.requesterUsername}`}
                      disabled={acting !== null}
                      hitSlop={6}
                      onPress={() =>
                        void perform(`decline-${request.id}`, () =>
                          respondToRequest(request.id, 'decline'),
                        )
                      }
                      style={({ pressed }) => [styles.declineButton, pressed && styles.pressed]}>
                      <X color={KueColors.ink3} size={16} strokeWidth={2} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )
          ) : null}

          {tab === 'sent' ? (
            outgoingQuery.isPending ? (
              <View style={styles.list}>
                {[0, 1].map((row) => (
                  <View key={row} style={styles.row}>
                    <Skeleton width={44} height={44} radius={22} />
                    <View style={styles.rowBody}>
                      <Skeleton width="45%" height={12} />
                      <Skeleton width="30%" height={8} radius={4} />
                    </View>
                  </View>
                ))}
              </View>
            ) : outgoing.length === 0 ? (
              <EmptyState
                title="Nothing sent yet."
                body="Requests you send from a Kue ID or a scanned code appear here."
              />
            ) : (
              <View style={styles.list}>
                {outgoing.map((request) => (
                  <View key={request.id} style={styles.row}>
                    <UserAvatar
                      username={request.addresseeUsername}
                      avatarId={request.addresseeAvatarId}
                      size={44}
                    />
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {request.addresseeUsername}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        Waiting for a reply
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Cancel request to ${request.addresseeUsername}`}
                      disabled={acting !== null}
                      onPress={() =>
                        void perform(`out-${request.id}`, () =>
                          removeFriend(request.addresseeUsername),
                        )
                      }
                      style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                      <Text style={styles.cancelLabel}>Cancel</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <MyCodeSheet visible={codeOpen} onClose={() => setCodeOpen(false)} kueId={kueId} />

      <AddFriendSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onScan={() => {
          setAddOpen(false);
          setScanning(true);
        }}
        onChanged={() => void refreshAll()}
      />

      {scanning ? (
        <QrScanner
          onClose={() => setScanning(false)}
          onScanned={(scannedId) => void handleScanned(scannedId)}
        />
      ) : null}

      <BottomSheet visible={removing !== null} onClose={() => setRemoving(null)}>
        <Text style={styles.sheetTitle}>Remove friend?</Text>
        <Text style={styles.sheetBody}>
          You and {removing?.username ?? 'this person'} will no longer be friends. You can add
          each other again later with a Kue ID.
        </Text>
        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Keep friend"
            onPress={() => setRemoving(null)}
            style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}>
            <Text style={styles.keepLabel}>Keep</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove friend"
            disabled={acting !== null}
            onPress={() => void confirmRemove()}
            style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
            <Text style={styles.removeLabel}>Remove</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{body}</Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActions: {
    flexDirection: 'row',
    gap: KueSpacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface2,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    height: 44,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 12,
    backgroundColor: KueColors.surface2,
  },
  searchInput: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    paddingVertical: 0,
  },
  segmented: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
  },
  segmentLabel: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  segmentLabelActive: {
    color: KueColors.foreground,
  },
  segmentCount: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
  },
  segmentCountActive: {
    color: KueColors.accent,
  },
  segmentUnderline: {
    position: 'absolute',
    left: KueSpacing.lg,
    right: KueSpacing.lg,
    bottom: -StyleSheet.hairlineWidth,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  segmentUnderlineActive: {
    backgroundColor: KueColors.accent,
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
  requestsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.sm,
    padding: KueSpacing.md,
    borderRadius: 14,
    backgroundColor: KueColors.surface2,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackItem: {
    borderRadius: 15,
  },
  stackOverlap: {
    marginLeft: -10,
  },
  requestsStripText: {
    flex: 1,
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 13,
  },
  requestsStripAction: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  list: {
    marginTop: -KueSpacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KueSpacing.md,
    minHeight: 64,
    paddingVertical: KueSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansMedium,
    fontSize: 14,
  },
  rowMeta: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    minWidth: 84,
    minHeight: 38,
    borderRadius: 9,
    backgroundColor: KueColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.md,
  },
  confirmLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 12,
  },
  declineButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    minHeight: 38,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    color: KueColors.ink2,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  removeButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: KueColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: {
    color: KueColors.background,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    gap: KueSpacing.sm,
    paddingVertical: KueSpacing.xxl,
    paddingHorizontal: KueSpacing.lg,
  },
  emptyTitle: {
    color: KueColors.ink2,
    fontFamily: KueFonts.serif,
    fontSize: 20,
    textAlign: 'center',
  },
  emptyText: {
    color: KueColors.ink3,
    fontFamily: KueFonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: KueSpacing.xs,
    minHeight: 38,
    paddingHorizontal: KueSpacing.md,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
  },
  emptyActionLabel: {
    color: KueColors.accent,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
