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

export type UserProfileCounts = {
  totalLibraryItems: number;
  completedItems: number;
  inProgressItems: number;
  planningItems: number;
  onHoldItems: number;
  droppedItems: number;
  favoritesCount: number;
  listsCount: number;
  ratingsCount: number;
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
  joinedAt?: string;
  counts?: UserProfileCounts | null;
};

type Message = { message?: string };

export function fetchUserProfile(username: string): Promise<PublicProfile> {
  return apiJson<PublicProfile>(`/users/${encodeURIComponent(username.trim())}`);
}

export type UserLibraryEntry = {
  mediaId: number;
  isFavorite: boolean;
  media?: {
    title?: string;
    mediaType?: string;
    coverImage?: string | null;
    year?: number | null;
  } | null;
};

export type UserList = {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  visibility?: string;
  itemCount: number;
  previewCoverImages?: string[];
};

export type UserActivityDay = {
  date: string;
  added: number;
  completed: number;
  total?: number;
};

export async function fetchUserLibrary(username: string): Promise<UserLibraryEntry[]> {
  const data = await apiJson<{ items?: UserLibraryEntry[] }>(
    `/users/${encodeURIComponent(username)}/library?pageSize=100`,
  );
  return data.items ?? [];
}

export async function fetchUserLists(username: string): Promise<UserList[]> {
  const data = await apiJson<{ items?: UserList[] }>(
    `/users/${encodeURIComponent(username)}/lists?pageSize=20`,
  );
  return data.items ?? [];
}

export async function fetchUserActivity(
  username: string,
  days = 30,
): Promise<UserActivityDay[]> {
  const data = await apiJson<{ dailySummaries?: UserActivityDay[] }>(
    `/users/${encodeURIComponent(username)}/activity?days=${days}`,
  );
  return data.dailySummaries ?? [];
}

export function fetchUserFriends(username: string): Promise<Friend[]> {
  return apiJson<Friend[]>(`/users/${encodeURIComponent(username)}/friends`);
}

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
