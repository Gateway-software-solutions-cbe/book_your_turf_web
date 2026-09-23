import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getPartnerNotificationHistory } from "../api/partner/notifications";
import type { PartnerNotification } from "../types/partner/notification";
import { usePartnerAuth } from "./PartnerAuthContext";

interface PartnerNotificationsContextValue {
  notifications: PartnerNotification[];
  total: number;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAllRead: () => void;
  refresh: () => Promise<void>;
}

const PartnerNotificationsContext = createContext<
  PartnerNotificationsContextValue | undefined
>(undefined);

const PAGE_SIZE = 20;
const LAST_SEEN_KEY = "partner_notifications_last_seen";

export const PartnerNotificationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isAuthenticated } = usePartnerAuth();

  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() =>
    localStorage.getItem(LAST_SEEN_KEY),
  );

  // ─── Fetch a page ──────────────────────────────────────
  const fetchNotifications = useCallback(
    async (reset = true) => {
      if (!isAuthenticated) return;

      const currentOffset = reset ? 0 : offset;
      setLoading(true);
      setError(null);

      try {
        const res = await getPartnerNotificationHistory({
          limit: PAGE_SIZE,
          offset: currentOffset,
        });

        const incoming = res.data.notifications ?? [];

        if (reset) {
          setNotifications(incoming);
          setOffset(incoming.length);
        } else {
          setNotifications((prev) => [...prev, ...incoming]);
          setOffset((prev) => prev + incoming.length);
        }
        setTotal(res.data.total ?? incoming.length);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, offset],
  );

  // ─── Load more ─────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loading) return;
    if (notifications.length >= total) return;
    await fetchNotifications(false);
  }, [loading, notifications.length, total, fetchNotifications]);

  // ─── Refresh (reset) ───────────────────────────────────
  const refresh = useCallback(async () => {
    await fetchNotifications(true);
  }, [fetchNotifications]);

  // ─── Unread count ──────────────────────────────────────
  const unreadCount = useMemo(() => {
    if (!lastSeenAt) {
      // Never opened → all are unread
      return notifications.length;
    }
    const seenTime = new Date(lastSeenAt).getTime();
    return notifications.filter(
      (n) => new Date(n.sent_at).getTime() > seenTime,
    ).length;
  }, [notifications, lastSeenAt]);

  const hasMore = notifications.length < total;

  // ─── Mark read ─────────────────────────────────────────
  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_KEY, now);
    setLastSeenAt(now);
  }, []);

  // ─── Auto-load on login ────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(true);
    } else {
      setNotifications([]);
      setTotal(0);
      setOffset(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <PartnerNotificationsContext.Provider
      value={{
        notifications,
        total,
        unreadCount,
        loading,
        error,
        hasMore,
        fetchNotifications,
        loadMore,
        markAllRead,
        refresh,
      }}
    >
      {children}
    </PartnerNotificationsContext.Provider>
  );
};

export const usePartnerNotifications = () => {
  const ctx = useContext(PartnerNotificationsContext);
  if (!ctx)
    throw new Error(
      "usePartnerNotifications must be used within PartnerNotificationsProvider",
    );
  return ctx;
};