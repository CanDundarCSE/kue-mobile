import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/auth-context';
import {
  onNotification,
  onUnreadCount,
  startNotificationHub,
  stopNotificationHub,
} from '@/lib/notifications/hub';

/** Keeps the SignalR connection and the notification queries in sync. */
export function NotificationsRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      void stopNotificationHub();
      return;
    }

    void startNotificationHub(user.id).catch(() => {
      // Reconnect attempts continue while the user stays signed in.
    });

    return () => {
      void stopNotificationHub();
    };
  }, [user]);

  useEffect(() => {
    const offItem = onNotification(() => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    });
    const offCount = onUnreadCount((count) => {
      queryClient.setQueryData(['notifications-unread'], count);
    });

    return () => {
      offItem();
      offCount();
    };
  }, [queryClient]);

  return null;
}
