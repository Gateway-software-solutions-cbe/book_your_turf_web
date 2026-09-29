import React from "react";
import {normalizeHourlyTime} from "../../../../utils/timeUtils";

interface Props {
  openTime: string;
  closeTime: string;
  onChange: (patch: Partial<{ open_time: string; close_time: string }>) => void;
}

type WindowKind = "normal" | "overnight" | "allDay";

const getWindowKind = (start: string, end: string): WindowKind => {
  if (!start || !end) return "normal";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return "normal";
  const sMins = sh * 60 + sm;
  const eMins = eh * 60 + em;
  if (sMins === eMins) return "allDay";
  if (eMins < sMins) return "overnight";
  return "normal";
};

const OperatingHoursSection: React.FC<Props> = ({
  openTime,
  closeTime,
  onChange,
}) => {
  const kind = getWindowKind(openTime, closeTime);

  return (
    <section className="pt-form-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">⏰</span>
        <div>
          <h3>Operating Hours</h3>
          <p>Select opening and closing times</p>
        </div>
      </header>

      <div className="pt-grid-2">
        <div className="pt-field">
          <label className="pt-field-label">
            Opening Time <span className="pt-req">*</span>
          </label>
          <div className="pt-time-field">
            <input
              type="time"
              step={3600}
              className="pt-time-field-input"
              value={openTime}
              onChange={(e) => onChange({
      open_time: normalizeHourlyTime(e.target.value),
    })}
            />
            <span className="pt-time-field-icon">🕐</span>
          </div>
        </div>

        <div className="pt-field">
          <label className="pt-field-label">
            Closing Time <span className="pt-req">*</span>
          </label>
          <div
            className={`pt-time-field ${
              kind === "overnight" || kind === "allDay"
                ? "pt-time-field-night"
                : ""
            }`}
          >
            <input
              type="time"
              step={3600}
              className="pt-time-field-input"
              value={closeTime}
              onChange={(e) => onChange({
      close_time: normalizeHourlyTime(e.target.value),
    })}
            />
            <span className="pt-time-field-icon">🕐</span>
            {kind === "overnight" && (
              <span className="pt-next-day-badge">🌙 Next Day</span>
            )}
            {kind === "allDay" && (
              <span className="pt-next-day-badge">🌐 24 hours</span>
            )}
          </div>
          {kind === "overnight" && (
            <span className="pt-char-count">
              This venue stays open past midnight.
            </span>
          )}
          {kind === "allDay" && (
            <span className="pt-char-count">
              Venue is open continuously from {openTime} to {closeTime} next
              day. All shifts must fit within this 24-hour window.
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default OperatingHoursSection;