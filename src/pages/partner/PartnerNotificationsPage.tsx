import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerNotifications } from "../../context/PartnerNotificationsContext";
import type { PartnerNotification } from "../../types/partner/notification";
import "./PartnerNotificationsPage.css";

const typeIcon = (type: string): string => {
  if (type.includes("booking_confirmed")) return "📅";
  if (type.includes("booking_cancelled")) return "❌";
  if (type.includes("payment")) return "💰";
  if (type.includes("turf_approved")) return "✅";
  if (type.includes("turf_rejected")) return "⚠️";
  return "🔔";
};

const typeLabel = (type: string): string => {
  if (type.includes("booking_confirmed")) return "Booking";
  if (type.includes("booking_cancelled")) return "Cancelled";
  if (type.includes("payment")) return "Payment";
  if (type.includes("turf_approved")) return "Turf Approved";
  if (type.includes("turf_rejected")) return "Turf Rejected";
  return "Update";
};

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const groupByDay = (
  notifications: PartnerNotification[],
): Record<string, PartnerNotification[]> => {
  const groups: Record<string, PartnerNotification[]> = {};
  notifications.forEach((n) => {
    const d = new Date(n.sent_at);
    const key = d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
};

const PartnerNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    total,
    loading,
    error,
    hasMore,
    loadMore,
    markAllRead,
    refresh,
  } = usePartnerNotifications();

  // Mark all as read when the page opens
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const grouped = groupByDay(notifications);

  return (
    <div className="ptn-page">
      {/* Header */}
      <header className="ptn-page-header">
        <button
          className="ptn-page-back"
          onClick={() => navigate("/partner/dashboard")}
          aria-label="Back"
        >
          ‹
        </button>
        <div className="ptn-page-header-body">
          <h1>Notifications</h1>
          <p>{total} update{total === 1 ? "" : "s"} in the last week</p>
        </div>
        <button
          className="ptn-page-refresh"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh"
        >
          ⟳
        </button>
      </header>

      {error && <div className="pt-auth-error">{error}</div>}

      {/* Empty */}
      {!loading && !error && notifications.length === 0 && (
        <div className="ptn-page-empty">
          <div className="ptn-page-empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>
            Booking, payment, and turf approval updates will appear here.
          </p>
        </div>
      )}

      {/* Loading (first page) */}
      {loading && notifications.length === 0 && (
        <div className="ptn-page-loading">Loading...</div>
      )}

      {/* Grouped list */}
      {notifications.length > 0 && (
        <div className="ptn-page-groups">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} className="ptn-page-group">
              <h3 className="ptn-page-group-title">{dateLabel}</h3>
              {items.map((n) => (
                <div key={n.id} className="ptn-page-card">
                  <div className="ptn-page-card-icon">
                    {typeIcon(n.notification_type)}
                  </div>
                  <div className="ptn-page-card-body">
                    <div className="ptn-page-card-top">
                      <span className="ptn-page-card-type">
                        {typeLabel(n.notification_type)}
                      </span>
                      <span className="ptn-page-card-time">
                        {new Date(n.sent_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <h4 className="ptn-page-card-title">{n.title}</h4>
                    <p className="ptn-page-card-text">{n.body}</p>
                    <span className="ptn-page-card-date">
                      {formatDateTime(n.sent_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <button
              className="ptn-page-more"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          )}

          {!hasMore && notifications.length > 0 && (
            <p className="ptn-page-end">You've reached the end</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerNotificationsPage;