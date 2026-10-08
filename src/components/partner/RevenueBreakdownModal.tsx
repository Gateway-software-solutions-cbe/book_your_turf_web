import React, { useMemo, useState } from "react";
import {
  RangePreset,
  formatRangeLabel,
  rangeForPreset,
} from "../../lib/dateRange";
import "./RevenueBreakdownModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  // Month-scoped values from /dashboard/
  month: {
    total: number;
    online: number;
    offline: number;
    advance: number;
    fullyPaid: number;
  };
};

const currency = (v: number): string =>
  "₹" +
  Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const pct = (part: number, total: number): string => {
  if (!total) return "0.0%";
  return ((part / total) * 100).toFixed(1) + "%";
};

const RevenueBreakdownModal: React.FC<Props> = ({
  open,
  onClose,
  month,
}) => {
  const [preset, setPreset] = useState<RangePreset>("month");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { from, to } = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return {
        from: new Date(customFrom + "T00:00:00"),
        to: new Date(customTo + "T23:59:59"),
      };
    }
    return rangeForPreset(preset === "custom" ? "month" : preset);
  }, [preset, customFrom, customTo]);

  if (!open) return null;

  // No range-specific data available yet, so all tabs display month values.
  const data = month;
  const totalCollected = data.total;
  const online = data.online;
  const offline = data.offline;
  const advance = data.advance;
  const fullyPaid = data.fullyPaid;

  const rangeLabel = formatRangeLabel(from, to);
  const isMonthOnly = preset !== "month";

  return (
    <div className="pt-modal-backdrop" onClick={onClose}>
      <div
        className="pt-modal pt-revenue-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="pt-modal-header">
          <h3>Revenue Analytics</h3>
          <button className="pt-modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        {/* Four tabs */}
        <div className="pt-rev-tabs">
          {(
            [
              { key: "today", label: "Today" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "custom", label: "Custom Range" },
            ] as { key: RangePreset; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              className={`pt-rev-tab ${
                preset === t.key ? "pt-rev-tab--active" : ""
              }`}
              onClick={() => {
                setPreset(t.key);
                if (t.key === "custom") setCalendarOpen(true);
                else setCalendarOpen(false);
              }}
            >
              {t.key === "month" && preset === "month" ? "✓ " : ""}
              {t.label}
            </button>
          ))}
        </div>

        {/* Show Calendar toggle */}
        <div className="pt-rev-calendar-row">
          <button
            className="pt-rev-calendar-btn"
            onClick={() => {
              setCalendarOpen((v) => !v);
              if (preset !== "custom") setPreset("custom");
            }}
          >
            {calendarOpen ? "Hide Calendar" : "Show Calendar"} 📅
          </button>
        </div>

        {/* Calendar panel */}
        {calendarOpen && (
          <div className="pt-rev-calendar-panel">
            <label>
              From
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </label>
            <button
              className="pt-rev-calendar-apply"
              disabled={!customFrom || !customTo}
              onClick={() => {
                setPreset("custom");
                setCalendarOpen(false);
              }}
            >
              Apply
            </button>
          </div>
        )}

        <div className="pt-revenue-range">{rangeLabel}</div>

        {isMonthOnly && (
          <div className="pt-rev-note">
            Range-specific analytics coming soon — showing this month's
            figures.
          </div>
        )}

        <div className="pt-revenue-hero">
          <div className="pt-revenue-hero-label">
            Total Revenue Collected
          </div>
          <div className="pt-revenue-hero-value">
            {currency(totalCollected)}
          </div>
          <div className="pt-revenue-hero-sub">For selected period</div>
        </div>

        <div className="pt-revenue-pair">
          <div className="pt-revenue-tile">
            <span className="pt-revenue-tile-icon pt-revenue-tile-icon--online">
              📶
            </span>
            <span className="pt-revenue-tile-label">Online</span>
            <span className="pt-revenue-tile-value">
              {currency(online)}
            </span>
            <span className="pt-revenue-tile-pct">
              {pct(online, totalCollected)}
            </span>
          </div>

          <div className="pt-revenue-tile">
            <span className="pt-revenue-tile-icon pt-revenue-tile-icon--offline">
              📞
            </span>
            <span className="pt-revenue-tile-label">Offline</span>
            <span className="pt-revenue-tile-value">
              {currency(offline)}
            </span>
            <span className="pt-revenue-tile-pct">
              {pct(offline, totalCollected)}
            </span>
          </div>
        </div>

        <div className="pt-revenue-pair">
          <div className="pt-revenue-tile">
            <span className="pt-revenue-tile-icon pt-revenue-tile-icon--advance">
              💳
            </span>
            <span className="pt-revenue-tile-label">Advance</span>
            <span className="pt-revenue-tile-value">
              {currency(advance)}
            </span>
            <span className="pt-revenue-tile-pct">
              {pct(advance, totalCollected)}
            </span>
          </div>

          <div className="pt-revenue-tile">
            <span className="pt-revenue-tile-icon pt-revenue-tile-icon--paid">
              ✅
            </span>
            <span className="pt-revenue-tile-label">Fully Paid</span>
            <span className="pt-revenue-tile-value">
              {currency(fullyPaid)}
            </span>
            <span className="pt-revenue-tile-pct">
              {pct(fullyPaid, totalCollected)}
            </span>
          </div>
        </div>

        <div className="pt-revenue-breakdown">
          <h4>Detailed Breakdown</h4>
          <BreakdownRow
            label="Overall Collected"
            value={totalCollected}
            total={totalCollected}
            tone="green"
          />
          <BreakdownRow
            label="Online Payment"
            value={online}
            total={totalCollected}
            tone="blue"
          />
          <BreakdownRow
            label="Offline Payment"
            value={offline}
            total={totalCollected}
            tone="orange"
          />
          <BreakdownRow
            label="Advance Payment"
            value={advance}
            total={totalCollected}
            tone="purple"
          />
          <BreakdownRow
            label="Fully Paid"
            value={fullyPaid}
            total={totalCollected}
            tone="teal"
          />
        </div>
      </div>
    </div>
  );
};

const BreakdownRow: React.FC<{
  label: string;
  value: number;
  total: number;
  tone: "green" | "blue" | "orange" | "purple" | "teal";
}> = ({ label, value, total, tone }) => {
  const width = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="pt-breakdown-row">
      <div className="pt-breakdown-row-top">
        <span className="pt-breakdown-label">{label}</span>
        <span className="pt-breakdown-value">{currency(value)}</span>
      </div>
      <div className="pt-breakdown-bar">
        <div
          className={`pt-breakdown-fill pt-breakdown-fill--${tone}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="pt-breakdown-pct">{pct(value, total)}</div>
    </div>
  );
};

export default RevenueBreakdownModal;