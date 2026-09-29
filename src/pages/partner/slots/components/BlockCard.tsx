import React from "react";
import type { BlockedSlot } from "../../../../types/partner/slot";
import "./BlockCard.css";

interface Props {
  block: BlockedSlot;
  onRemove: () => void;
}

const sportEmoji = (name: string): string => {
  const g = name.toLowerCase();
  if (g.includes("badminton")) return "🏸";
  if (g.includes("pickle")) return "🏓";
  return "⚽";
};

const to12h = (hhmmss: string): string => {
  const [h, m] = hhmmss.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const BlockCard: React.FC<Props> = ({ block, onRemove }) => {
  const isRepeat = /\(Week \d+ of \d+\)|\(Day \d+ of \d+\)/i.test(block.reason);
  const reasonText = block.reason || "—";

  return (
    <div className="pt-blc-card">
      <div className="pt-blc-top">
        <div className="pt-blc-venue">
          <div className="pt-blc-avatar">{sportEmoji(block.turf_name)}</div>
          <div>
            <div className="pt-blc-venue-name">{block.turf_name}</div>
            <div className="pt-blc-venue-meta">
              <span className="pt-blc-court">Court {block.court_number}</span>
              <span className="pt-blc-sport-chip">Pickleball</span>
            </div>
          </div>
        </div>
        <span className="pt-blc-reason-chip">
          {isRepeat ? "Repeat" : "Maintenance"}
        </span>
      </div>

      <div className="pt-blc-grid">
        <div className="pt-blc-grid-item">
          <span className="pt-blc-icon">🕐</span>
          <div>
            <span className="pt-blc-label">Time</span>
            <span className="pt-blc-value">
              {to12h(block.start_time)} - {to12h(block.end_time)}
            </span>
          </div>
        </div>
        <div className="pt-blc-grid-item">
          <span className="pt-blc-icon">📅</span>
          <div>
            <span className="pt-blc-label">Date</span>
            <span className="pt-blc-value">{formatDate(block.date)}</span>
          </div>
        </div>
      </div>

      {reasonText !== "—" && (
        <div className="pt-blc-reason">
          <span className="pt-blc-reason-label">Reason:</span>
          <span className="pt-blc-reason-text">{reasonText}</span>
        </div>
      )}

      <button className="pt-blc-remove" onClick={onRemove}>
        🔓 Remove Block
      </button>
    </div>
  );
};

export default BlockCard;