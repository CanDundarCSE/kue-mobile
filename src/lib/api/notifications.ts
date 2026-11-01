import { apiJson } from '@/lib/auth/session';

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actorUsername?: string | null;
  referenceId?: number | null;
  referenceType?: string | null;
};

type Paged<T> = { items?: T[]; totalItems?: number; totalPages?: number; page?: number };

export async function fetchNotifications(page = 1, pageSize = 30): Promise<{
  items: NotificationItem[];
  totalItems: number;
  totalPages: number;
}> {
  const data = await apiJson<Paged<NotificationItem>>(
    `/me/notifications?page=${page}&pageSize=${pageSize}`,
  );
  return {
    items: data.items ?? [],
    totalItems: data.totalItems ?? (data.items?.length ?? 0),
    totalPages: data.totalPages ?? 0,
  };
}

export async function fetchHubToken(): Promise<string> {
  const data = await apiJson<{ token?: string }>('/me/hub-token', { method: 'POST' });
  if (!data.token) throw new Error('Hub authentication returned an invalid token.');
  return data.token;
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await apiJson<{ count?: number; unreadCount?: number }>(
    '/me/notifications/unread-count',
  );
  return data.count ?? data.unreadCount ?? 0;
}

export function markNotificationRead(id: number): Promise<unknown> {
  return apiJson(`/me/notifications/${id}/read`, { method: 'PUT' });
}

export function markAllNotificationsRead(): Promise<unknown> {
  return apiJson('/me/notifications/read-all', { method: 'PUT' });
}

export function deleteNotification(id: number): Promise<unknown> {
  return apiJson(`/me/notifications/${id}`, { method: 'DELETE' });
}

export function clearNotifications(): Promise<unknown> {
  return apiJson('/me/notifications', { method: 'DELETE' });
}
