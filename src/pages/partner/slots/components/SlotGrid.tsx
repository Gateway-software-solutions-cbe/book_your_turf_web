import React from "react";
import type { CalendarSlot, SlotMode } from "../../../../types/partner/slot";
import "./SlotGrid.css";

interface Props {
  slots: CalendarSlot[];
  mode: SlotMode;
  selectedKeys: Set<string>;
  onToggle: (slot: CalendarSlot) => void;
}

const slotKey = (s: CalendarSlot) =>
  `${s.date}|${s.start_time}|${s.end_time}|${s.is_next_day}`;

const SlotGrid: React.FC<Props> = ({
  slots,
  mode,
  selectedKeys,
  onToggle,
}) => {
  const isSelectable = (s: CalendarSlot): boolean => {
    if (mode === "unblock") return s.status === "Unavailable";
    // book + block both require Available
    return s.status === "Available";
  };

  const getClass = (s: CalendarSlot): string => {
    const selected = selectedKeys.has(slotKey(s));
    if (s.status === "Booked") return "pt-slot-booked";
    if (s.status === "Unavailable") {
      return selected ? "pt-slot-blocked-selected" : "pt-slot-blocked";
    }
    // Available
    if (selected) {
      return mode === "block" ? "pt-slot-block-selected" : "pt-slot-selected";
    }
    return "pt-slot-available";
  };

  const getHint = (s: CalendarSlot): string | null => {
    if (s.status === "Booked") return "Booked";
    if (s.status === "Unavailable") return "Blocked";
    return null;
  };

  if (slots.length === 0) {
    return (
      <div className="pt-slot-empty">
        <div className="pt-slot-empty-icon">🗓</div>
        <p>No slots available for the selected date.</p>
      </div>
    );
  }

  return (
    <>
      <div className="pt-slot-legend">
        <span className="pt-slot-legend-item">
          <span className="pt-slot-legend-dot pt-dot-available" />
          Available
        </span>
        <span className="pt-slot-legend-item">
          <span className="pt-slot-legend-dot pt-dot-selected" />
          Selected
        </span>
        <span className="pt-slot-legend-item">
          <span className="pt-slot-legend-dot pt-dot-blocked" />
          Blocked
        </span>
        <span className="pt-slot-legend-item">
          <span className="pt-slot-legend-dot pt-dot-booked" />
          Booked
        </span>
      </div>

      <div className="pt-slot-grid">
        {slots.map((s) => {
          const selectable = isSelectable(s);
          const selected = selectedKeys.has(slotKey(s));
          const hint = getHint(s);
          return (
            <button
              key={slotKey(s)}
              type="button"
              disabled={!selectable}
              className={`pt-slot ${getClass(s)}`}
              onClick={() => selectable && onToggle(s)}
            >
              <span className="pt-slot-time">
                {s.start_time_12h} – {s.end_time_12h}
              </span>
              {s.is_next_day && (
                <span className="pt-slot-nextday">Next Day</span>
              )}
              {hint ? (
                <span className="pt-slot-hint">{hint}</span>
              ) : (
                <span className="pt-slot-price">₹{s.price}</span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default SlotGrid;