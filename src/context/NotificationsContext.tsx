// src/context/NotificationsContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useUserAuth } from './UserAuthContext';
import { listNotifications } from '../api/user/notifications';
import type { AppNotification } from '../types/user/notification';
import {
  getLastViewedAt,
  markNotificationsAsViewed,
} from '../utils/notificationUtils';

interface NotificationsContextValue {
  /** Latest page of notifications (up to 20) */
  recent: AppNotification[];
  /** Total count from the backend */
  total: number;
  /** Unread count since last visit */
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  /** Call this when the user opens /notifications */
  markViewed: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useUserAuth();

  const [recent, setRecent] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const computeUnread = (items: AppNotification[]) => {
    const lastViewed = getLastViewedAt();
    if (!lastViewed) return items.length;    // never opened → all unread
    return items.filter((n) => new Date(n.sent_at).getTime() > lastViewed)
      .length;
  };

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await listNotifications({ limit: 20, offset: 0 });
      if (res.result === 'success' && res.data) {
        setRecent(res.data.notifications);
        setTotal(res.data.total);
        setUnreadCount(computeUnread(res.data.notifications));
      }
    } catch (err) {
      console.error('❌ Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch + refresh on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      setRecent([]);
      setTotal(0);
      setUnreadCount(0);
      return;
    }
    refresh();
  }, [isAuthenticated, refresh]);

  // Poll every 60 seconds so badge stays fresh
  useEffect(() => {
    if (!isAuthenticated) return;
    const t = setInterval(() => refresh(), 60_000);
    return () => clearInterval(t);
  }, [isAuthenticated, refresh]);

  const markViewed = useCallback(() => {
    markNotificationsAsViewed();
    setUnreadCount(0);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        recent,
        total,
        unreadCount,
        isLoading,
        refresh,
        markViewed,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      'useNotifications must be used within <NotificationsProvider>'
    );
  }
  return ctx;
};