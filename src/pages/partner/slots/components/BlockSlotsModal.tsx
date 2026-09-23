import React, { useState } from "react";
import type { CalendarSlot } from "../../../../types/partner/slot";
import "./BlockSlotsModal.css";

export type RepeatType = "Daily" | "Weekly";

export interface BlockConfig {
  repeatType: RepeatType;
  repeatCount: number;   // 1–7 for daily, 1–4 for weekly
  reason: string;
}

interface Props {
  slots: CalendarSlot[];
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (config: BlockConfig) => void;
}

const DAILY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const WEEKLY_OPTIONS = [1, 2, 3, 4];

const formatSlotLine = (s: CalendarSlot): string => {
  const [y, m, d] = s.date.split("-").map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${dateStr} · ${s.start_time_12h} - ${s.end_time_12h}`;
};

const BlockSlotsModal: React.FC<Props> = ({
  slots,
  submitting,
  onCancel,
  onConfirm,
}) => {
  const [repeatType, setRepeatType] = useState<RepeatType>("Daily");
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [reason, setReason] = useState("");

  const options = repeatType === "Daily" ? DAILY_OPTIONS : WEEKLY_OPTIONS;

  const handleRepeatTypeChange = (t: RepeatType) => {
    setRepeatType(t);
    if (repeatCount > (t === "Daily" ? 7 : 4)) setRepeatCount(1);
  };

  return (
    <div className="pt-bsm-overlay" onClick={() => !submitting && onCancel()}>
      <div className="pt-bsm-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pt-bsm-header">
          <span className="pt-bsm-header-icon">🚫</span>
          <h2>Block Slots</h2>
        </header>

        {/* Selected slots preview */}
        <div className="pt-bsm-selected">
          <div className="pt-bsm-selected-title">
            Selected Slots: <strong>{slots.length}</strong>
          </div>
          <ul className="pt-bsm-selected-list">
            {slots.map((s, i) => (
              <li key={`${s.date}-${s.start_time}-${i}`}>
                <span className="pt-bsm-clock">🕐</span>
                <span>{formatSlotLine(s)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Repeat type */}
        <div className="pt-bsm-block">
          <label className="pt-bsm-label">Repeat Type</label>
          <div className="pt-bsm-segmented">
            <button
              type="button"
              className={`pt-bsm-seg-btn ${
                repeatType === "Daily" ? "pt-active" : ""
              }`}
              onClick={() => handleRepeatTypeChange("Daily")}
              disabled={submitting}
            >
              Daily
            </button>
            <button
              type="button"
              className={`pt-bsm-seg-btn ${
                repeatType === "Weekly" ? "pt-active" : ""
              }`}
              onClick={() => handleRepeatTypeChange("Weekly")}
              disabled={submitting}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Repeat count */}
        <div className="pt-bsm-block">
          <label className="pt-bsm-label">
            Repeat for how many {repeatType === "Daily" ? "days" : "weeks"}?
          </label>
          <div className="pt-bsm-chips">
            {options.map((n) => (
              <button
                key={n}
                type="button"
                className={`pt-bsm-chip ${
                  repeatCount === n ? "pt-active" : ""
                }`}
                onClick={() => setRepeatCount(n)}
                disabled={submitting}
              >
                {n} {repeatType === "Daily" ? "Day" : "Week"}
                {n > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="pt-bsm-block">
          <label className="pt-bsm-label">Reason for blocking (Optional)</label>
          <textarea
            className="pt-bsm-textarea"
            placeholder="e.g. Maintenance, Private event, Renovation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            rows={3}
            disabled={submitting}
          />
        </div>

        <p className="pt-bsm-confirm-text">
          Are you sure you want to block these slots?
        </p>

        {/* Actions */}
        <div className="pt-bsm-actions">
          <button
            type="button"
            className="pt-bsm-btn pt-bsm-btn-cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="pt-bsm-btn pt-bsm-btn-block"
            onClick={() =>
              onConfirm({ repeatType, repeatCount, reason: reason.trim() })
            }
            disabled={submitting}
          >
            {submitting ? "Blocking..." : "Block Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockSlotsModal;