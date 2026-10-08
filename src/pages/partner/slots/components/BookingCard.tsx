import React from "react";
import type { PartnerBooking } from "../../../../types/partner/slot";
import { metaBookingAcknowledged } from "../../../../lib/metaPixel";
import "./BookingCard.css";

interface Props {
  booking: PartnerBooking;
  onCollect: () => void;
  onCancel: () => void;
}

// ─── Cancellation rule (partner-side) ────────────────────────────────────
// Only future slots can be cancelled. The booking record is kept with
// is_cancelled=True and slots preserved for history. Online bookings
// cannot be cancelled from here at all.
const getSlotStartDateTime = (date: string, time: string): Date =>
  new Date(`${date}T${time}:00`);

const getLatestSlotStart = (b: PartnerBooking): Date | null => {
  if (!b.slots || b.slots.length === 0) return null;
  return b.slots
    .map((s) => getSlotStartDateTime(s.date, s.start_time))
    .reduce((max, d) => (d > max ? d : max));
};

// Booking is "past" once the LAST slot has already started.
const isPastBooking = (b: PartnerBooking): boolean => {
  const latest = getLatestSlotStart(b);
  if (!latest) return false;
  return latest.getTime() < Date.now();
};

// Partner-side rule: cancel is allowed when the booking is
//   • not already cancelled,
//   • an Offline booking (walk-in), and
//   • has at least one slot that hasn't started yet.
const canCancelBooking = (b: PartnerBooking): boolean => {
  if (b.is_cancelled) return false;
  if (b.booking_type !== "Offline") return false;
  if (isPastBooking(b)) return false;
  return true;
};

// ─── Display helpers ─────────────────────────────────────────────────────
const sportEmoji = (gameType: string): string => {
  const g = gameType.toLowerCase();
  if (g.includes("badminton")) return "🏸";
  if (g.includes("pickle")) return "🏓";
  return "⚽";
};

const to12h = (hhmm: string): string => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const formatSlotTime = (b: PartnerBooking): string => {
  if (b.slots.length === 0) return "—";
  const first = b.slots[0];
  const last = b.slots[b.slots.length - 1];
  return `${to12h(first.start_time)} - ${to12h(last.end_time)}`;
};

const formatPlayingDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isFullyPaid = (b: PartnerBooking) =>
  Number(b.pending_amount) === 0 && !b.is_cancelled;

// ─── Component ───────────────────────────────────────────────────────────
const BookingCard: React.FC<Props> = ({ booking, onCollect, onCancel }) => {
  const fullyPaid = isFullyPaid(booking);
  const isPast = isPastBooking(booking);
  const canCancel = canCancelBooking(booking);
  const canCollect =
    !booking.is_cancelled && Number(booking.pending_amount) > 0;

  // ─── Cancellation hint ───────────────────────────────────────────
  // Shown only when cancellation is unavailable and there's a specific
  // reason worth surfacing. Cancelled bookings don't need a hint — the
  // status pill already says "Cancelled".
  const cancelHint: { label: string; tone: "muted" | "warn" } | null =
    (() => {
      if (booking.is_cancelled) return null;

      // Past booking — the slot has started or already been played.
      if (isPast) {
        return { label: "Slot completed · cannot cancel", tone: "muted" };
      }

      // Online booking — cancellations are only allowed for walk-ins.
      if (booking.booking_type !== "Offline") {
        return {
          label: "Online booking · cannot cancel from here",
          tone: "muted",
        };
      }

      // Still cancellable — no hint needed.
      return null;
    })();

  const handleCardClick = () => {
    if (!booking.is_cancelled) {
      metaBookingAcknowledged({
        booking_id: booking.booking_id,
      });
    }
  };

  return (
    <div
      className={`pt-bkc-card ${
        booking.is_cancelled ? "pt-bkc-cancelled" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Top row */}
      <div className="pt-bkc-top">
        <div className="pt-bkc-customer">
          <div className="pt-bkc-avatar">{sportEmoji(booking.game_type)}</div>
          <div>
            <div className="pt-bkc-customer-name">{booking.customer.name}</div>
            <div className="pt-bkc-customer-meta">
              <span className="pt-bkc-phone">
                📞 {booking.customer.mobile}
              </span>
              <span className="pt-bkc-sport-chip">{booking.game_type}</span>
            </div>
          </div>
        </div>
        <span
          className={`pt-bkc-type-chip pt-bkc-type-${booking.booking_type.toLowerCase()}`}
        >
          {booking.booking_type}
        </span>
      </div>

      {/* Info grid */}
      <div className="pt-bkc-grid">
        <div className="pt-bkc-grid-item">
          <span className="pt-bkc-grid-icon">🏟</span>
          <div>
            <span className="pt-bkc-grid-label">Venue</span>
            <span className="pt-bkc-grid-value">{booking.turf_name}</span>
          </div>
        </div>
        <div className="pt-bkc-grid-item">
          <span className="pt-bkc-grid-icon">🎯</span>
          <div>
            <span className="pt-bkc-grid-label">Court</span>
            <span className="pt-bkc-grid-value">
              Court {booking.court_number}
            </span>
          </div>
        </div>
        <div className="pt-bkc-grid-item">
          <span className="pt-bkc-grid-icon">📅</span>
          <div>
            <span className="pt-bkc-grid-label">Playing Date</span>
            <span className="pt-bkc-grid-value">
              {booking.slots.length > 0
                ? formatPlayingDate(booking.slots[0].date)
                : "—"}
            </span>
          </div>
        </div>
        <div className="pt-bkc-grid-item">
          <span className="pt-bkc-grid-icon">🕐</span>
          <div>
            <span className="pt-bkc-grid-label">Time</span>
            <span className="pt-bkc-grid-value">
              {formatSlotTime(booking)}
            </span>
          </div>
        </div>
      </div>

      {/* Amounts */}
      <div className="pt-bkc-amounts">
        <div className="pt-bkc-amount">
          <span className="pt-bkc-amount-label">Total</span>
          <span className="pt-bkc-amount-value">₹{booking.total_amount}</span>
        </div>
        <div className="pt-bkc-amount pt-bkc-amount-mid">
          <span className="pt-bkc-amount-label">Paid</span>
          <span className="pt-bkc-amount-value pt-bkc-amount-paid">
            ₹{booking.paid_amount}
          </span>
        </div>
        <div className="pt-bkc-amount">
          <span className="pt-bkc-amount-label">Balance</span>
          <span className="pt-bkc-amount-value pt-bkc-amount-pending">
            ₹{booking.pending_amount}
          </span>
        </div>
      </div>

      {/* Status pill */}
      <div
        className={`pt-bkc-status pt-bkc-status-${booking.payment_status
          .toLowerCase()
          .replace(/\s+/g, "-")} ${
          booking.is_cancelled ? "pt-bkc-status-cancelled" : ""
        }`}
      >
        {booking.is_cancelled
          ? "Cancelled"
          : fullyPaid
          ? "Fully Paid"
          : booking.payment_status}
      </div>

      {/* Actions */}
      <div className="pt-bkc-actions">
        {canCollect && (
          <button className="pt-bkc-btn pt-bkc-btn-collect" onClick={onCollect}>
            💵 Collect ₹{booking.pending_amount}
          </button>
        )}

        {canCancel && (
          <button className="pt-bkc-btn pt-bkc-btn-cancel" onClick={onCancel}>
            ✕ Cancel
          </button>
        )}

        {cancelHint && (
          <span className={`pt-bkc-hint pt-bkc-hint-${cancelHint.tone}`}>
            {cancelHint.tone === "warn" ? "⏱" : "✓"} {cancelHint.label}
          </span>
        )}
      </div>
    </div>
  );
};

export default BookingCard;