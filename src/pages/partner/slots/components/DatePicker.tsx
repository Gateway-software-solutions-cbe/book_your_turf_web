import React from "react";
import "./DatePicker.css";

interface Props {
  value: string;          // YYYY-MM-DD
  onChange: (v: string) => void;
  /** How many days ahead to allow (default 90) */
  daysAhead?: number;
  /** Disable past dates (default true) */
  disablePast?: boolean;
}

const toDisplayDate = (iso: string): string => {
  if (!iso) return "Select date";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const todayIso = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const DatePicker: React.FC<Props> = ({
  value,
  onChange,
  daysAhead = 90,
  disablePast = true,
}) => {
  const minDate = disablePast ? todayIso() : "";
  const maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  return (
    <section className="pt-form-section pt-dp-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">📅</span>
        <div>
          <h3>Select Date</h3>
          <p>Pick the day to view slots</p>
        </div>
      </header>

      <label className="pt-dp-field">
        <span className="pt-dp-icon">📅</span>
        <span className="pt-dp-value">{toDisplayDate(value)}</span>
        <span className="pt-dp-caret">▾</span>
        <input
          type="date"
          className="pt-dp-input"
          value={value}
          min={minDate || undefined}
          max={maxDate}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </section>
  );
};

export default DatePicker;