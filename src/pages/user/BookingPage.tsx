// src/pages/user/BookingPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getTurfCalendar } from "../../api/user/turfs";
import { useUserAuth } from "../../context/UserAuthContext";
import type { CalendarSlot } from "../../api/user/turfs";
import "./style/BookingPage.css";

// ─── Date Picker ──────────────────────────────────────────────────────────
interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DatePicker = ({ selectedDate, onDateSelect }: DatePickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  useEffect(() => {
    setCurrentMonth(new Date(selectedDate));
  }, [selectedDate]);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Date[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, daysInPrevMonth - i));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const isDateInRange = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d >= today && d <= maxDate;
  };

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const changeMonth = (delta: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  return (
    <div className="date-picker">
      <div className="date-picker__header">
        <button onClick={() => changeMonth(-1)} className="date-picker__nav">
          <i className="bi bi-chevron-left" />
        </button>
        <span className="date-picker__month">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button onClick={() => changeMonth(1)} className="date-picker__nav">
          <i className="bi bi-chevron-right" />
        </button>
      </div>

      <div className="date-picker__days-of-week">
        {daysOfWeek.map((day) => (
          <span key={day} className="date-picker__day-label">
            {day}
          </span>
        ))}
      </div>

      <div className="date-picker__days">
        {days.map((date, index) => {
          const isInRange = isDateInRange(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <button
              key={index}
              className={`date-picker__day 
                ${!isInRange ? "disabled" : ""} 
                ${isSelectedDate ? "selected" : ""} 
                ${isTodayDate ? "today" : ""} 
                ${!isCurrentMonth ? "other-month" : ""}`}
              onClick={() => isInRange && onDateSelect(date)}
              disabled={!isInRange}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Slot Card ────────────────────────────────────────────────────────────
interface SlotCardProps {
  slot: CalendarSlot;
  isSelected: boolean;
  onSelect: () => void;
}

const SlotCard = ({ slot, isSelected, onSelect }: SlotCardProps) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusClass = (): string => {
    if (isSelected) return "selected";

    const statusMap: Record<string, string> = {
      Available: "available",
      Booked: "booked",
      Reserved: "reserved",
      Blocked: "blocked",
      Unavailable: "unavailable",
    };

    if (slot.status && statusMap[slot.status]) {
      return statusMap[slot.status];
    }

    if (slot.is_next_day) return "next-day";
    return "available";
  };

  const getStatusLabel = (): string => {
    if (isSelected) return "SELECTED";
    return slot.status.toUpperCase();
  };

  const isDisabled = (): boolean => {
    return (
      slot.status === "Booked" ||
      slot.status === "Blocked" ||
      slot.status === "Reserved" ||
      slot.status === "Unavailable"
    );
  };

  const disabled = isDisabled();
  const statusClass = getStatusClass();

  return (
    <div
      className={`slot-card ${statusClass} ${isSelected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
      onClick={() => !disabled && onSelect()}
    >
      <div className="slot-card__time">
        <span>
          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
        </span>
        {slot.is_next_day && statusClass !== "booked" && (
          <span className="slot-card__next-day-badge">Next Day</span>
        )}
      </div>
      <div className="slot-card__bottom">
        <span className="slot-card__price">₹{slot.price}</span>
        <span className={`slot-card__status ${statusClass}`}>
          {getStatusLabel()}
        </span>
      </div>
    </div>
  );
};

// ─── Legend ──────────────────────────────────────────────────────────────
const Legend = () => (
  <div className="legend">
    <div className="legend__item">
      <span className="legend__dot legend__dot--available"></span>
      <span>Available</span>
    </div>
    <div className="legend__item">
      <span className="legend__dot legend__dot--selected"></span>
      <span>Selected</span>
    </div>
    <div className="legend__item">
      <span className="legend__dot legend__dot--booked"></span>
      <span>Booked</span>
    </div>
    <div className="legend__item">
      <span className="legend__dot legend__dot--reserved"></span>
      <span>Reserved</span>
    </div>
    <div className="legend__item">
      <span className="legend__dot legend__dot--blocked"></span>
      <span>Blocked</span>
    </div>
    <div className="legend__item">
      <span className="legend__dot legend__dot--unavailable"></span>
      <span>Unavailable</span>
    </div>
    <div className="legend__item">
      <span className="legend__dot legend__dot--next-day"></span>
      <span>Next Day</span>
    </div>
  </div>
);

// ─── Payment Summary ──────────────────────────────────────────────────────
interface PaymentSummaryProps {
  selectedSlots: CalendarSlot[];
  totalAmount: number;
  advanceAmount: number;
  paymentOption: "full" | "advance";
  onPaymentOptionChange: (option: "full" | "advance") => void;
  minSlots: number;
  onProceed: () => void;
}

const PaymentSummary = ({
  selectedSlots,
  totalAmount,
  advanceAmount,
  paymentOption,
  onPaymentOptionChange,
  minSlots,
  onProceed,
}: PaymentSummaryProps) => {
  const finalAmount = paymentOption === "full" ? totalAmount : advanceAmount;
  const isValid = selectedSlots.length >= minSlots;

  return (
    <div className="payment-summary">
      <div className="payment-summary__header">
        <h3>Payment</h3>
        <div className="payment-summary__options">
          <button
            className={`payment-summary__option ${paymentOption === "full" ? "active" : ""}`}
            onClick={() => onPaymentOptionChange("full")}
          >
            Full Payment
          </button>
          <button
            className={`payment-summary__option ${paymentOption === "advance" ? "active" : ""}`}
            onClick={() => onPaymentOptionChange("advance")}
          >
            Advance Payment
          </button>
        </div>
      </div>

      <div className="payment-summary__details">
        <div className="payment-summary__row">
          <span>Advance Payment</span>
          <span>₹{advanceAmount.toFixed(2)}</span>
        </div>
        <div className="payment-summary__row">
          <span>Full Payment</span>
          <span>₹{totalAmount.toFixed(2)}</span>
        </div>
        <div className="payment-summary__row payment-summary__row--highlight">
          <span>Pay: ₹{finalAmount.toFixed(2)}</span>
          <span className="payment-summary__detail">
            Slots: {selectedSlots.length} (Min: {minSlots})
          </span>
        </div>
        <div className="payment-summary__row payment-summary__row--total">
          <span>Total: ₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <button
        className={`payment-summary__proceed ${!isValid ? "disabled" : ""}`}
        onClick={onProceed}
        disabled={!isValid}
      >
        <i className="bi bi-credit-card" />
        Proceed to Pay
        <span className="payment-summary__proceed-amount">
          ₹{finalAmount.toFixed(2)}
        </span>
      </button>

      {!isValid && (
        <p className="payment-summary__error">
          Minimum {minSlots} slot{minSlots > 1 ? "s" : ""} required
        </p>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────

const BookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const turf = location.state?.turf;
  const { user } = useUserAuth();

  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [selectedSlots, setSelectedSlots] = useState<CalendarSlot[]>([]);
  const [paymentOption, setPaymentOption] = useState<"full" | "advance">(
    "full",
  );
  const [selectedCourt, setSelectedCourt] = useState<number>(1);

  // ─── Check if profile is complete ──────────────────────────────────
  const isProfileComplete = !!(
    user?.name &&
    user?.name.trim() !== "" &&
    user?.email &&
    user?.email.trim() !== ""
  );

  const formatDateForAPI = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

  // ─── Fetch Slots ──────────────────────────────────────────────────────

  useEffect(() => {
    const fetchSlots = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const formattedDate = formatDateForAPI(selectedDate);
        const response = await getTurfCalendar(parseInt(id), formattedDate, selectedCourt);
        if (response.result === "success") {
          setSlots(response.data);
        } else {
          setError(response.message || "Failed to load slots");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [id, selectedDate, selectedCourt]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleSlotSelect = (slot: CalendarSlot) => {
    setSelectedSlots((prev) => {
      const index = prev.findIndex(
        (s) => s.start_time === slot.start_time && s.date === slot.date,
      );
      if (index >= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return [...prev, slot];
    });
  };

  const handleDateSelect = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      setSelectedDate(new Date(today));
    } else {
      setSelectedDate(date);
    }
    setSelectedSlots([]);
  };

  const isSlotSelected = (slot: CalendarSlot) => {
    return selectedSlots.some(
      (s) => s.start_time === slot.start_time && s.date === slot.date,
    );
  };

  // ─── Handle Proceed to Payment / Profile ──────────────────────────────
  const handleProceed = () => {
    // ─── Proceed to payment summary ────────────────────────────────────
    console.log("Proceeding to payment:", {
      turfId: id,
      slots: selectedSlots,
      paymentOption,
      totalAmount,
      advanceAmount,
      finalAmount: paymentOption === "full" ? totalAmount : advanceAmount,
    });

    // Navigate to payment summary page
    navigate('/payment-summary', {
    state: {
      turf: turf,
      selectedSlots: selectedSlots,
      paymentOption: paymentOption,
      totalAmount: totalAmount,
      advanceAmount: advanceAmount,
      finalAmount: paymentOption === 'full' ? totalAmount : advanceAmount,
      selectedDate: selectedDate,
      courtNumber: selectedCourt,
    }
  });
};

  // ─── Handle Back Navigation ──────────────────────────────────────────
  const handleBack = () => {
    if (turf) {
      navigate(`/turfs/${id}`, { state: { turf } });
    } else {
      navigate(`/turfs/${id}`);
    }
  };

  // ─── Calculations ─────────────────────────────────────────────────────

  const totalAmount = selectedSlots.reduce(
    (sum, slot) => sum + parseFloat(slot.price),
    0,
  );
  const advanceAmount = selectedSlots.reduce(
    (sum, slot) => sum + parseFloat(slot.required_advance),
    0,
  );
  const minSlots = turf?.min_slots || 1;

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="booking-page__loading">
        <div className="spinner-border text-success" role="status" />
        <p>Loading available slots...</p>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────

  if (error || !turf) {
    return (
      <div className="booking-page__error">
        <i className="bi bi-exclamation-triangle-fill" />
        <h3>Failed to load slots</h3>
        <p>{error || "Please try again"}</p>
        <button
          className="booking-page__error-btn"
          onClick={() => navigate(`/turfs`)}
        >
          Back to Turfs
        </button>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="booking-page">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="booking-page__header">
        <button className="booking-page__back-btn" onClick={handleBack}>
          <i className="bi bi-arrow-left" />
          Back
        </button>
        <h1 className="booking-page__title">{turf.name}</h1>
        <div className="booking-page__meta">
          <span className="booking-page__sport">
            {turf.game_type || "Multi-sport"}
          </span>
          <span className="booking-page__hours">
            {turf.open_time} – {turf.close_time}
            {turf.open_time === turf.close_time && " (24 hours)"}
          </span>
        </div>
      </div>

      <div className="booking-page__content">
        {/* ─── Left Column: Calendar ──────────────────────────────────── */}
        <div className="booking-page__calendar-wrapper">
          <div className="booking-page__calendar-card">
            <DatePicker
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
            {/* ✅ ADD: Court selector */}
            {turf?.courts && turf.courts > 1 && (
              <div className="booking-page__court-selector">
                <h4 className="booking-page__court-title">Select Turf/Court</h4>
                <div className="booking-page__court-buttons">
                  {Array.from({ length: turf.courts }, (_, i) => i + 1).map((courtNum) => (
                    <button
                      key={courtNum}
                      className={`booking-page__court-btn ${
                        selectedCourt === courtNum ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSelectedCourt(courtNum);
                        setSelectedSlots([]); // Clear selection on court change
                      }}
                    >
                      Turf {courtNum}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Legend />
          </div>
        </div>

        {/* ─── Right Column: Slots ───────────────────────────────────── */}
        <div className="booking-page__slots-wrapper">
          <div className="booking-page__slots-header">
            <h3 className="booking-page__slots-title">
              Available Slots
              <span className="booking-page__slots-count">
                {slots.length} slots
              </span>
            </h3>
          </div>
          <div className="booking-page__slots-container">
            {slots.length === 0 ? (
              <div className="booking-page__no-slots">
                <i className="bi bi-calendar-x" />
                <p>No slots available for this date</p>
              </div>
            ) : (
              <div className="booking-page__slots-grid">
                {slots.map((slot, index) => (
                  <SlotCard
                    key={index}
                    slot={slot}
                    isSelected={isSlotSelected(slot)}
                    onSelect={() => handleSlotSelect(slot)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Payment Summary ──────────────────────────────────────────── */}
      <PaymentSummary
        selectedSlots={selectedSlots}
        totalAmount={totalAmount}
        advanceAmount={advanceAmount}
        paymentOption={paymentOption}
        onPaymentOptionChange={setPaymentOption}
        minSlots={minSlots}
        onProceed={handleProceed}
      />
    </div>
  );
};

export default BookingPage;
