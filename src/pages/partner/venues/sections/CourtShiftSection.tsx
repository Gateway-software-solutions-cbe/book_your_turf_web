import React from "react";
import type { CourtShift, DayKey } from "../../../../types/partner/turf";
import { normalizeHourlyTime } from "../../../../utils/timeUtils";

interface Props {
  shifts: CourtShift[];
  gameType: string;
  venueOpenTime: string;
  venueCloseTime: string;
  onChangeShift: (courtNumber: number, patch: Partial<CourtShift>) => void;
  onAddShift: () => void;
  onRemoveShift: (courtNumber: number) => void;
}

const DAYS: { key: DayKey; short: string }[] = [
  { key: "mon", short: "Mon" },
  { key: "tue", short: "Tue" },
  { key: "wed", short: "Wed" },
  { key: "thu", short: "Thu" },
  { key: "fri", short: "Fri" },
  { key: "sat", short: "Sat" },
  { key: "sun", short: "Sun" },
];

const getUnitLabel = (gameType: string) => {
  const key = gameType.trim().toLowerCase();
  if (key.includes("cricket") || key.includes("football")) {
    return { singular: "Turf", plural: "Turfs" };
  }
  return { singular: "Court", plural: "Courts" };
};

// ─── Time helpers ──────────────────────────────────────────
const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
};

type VenueWindow = "normal" | "overnight" | "allDay";

const getVenueWindow = (open: string, close: string): VenueWindow => {
  if (!open || !close) return "normal";
  const om = toMinutes(open);
  const cm = toMinutes(close);
  if (Number.isNaN(om) || Number.isNaN(cm)) return "normal";
  if (om === cm) return "allDay";
  if (cm < om) return "overnight";
  return "normal";
};

/** Display label for a shift's end-time badge. */
type EndBadge = "none" | "nextDay" | "sameDayDuration";

const getShiftEndBadge = (
  start: string,
  end: string,
): EndBadge => {
  if (!start || !end) return "none";
  const sm = toMinutes(start);
  const em = toMinutes(end);
  if (Number.isNaN(sm) || Number.isNaN(em)) return "none";
  if (sm === em) return "none";
  return em < sm ? "nextDay" : "none";
};

/** Is the shift (s → e) fully inside the venue window? */
const isShiftInsideVenue = (
  s: string,
  e: string,
  open: string,
  close: string,
): boolean => {
  if (!s || !e || !open || !close) return true;
  const sm = toMinutes(s);
  const em = toMinutes(e);
  const om = toMinutes(open);
  const cm = toMinutes(close);
  if ([sm, em, om, cm].some(Number.isNaN)) return true;

  if (sm === em) return false;

  const kind = getVenueWindow(open, close);

  if (kind === "allDay") {
    if (sm < om) return false;
    if (em > sm) return true;
    return em <= cm;
  }

  if (kind === "normal") {
    return sm >= om && em <= cm && em > sm;
  }

  // overnight venue
  const startEvening = sm >= om;
const startMorning = sm < cm;
const endEvening = em >= om;
const endMorning = em < cm;

// Allow a shift to end exactly at midnight.
const endAtMidnight = em === 0;

if (startEvening && (endMorning || endAtMidnight)) {
  return true;
}

if (startEvening && endEvening && em > sm) {
  return true;
}

if (startMorning && endMorning && em > sm) {
  return true;
}

return false;
};

const windowsOverlap = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean => {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  const toInterval = (s: string, e: string): [number, number] => {
    const sm = toMinutes(s);
    const em = toMinutes(e);
    if (Number.isNaN(sm) || Number.isNaN(em)) return [NaN, NaN];
    if (sm === em) return [0, 24 * 60];
    if (sm < em) return [sm, em];
    return [sm, em + 24 * 60];
  };
  const [as, ae] = toInterval(aStart, aEnd);
  const [bs, be] = toInterval(bStart, bEnd);
  if ([as, ae, bs, be].some(Number.isNaN)) return false;
  const shift = Math.min(as, bs);
  return as - shift < be - shift && bs - shift < ae - shift;
};

const CourtShiftSection: React.FC<Props> = ({
  shifts,
  gameType,
  venueOpenTime,
  venueCloseTime,
  onChangeShift,
  onAddShift,
  onRemoveShift,
}) => {
  const unit = getUnitLabel(gameType);
  const canRemove = shifts.length > 1;

  return (
    <section className="pt-form-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">📅</span>
        <div>
          <h3>
            {unit.singular} Time &amp; Prices <span className="pt-req">*</span>
          </h3>
          <p>Fill in times and prices for each {unit.singular.toLowerCase()}</p>
        </div>

        <button
          type="button"
          className="pt-add-court-btn"
          onClick={onAddShift}
        >
          <span className="pt-add-court-plus">+</span>
          <span>Add {unit.singular}</span>
        </button>
      </header>

      {shifts.map((shift) => {
        const dayBadge = getShiftEndBadge(
          shift.day_shift.start_time,
          shift.day_shift.end_time,
        );
        const nightBadge = getShiftEndBadge(
          shift.night_shift.start_time,
          shift.night_shift.end_time,
        );

        const dayOutsideVenue = !isShiftInsideVenue(
          shift.day_shift.start_time,
          shift.day_shift.end_time,
          venueOpenTime,
          venueCloseTime,
        );
        const nightOutsideVenue = !isShiftInsideVenue(
          shift.night_shift.start_time,
          shift.night_shift.end_time,
          venueOpenTime,
          venueCloseTime,
        );

        const dayOverlapsNight = windowsOverlap(
          shift.day_shift.start_time,
          shift.day_shift.end_time,
          shift.night_shift.start_time,
          shift.night_shift.end_time,
        );

        const hasError =
          dayOutsideVenue || nightOutsideVenue || dayOverlapsNight;

        return (
          <div
            key={shift.court_number}
            className={`pt-shift-card ${
              hasError ? "pt-shift-card-error" : ""
            }`}
          >
            <div className="pt-shift-card-head">
              <h4 className="pt-shift-court">
                {unit.singular} {shift.court_number}
              </h4>
              {canRemove && (
                <button
                  type="button"
                  className="pt-shift-remove"
                  onClick={() => onRemoveShift(shift.court_number)}
                  title={`Remove ${unit.singular.toLowerCase()}`}
                >
                  ✕ Remove
                </button>
              )}
            </div>

            {/* Day Shift */}
            <div className="pt-shift-block">
              <div className="pt-shift-block-header">
                <span>☀ Day Time</span>
              </div>
              <div className="pt-shift-times">
                <div className="pt-time-field pt-time-field-sm">
                  <input
                    type="time"
                    step={3600}
                    className="pt-time-field-input"
                    value={shift.day_shift.start_time}
                    onChange={(e) =>
                      onChangeShift(shift.court_number, {
                        day_shift: {
                          ...shift.day_shift,
                          start_time: normalizeHourlyTime(e.target.value),
                        },
                      })
                    }
                  />
                  <span className="pt-time-field-icon">🕐</span>
                </div>
                <span className="pt-time-arrow">→</span>
                <div
                  className={`pt-time-field pt-time-field-sm ${
                    dayBadge === "nextDay" ? "pt-time-field-night" : ""
                  }`}
                >
                  <input
                    type="time"
                    step={3600}
                    className="pt-time-field-input"
                    value={shift.day_shift.end_time}
                    onChange={(e) =>
                      onChangeShift(shift.court_number, {
                        day_shift: {
                          ...shift.day_shift,
                          end_time: normalizeHourlyTime(e.target.value),
                        },
                      })
                    }
                  />
                  <span className="pt-time-field-icon">🕐</span>
                  {dayBadge === "nextDay" && (
                    <span className="pt-next-day-badge">🌙 Next Day</span>
                  )}
                </div>
              </div>

              {dayOutsideVenue && (
                <div className="pt-shift-warning">
                  ⚠ Day shift must be within venue hours ({venueOpenTime} –{" "}
                  {venueCloseTime})
                </div>
              )}
              {dayOverlapsNight && (
                <div className="pt-shift-warning">
                  ⚠ Day shift overlaps with night shift on the same{" "}
                  {unit.singular.toLowerCase()}
                </div>
              )}

              <div className="pt-shift-prices">
                <span className="pt-price-label">
                  Day Prices (₹/hr) <span className="pt-req">*</span>
                </span>
                <div className="pt-price-grid">
                  {DAYS.map((d) => (
                    <div key={d.key} className="pt-price-cell">
                      <span className="pt-price-day">{d.short}</span>
                      <input
                        className="pt-input pt-input-sm"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={shift.day_shift.prices[d.key] || ""}
                        onChange={(e) =>
                          onChangeShift(shift.court_number, {
                            day_shift: {
                              ...shift.day_shift,
                              prices: {
                                ...shift.day_shift.prices,
                                [d.key]: Number(e.target.value) || 0,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Night Shift */}
            <div className="pt-shift-block">
              <div className="pt-shift-block-header pt-night">
                <span>🌙 Night Time</span>
              </div>
              <div className="pt-shift-times">
                <div className="pt-time-field pt-time-field-sm">
                  <input
                    type="time"
                    step={3600}
                    className="pt-time-field-input"
                    value={shift.night_shift.start_time}
                    onChange={(e) =>
                      onChangeShift(shift.court_number, {
                        night_shift: {
                          ...shift.night_shift,
                          start_time: normalizeHourlyTime(e.target.value),
                        },
                      })
                    }
                  />
                  <span className="pt-time-field-icon">🕐</span>
                </div>
                <span className="pt-time-arrow">→</span>
                <div
                  className={`pt-time-field pt-time-field-sm ${
                    nightBadge === "nextDay" ? "pt-time-field-night" : ""
                  }`}
                >
                  <input
                    type="time"
                    step={3600}
                    className="pt-time-field-input"
                    value={shift.night_shift.end_time}
                    onChange={(e) =>
                      onChangeShift(shift.court_number, {
                        night_shift: {
                          ...shift.night_shift,
                          end_time: normalizeHourlyTime(e.target.value),
                        },
                      })
                    }
                  />
                  <span className="pt-time-field-icon">🕐</span>
                  {nightBadge === "nextDay" && (
                    <span className="pt-next-day-badge">🌙 Next Day</span>
                  )}
                </div>
              </div>

              {nightOutsideVenue && (
                <div className="pt-shift-warning">
                  ⚠ Night shift must be within venue hours ({venueOpenTime} –{" "}
                  {venueCloseTime})
                </div>
              )}
              {dayOverlapsNight && (
                <div className="pt-shift-warning">
                  ⚠ Night shift overlaps with day shift on the same{" "}
                  {unit.singular.toLowerCase()}
                </div>
              )}

              <div className="pt-shift-prices">
                <span className="pt-price-label">
                  Night Prices (₹/hr) <span className="pt-req">*</span>
                </span>
                <div className="pt-price-grid">
                  {DAYS.map((d) => (
                    <div key={d.key} className="pt-price-cell">
                      <span className="pt-price-day">{d.short}</span>
                      <input
                        className="pt-input pt-input-sm"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={shift.night_shift.prices[d.key] || ""}
                        onChange={(e) =>
                          onChangeShift(shift.court_number, {
                            night_shift: {
                              ...shift.night_shift,
                              prices: {
                                ...shift.night_shift.prices,
                                [d.key]: Number(e.target.value) || 0,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default CourtShiftSection;