import React, { useState } from "react";
import "./PendingBalanceModal.css";

type Tab = "past" | "upcoming";

type Props = {
  open: boolean;
  onClose: () => void;
  past: {
    total: number;
    online: number;
    offline: number;
  };
  upcoming: {
    total: number;
    online: number;
    offline: number;
  };
};

const currency = (v: number): string =>
  "₹" +
  Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const PendingBalanceModal: React.FC<Props> = ({
  open,
  onClose,
  past,
  upcoming,
}) => {
  const [tab, setTab] = useState<Tab>("past");

  if (!open) return null;

  const active = tab === "past" ? past : upcoming;
  const total = active.total || 0;
  const onlinePct = total ? Math.round((active.online / total) * 100) : 0;
  const offlinePct = total ? 100 - onlinePct : 0;

  return (
    <div className="pt-modal-backdrop" onClick={onClose}>
      <div
        className="pt-modal pt-pending-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-pending-tabs">
          <button
            className={`pt-pending-tab ${
              tab === "past" ? "pt-pending-tab--active" : ""
            }`}
            onClick={() => setTab("past")}
          >
            📅 Past Bookings
          </button>
          <button
            className={`pt-pending-tab ${
              tab === "upcoming" ? "pt-pending-tab--active" : ""
            }`}
            onClick={() => setTab("upcoming")}
          >
            🚀 Upcoming
          </button>
        </div>

        <div className="pt-pending-hero">
          <div className="pt-pending-chip">
            {tab === "past" ? "📅 PAST BOOKINGS" : "🚀 UPCOMING"}
          </div>
          <div className="pt-pending-hero-label">
            Total Pending Balance
          </div>
          <div className="pt-pending-hero-value">
            {currency(active.total)}
          </div>

          <div className="pt-pending-progress">
            <div className="pt-pending-progress-fill" />
          </div>

          <div className="pt-pending-progress-row">
            <span>Collection Progress</span>
            <span>100.0%</span>
          </div>
        </div>

        <div className="pt-pending-pair">
          <div className="pt-pending-tile">
            <div className="pt-pending-tile-icon">📶</div>
            <div className="pt-pending-tile-label">Online Pending</div>
            <div className="pt-pending-tile-value">
              {currency(active.online)}
            </div>
            <div className="pt-pending-tile-badge">Pending</div>
          </div>

          <div className="pt-pending-tile">
            <div className="pt-pending-tile-icon">🏬</div>
            <div className="pt-pending-tile-label">Offline Pending</div>
            <div className="pt-pending-tile-value">
              {currency(active.offline)}
            </div>
            <div className="pt-pending-tile-badge">Pending</div>
          </div>
        </div>

        <div className="pt-pending-analytics">
          <h4>📊 Analytics</h4>
          <div className="pt-pending-analytics-pair">
            <div className="pt-pending-analytics-box">
              <div className="pt-pending-analytics-value">
                {onlinePct}%
              </div>
              <div className="pt-pending-analytics-label">Online %</div>
            </div>
            <div className="pt-pending-analytics-box">
              <div className="pt-pending-analytics-value">
                {offlinePct}%
              </div>
              <div className="pt-pending-analytics-label">Offline %</div>
            </div>
          </div>
        </div>

        <button className="pt-modal-close-fab" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default PendingBalanceModal;