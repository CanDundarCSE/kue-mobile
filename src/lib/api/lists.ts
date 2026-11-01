import { apiJson } from '@/lib/auth/session';

export type CustomList = {
  id: number;
  userId?: number;
  username?: string;
  name: string;
  description?: string | null;
  visibility: string;
  isPublic: boolean;
  itemCount: number;
  previewCoverImages?: string[];
};

export type CustomListItem = {
  id: number;
  listId: number;
  mediaId: number;
  order: number;
  notes?: string | null;
  media: {
    id: number;
    title: string;
    mediaType: string;
    coverImage?: string | null;
    year?: number | null;
  };
};

export type CustomListDetail = CustomList & { items: CustomListItem[] };

export type ListVisibility = 'public' | 'friends' | 'private';

export type ListPayload = {
  name: string;
  description?: string | null;
  visibility: ListVisibility;
};

export async function fetchMyLists(): Promise<CustomList[]> {
  const data = await apiJson<{ items?: CustomList[] }>('/me/lists?pageSize=50');
  return data.items ?? [];
}

export function fetchListDetail(listId: number): Promise<CustomListDetail> {
  return apiJson<CustomListDetail>(`/me/lists/${listId}`);
}

/** A list another user shared with you (public or friends-visible). */
export function fetchPublicListDetail(listId: number): Promise<CustomListDetail> {
  return apiJson<CustomListDetail>(`/lists/${listId}`);
}

export function updateListItemNotes(
  listId: number,
  mediaId: number,
  notes: string | null,
): Promise<unknown> {
  return apiJson(`/me/lists/${listId}/items/${mediaId}`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  });
}

export function reorderListItems(listId: number, mediaIds: number[]): Promise<unknown> {
  return apiJson(`/me/lists/${listId}/reorder`, {
    method: 'POST',
    body: JSON.stringify({ mediaIds }),
  });
}

export function createList(payload: ListPayload): Promise<CustomList> {
  return apiJson<CustomList>('/me/lists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateList(listId: number, payload: ListPayload): Promise<CustomList> {
  return apiJson<CustomList>(`/me/lists/${listId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteList(listId: number): Promise<unknown> {
  return apiJson(`/me/lists/${listId}`, { method: 'DELETE' });
}

export function addListItem(listId: number, mediaId: number): Promise<unknown> {
  return apiJson(`/me/lists/${listId}/items`, {
    method: 'POST',
    body: JSON.stringify({ mediaId }),
  });
}

export function removeListItem(listId: number, mediaId: number): Promise<unknown> {
  return apiJson(`/me/lists/${listId}/items/${mediaId}`, { method: 'DELETE' });
}
