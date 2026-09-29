// src/pages/user/NotificationsPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import { listNotifications } from '../../api/user/notifications';
import type { AppNotification } from '../../types/user/notification';
import {
  notificationIcon,
  notificationAccent,
  formatRelativeTime,
  formatAbsoluteTime,
} from '../../utils/notificationUtils';
import './style/NotificationsPage.css';

const PAGE_SIZE = 20;

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { markViewed, refresh: refreshBell } = useNotifications();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (currentOffset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await listNotifications({
          limit: PAGE_SIZE,
          offset: currentOffset,
        });

        if (res.result === 'success' && res.data) {
          const list = res.data.notifications;
          setNotifications((prev) => (append ? [...prev, ...list] : list));
          setTotal(res.data.total);
          setOffset(currentOffset + list.length);
        } else {
          setError(res.message || 'Failed to load notifications');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Something went wrong');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Initial load + mark viewed
  useEffect(() => {
    fetchPage(0, false);
    markViewed();
    refreshBell();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    if (loadingMore) return;
    fetchPage(offset, true);
  };

  const handleRetry = () => {
    fetchPage(0, false);
  };

  const hasMore = notifications.length < total;

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-page__header">
        <div>
          <h1>Notifications</h1>
          <p>Your recent activity from the last week</p>
        </div>
        {total > 0 && (
          <span className="notifications-page__count">
            {total} {total === 1 ? 'notification' : 'notifications'}
          </span>
        )}
      </div>

      {/* Loading initial */}
      {loading && (
        <div className="notifications-page__loading">
          <div className="spinner-border text-success" role="status" />
          <p>Loading notifications...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="notifications-page__error">
          <i className="bi bi-exclamation-triangle-fill" />
          <p>{error}</p>
          <button onClick={handleRetry}>Retry</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && notifications.length === 0 && (
        <div className="notifications-page__empty">
          <div className="notifications-page__empty-icon">
            <i className="bi bi-bell-slash" />
          </div>
          <h3>You're all caught up</h3>
          <p>No notifications in the past week.</p>
          <button onClick={() => navigate('/turfs')}>
            <i className="bi bi-search" /> Browse Turfs
          </button>
        </div>
      )}

      {/* List */}
      {!loading && !error && notifications.length > 0 && (
        <>
          <div className="notifications-page__list">
            {notifications.map((n) => {
              const accent = notificationAccent(n.notification_type, n.status);
              return (
                <div
                  key={n.id}
                  className={`notif-row notif-row--${accent}`}
                >
                  <div className={`notif-row__icon notif-row__icon--${accent}`}>
                    <i className={`bi bi-${notificationIcon(n.notification_type)}`} />
                  </div>

                  <div className="notif-row__body">
                    <div className="notif-row__title">{n.title}</div>
                    <div className="notif-row__text">{n.body}</div>
                    <div className="notif-row__meta">
                      <span className="notif-row__relative">
                        {formatRelativeTime(n.sent_at)}
                      </span>
                      <span className="notif-row__dot">·</span>
                      <span className="notif-row__absolute">
                        {formatAbsoluteTime(n.sent_at)}
                      </span>
                    </div>
                  </div>

                  <span className={`notif-row__status notif-row__status--${n.status}`}>
                    {n.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="notifications-page__load-more">
              <button onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-down-circle" />
                    Load more
                  </>
                )}
              </button>
              <span className="notifications-page__load-more-info">
                Showing {notifications.length} of {total}
              </span>
            </div>
          )}

          {!hasMore && notifications.length > 0 && (
            <div className="notifications-page__end-message">
              🎉 You've seen all {total} notification{total !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsPage;