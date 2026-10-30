import { apiJson } from '@/lib/auth/session';

export type Friend = {
  friendshipId: number;
  userId: number;
  username: string;
  kueId?: string | null;
  bio?: string | null;
  avatarId?: string | null;
  friendsSince: string;
};

export type FriendRequest = {
  id: number;
  requesterId: number;
  requesterUsername: string;
  requesterKueId?: string | null;
  requesterAvatarId?: string | null;
  addresseeId: number;
  addresseeUsername: string;
  addresseeKueId?: string | null;
  addresseeAvatarId?: string | null;
  status: string;
  createdAt: string;
};

export type PublicProfile = {
  id: number;
  username: string;
  kueId?: string | null;
  avatarId?: string | null;
  bio?: string | null;
  isPrivate: boolean;
  isFriend: boolean;
  friendshipStatus: string;
};

type Message = { message?: string };

export function fetchFriends(): Promise<Friend[]> {
  return apiJson<Friend[]>('/friends');
}

export function fetchIncomingRequests(): Promise<FriendRequest[]> {
  return apiJson<FriendRequest[]>('/friends/requests/incoming');
}

export function fetchOutgoingRequests(): Promise<FriendRequest[]> {
  return apiJson<FriendRequest[]>('/friends/requests/outgoing');
}

export function lookupByKueId(kueId: string): Promise<PublicProfile> {
  return apiJson<PublicProfile>(`/users/by-kueid/${encodeURIComponent(kueId.trim())}`);
}

export function sendFriendRequestByKueId(kueId: string): Promise<Message> {
  return apiJson<Message>(`/friends/request/by-kueid/${encodeURIComponent(kueId.trim())}`, {
    method: 'POST',
  });
}

export function respondToRequest(
  requestId: number,
  action: 'accept' | 'decline',
): Promise<unknown> {
  return apiJson(`/friends/requests/${requestId}/${action}`, { method: 'POST' });
}

export function removeFriend(username: string): Promise<Message> {
  return apiJson<Message>(`/friends/${encodeURIComponent(username)}`, { method: 'DELETE' });
}
