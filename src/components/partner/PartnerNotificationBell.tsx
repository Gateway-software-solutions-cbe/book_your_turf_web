import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerNotifications } from "../../context/PartnerNotificationsContext";
import NotificationDropdown from "./NotificationDropdown";
import "./PartnerNotificationBell.css";

const PartnerNotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount, notifications, loading, refresh } =
    usePartnerNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      // Refresh when opening the dropdown
      await refresh();
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/partner/notifications");
  };

  const badge =
    unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : null;

  return (
    <div className="ptn-bell-wrap" ref={ref}>
      <button
        className="ptn-bell"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <span className="ptn-bell-icon">🔔</span>
        {badge && <span className="ptn-bell-badge">{badge}</span>}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications.slice(0, 5)}
          loading={loading}
          onViewAll={handleViewAll}
        />
      )}
    </div>
  );
};

export default PartnerNotificationBell;