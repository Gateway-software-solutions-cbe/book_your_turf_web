import React from "react";
import type { PartnerNotification } from "../../types/partner/notification";
import "./NotificationDropdown.css";

interface Props {
  notifications: PartnerNotification[];
  loading: boolean;
  onViewAll: () => void;
}

const typeIcon = (type: string): string => {
  if (type.includes("booking_confirmed")) return "📅";
  if (type.includes("booking_cancelled")) return "❌";
  if (type.includes("payment")) return "💰";
  if (type.includes("turf_approved")) return "✅";
  if (type.includes("turf_rejected")) return "⚠️";
  return "🔔";
};

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const NotificationDropdown: React.FC<Props> = ({
  notifications,
  loading,
  onViewAll,
}) => {
  return (
    <div className="ptn-drop">
      <div className="ptn-drop-header">
        <h3>Notifications</h3>
      </div>

      <div className="ptn-drop-body">
        {loading && notifications.length === 0 && (
          <div className="ptn-drop-empty">
            <span className="ptn-drop-spinner" />
            <span>Loading...</span>
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="ptn-drop-empty">
            <span className="ptn-drop-empty-icon">🔔</span>
            <p>No notifications yet</p>
          </div>
        )}

        {notifications.map((n) => (
          <div key={n.id} className="ptn-drop-item">
            <div className="ptn-drop-item-icon">
              {typeIcon(n.notification_type)}
            </div>
            <div className="ptn-drop-item-body">
              <div className="ptn-drop-item-top">
                <span className="ptn-drop-item-title">{n.title}</span>
                <span className="ptn-drop-item-time">
                  {relativeTime(n.sent_at)}
                </span>
              </div>
              <p className="ptn-drop-item-text">{n.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ptn-drop-footer">
        <button className="ptn-drop-viewall" onClick={onViewAll}>
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;