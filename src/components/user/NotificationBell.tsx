// src/components/user/NotificationBell.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import {
  notificationIcon,
  notificationAccent,
  formatRelativeTime,
} from '../../utils/notificationUtils';
import './NotificationBell.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { recent, unreadCount, isLoading, markViewed } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenPreview = () => {
    setOpen((v) => !v);
  };

  const handleViewAll = () => {
    setOpen(false);
    markViewed();
    navigate('/notifications');
  };

  return (
    <div className="notif-bell" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell__btn"
        onClick={handleOpenPreview}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <i className="bi bi-bell" />
        {unreadCount > 0 && (
          <span className="notif-bell__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-bell__dropdown">
          <div className="notif-bell__header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="notif-bell__header-count">{unreadCount} new</span>
            )}
          </div>

          <div className="notif-bell__body">
            {isLoading && recent.length === 0 && (
              <div className="notif-bell__loading">
                <div className="spinner-border spinner-border-sm text-success" role="status" />
              </div>
            )}

            {!isLoading && recent.length === 0 && (
              <div className="notif-bell__empty">
                <i className="bi bi-bell-slash" />
                <p>No notifications yet</p>
              </div>
            )}

            {recent.slice(0, 5).map((n) => {
              const accent = notificationAccent(n.notification_type, n.status);
              return (
                <div
                  key={n.id}
                  className="notif-bell__item"
                  onClick={handleViewAll}
                >
                  <div className={`notif-bell__icon notif-bell__icon--${accent}`}>
                    <i className={`bi bi-${notificationIcon(n.notification_type)}`} />
                  </div>
                  <div className="notif-bell__content">
                    <div className="notif-bell__title">{n.title}</div>
                    <div className="notif-bell__text">{n.body}</div>
                    <div className="notif-bell__time">{formatRelativeTime(n.sent_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="notif-bell__view-all"
            onClick={handleViewAll}
          >
            View all notifications <i className="bi bi-arrow-right" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;