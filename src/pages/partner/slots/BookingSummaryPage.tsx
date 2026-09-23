import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { partnerSlotsApi } from "../../../api/partner/slots";
import type { CalendarSlot } from "../../../types/partner/slot";
import BookingConfirmedModal from "./components/BookingConfirmedModal";
import "./BookingSummaryPage.css";

interface SummaryState {
  turfId: number;
  turfName: string;
  gameType: string;
  courtNumber: number;
  date: string;
  slots: CalendarSlot[];
  customer: {
    name: string;
    mobile: string;
    paidAmount: string;
  };
}

const formatDisplayDate = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const BookingSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: SummaryState };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<{
    bookingId: string;
    bookingDbId: number;
    customerName: string;
    customerMobile: string;
    totalAmount: string;
    paidAmount: string;
  } | null>(null);

  if (!state) {
    return (
      <div className="pt-summary-page">
        <div className="pt-auth-error">
          Missing booking details. Please try again from the slot page.
        </div>
        <button
          className="pt-btn-primary"
          style={{ maxWidth: 280, margin: "16px auto 0" }}
          onClick={() => navigate("/partner/slots")}
        >
          Back to Slots
        </button>
      </div>
    );
  }

  const { turfId, turfName, gameType, courtNumber, date, slots, customer } =
    state;

  const isTurfSport =
    gameType.toLowerCase().includes("cricket") ||
    gameType.toLowerCase().includes("football");
  const courtLabel = `${isTurfSport ? "Turf" : "Court"} ${courtNumber}`;

  const totalAmount = slots.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const paid = Number(customer.paidAmount) || 0;
  const balance = Math.max(0, totalAmount - paid);

  // Sort slots by time for the summary
  const sortedSlots = [...slots].sort((a, b) => {
    if (a.is_next_day !== b.is_next_day) return a.is_next_day ? 1 : -1;
    return a.start_time.localeCompare(b.start_time);
  });

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await partnerSlotsApi.createOwnBooking({
        turf_id: turfId,
        court_number: courtNumber,
        date,
        slots: slots.map((s) => ({
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          price: s.price,
          is_next_day: s.is_next_day,
        })),
        walk_in_name: customer.name,
        walk_in_mobile: customer.mobile,
        total_amount: totalAmount.toFixed(2),
        paid_amount: paid.toFixed(2),
      });
      setConfirmed({
        bookingId: res.data.booking_id,
        bookingDbId: res.data.id,
        customerName: customer.name,
        customerMobile: customer.mobile,
        totalAmount: totalAmount.toFixed(2),
        paidAmount: paid.toFixed(2),
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to create booking. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-summary-page">
      <header className="pt-summary-header">
        <button
          className="pt-summary-back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          ‹
        </button>
        <h1>Booking Summary</h1>
      </header>

      {error && <div className="pt-auth-error">{error}</div>}

      {/* Sport banner */}
      <section className="pt-summary-sport">
        <div className="pt-summary-sport-icon">
          {gameType.toLowerCase().includes("badminton")
            ? "🏸"
            : gameType.toLowerCase().includes("pickle")
              ? "🏓"
              : "⚽"}
        </div>
        <div className="pt-summary-sport-text">
          <span className="pt-summary-sport-label">Sport</span>
          <span className="pt-summary-sport-value">{gameType}</span>
        </div>
      </section>

      {/* Booking date card */}
      <section className="pt-summary-date-card">
        <div className="pt-summary-date-icon">📅</div>
        <div>
          <span className="pt-summary-date-label">Booking Date</span>
          <span className="pt-summary-date-value">
            {formatDisplayDate(date)}
          </span>
        </div>
      </section>

      {/* Booking details grid */}
      <section className="pt-summary-details">
        <div className="pt-summary-row">
          <span className="pt-summary-row-label">Venue Name</span>
          <span className="pt-summary-row-value">{turfName}</span>
        </div>
        <div className="pt-summary-row">
          <span className="pt-summary-row-label">Booking User</span>
          <span className="pt-summary-row-value">{customer.name}</span>
        </div>
        <div className="pt-summary-row">
          <span className="pt-summary-row-label">Mobile Number</span>
          <span className="pt-summary-row-value">{customer.mobile}</span>
        </div>
        <div className="pt-summary-row">
          <span className="pt-summary-row-label">Sport</span>
          <span className="pt-summary-row-value">{gameType}</span>
        </div>
        <div className="pt-summary-row">
          <span className="pt-summary-row-label">Court</span>
          <span className="pt-summary-row-value">{courtLabel}</span>
        </div>
      </section>

      {/* Selected slots */}
      <section className="pt-summary-slots">
        <h3 className="pt-summary-section-title">Selected Date &amp; Time</h3>
        <div className="pt-summary-slot-date">
          <span className="pt-summary-slot-icon">📅</span>
          <span>
            {new Date(date).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="pt-summary-slot-chips">
          {sortedSlots.map((s, idx) => (
            <span
              key={`${s.start_time}-${idx}`}
              className="pt-summary-slot-chip"
            >
              🕐 {s.start_time_12h} – {s.end_time_12h}
              {s.is_next_day && (
                <span className="pt-summary-slot-chip-next">Next Day</span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* Amounts */}
      <section className="pt-summary-amounts">
        <div className="pt-summary-amount-row">
          <span>Total Amount</span>
          <span className="pt-summary-amount-total">
            ₹{totalAmount.toFixed(2)}
          </span>
        </div>
        <div className="pt-summary-amount-row">
          <span>Paid</span>
          <span className="pt-summary-amount-paid">₹{paid.toFixed(2)}</span>
        </div>
        <div className="pt-summary-amount-row pt-summary-amount-remaining">
          <span>Remaining</span>
          <span className="pt-summary-amount-remaining-value">
            ₹{balance.toFixed(2)}
          </span>
        </div>
      </section>

      {/* Actions */}
      <div className="pt-summary-actions">
        <button
          className="pt-summary-btn pt-summary-btn-cancel"
          onClick={() => navigate(-1)}
          disabled={submitting}
        >
          CANCEL
        </button>
        <button
          className="pt-summary-btn pt-summary-btn-confirm"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Booking..." : "CONFIRM"}
        </button>
      </div>

      {/* Success modal */}
      {confirmed && (
  <BookingConfirmedModal
    bookingId={confirmed.bookingId}
    customerName={confirmed.customerName}
    customerMobile={confirmed.customerMobile}
    turfName={turfName}
    date={date}
    slots={slots.map((s) => ({
      start_time_12h: s.start_time_12h,
      end_time_12h: s.end_time_12h,
      is_next_day: s.is_next_day,
    }))}
    totalAmount={confirmed.totalAmount}
    paidAmount={confirmed.paidAmount}
    onClose={() => {
      setConfirmed(null);
      navigate("/partner/slots");
    }}
  />
)}
    </div>
  );
};

export default BookingSummaryPage;