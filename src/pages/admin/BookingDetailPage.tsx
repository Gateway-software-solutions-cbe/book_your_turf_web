// src/pages/admin/BookingDetailPage.tsx

import React, { useEffect, useState } from "react";

import { useParams, Link, Navigate, useNavigate } from "react-router-dom";

import { getBooking, cancelBooking } from "../../api/admin/bookings";

import type {
  Booking,
  PaymentStatus,
  BookingType,
} from "../../types/admin/booking";

import {
  getDisplayPaymentStatus,
  getFullyPaidAmount,
  getAdvanceColumnAmount,
  getPaymentTimelineTitle,
  getPaymentTimelineStatus,
  getChronologicalBookingPayments,
  getTotalCollectedAmount,
} from "../../utils/bookingPayment";

import "./tbm-theme.css";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (val: string) =>
  `₹${parseFloat(val || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const SUPER_ADMIN_EMAIL = "bytsuperadmin@gmail.com";

const isSuperAdminAccount = (): boolean => {
  try {
    const storedUser = localStorage.getItem("admin_user");

    if (!storedUser) {
      return false;
    }

    const adminUser = JSON.parse(storedUser);

    return (
      adminUser.email?.trim().toLowerCase() ===
        SUPER_ADMIN_EMAIL &&
      adminUser.role === "super_admin"
    );
  } catch {
    return false;
  }
};

const parseTimeToMinutes = (
  time: string,
): number | null => {
  const match = time
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (
    hours < 1 ||
    hours > 12 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  hours = hours % 12;

  if (period === "PM") {
    hours += 12;
  }

  return hours * 60 + minutes;
};

const getSlotEndDateTime = (
  slot: Booking["slots"][number],
): Date | null => {
  const startMinutes = parseTimeToMinutes(
    slot.start_time,
  );

  const endMinutes = parseTimeToMinutes(
    slot.end_time,
  );

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  // Build the date in the browser's local timezone.
  const endDate = new Date(`${slot.date}T00:00:00`);

  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  endDate.setMinutes(endMinutes);

  // Handle overnight slots, such as 11 PM - 12 AM.
  if (
    slot.is_next_day ||
    endMinutes <= startMinutes
  ) {
    endDate.setDate(endDate.getDate() + 1);
  }

  return endDate;
};

const canCancelBooking = (
  booking: Booking,
): boolean => {
  if (booking.is_cancelled) {
    return false;
  }

  const now = Date.now();

  // A booking remains cancellable only while at least
  // one of its slots has not ended.
  return booking.slots.some((slot) => {
    const slotEnd = getSlotEndDateTime(slot);

    return (
      slotEnd !== null &&
      slotEnd.getTime() > now
    );
  });
};

const METHOD_ICON: Record<string, string> = {
  Razorpay: "💳",
  Wallet: "👛",
  Cash: "💵",
};

type DisplayBookingStatus = "Fully Paid" | "Partially Paid" | "Cancelled";

const getBookingDisplayStatus = (
  booking: Booking,
): DisplayBookingStatus => {
  if (booking.is_cancelled) {
    return "Cancelled";
  }

  const status = getDisplayPaymentStatus(booking);

  return status === "Fully Paid"
    ? "Fully Paid"
    : "Partially Paid";
};

// ─── Badges ─────────────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: BookingType }> = ({ type }) => {
  const cls =
    type === "Online"
      ? "tbm-badge-online"
      : type === "Walk-in"
        ? "tbm-badge-walkin"
        : "tbm-badge-offline";

  return (
    <span
      className={`tbm-badge ${cls}`}
      style={{ padding: "6px 14px", fontSize: 10 }}
    >
      {type}
    </span>
  );
};

const BookingStatusBadge: React.FC<{
  status: DisplayBookingStatus;
}> = ({ status }) => {
  const cls =
    status === "Fully Paid"
      ? "tbm-badge-paid"
      : status === "Cancelled"
        ? "tbm-badge-cancelled"
        : "tbm-badge-partial";

  return (
    <span
      className={`tbm-badge ${cls}`}
      style={{ padding: "6px 14px", fontSize: 10 }}
    >
      {status}
    </span>
  );
};

// Payment Timeline intentionally keeps payment-stage labels:
// Fully Paid or Advance Paid.
const TimelinePaymentBadge: React.FC<{
  status: PaymentStatus;
}> = ({ status }) => {
  const cls =
    status === "Fully Paid"
      ? "tbm-badge-paid"
      : status === "Advance Paid"
        ? "tbm-badge-partial"
        : "tbm-badge-unpaid";

  return (
    <span className={`tbm-badge ${cls}`}>
      {status}
    </span>
  );
};

// ─── BookingDetailPage ──────────────────────────────────────────────────────

const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [theme] = useState<"light" | "dark">(
    () => (localStorage.getItem("tbm-theme") as "light" | "dark") || "light",
  );

  const [booking, setBooking] = useState<Booking | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [isCancelling, setIsCancelling] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);

  const [refundToWallet, setRefundToWallet] = useState(false);

  const numericId = Number(id);

  if (!id || isNaN(numericId)) return <Navigate to="/admin/bookings" replace />;

  const fetchBooking = async () => {
    setIsLoading(true);

    setError(null);

    try {
      const data = await getBooking(numericId);

      setBooking(data);
    } catch {
      setError("Failed to load booking details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [numericId]);

  const handleCancelBooking = async () => {
  if (!booking) return;

  if (!isSuperAdminAccount()) {
    alert("Only the Super Admin can cancel bookings.");
    return;
  }

  if (!canCancelBooking(booking)) {
    alert(
      "This booking has already ended or is no longer eligible for cancellation.",
    );
    return;
  }

  setIsCancelling(true);

  try {
    const updated = await cancelBooking(
      booking.id,
      true,
      refundToWallet,
    );

    setBooking(updated);
    setShowCancelModal(false);

    alert(
      refundToWallet
        ? `Booking cancelled successfully. Refund of ${formatCurrency(
            booking.paid_amount,
          )} processed to wallet.`
        : "Booking cancelled successfully.",
    );
  } catch {
    alert("Failed to cancel booking. Please try again.");
  } finally {
    setIsCancelling(false);
  }
};

  if (isLoading) {
    return (
      <div
        className="tbm-app"
        data-theme={theme === "dark" ? "dark" : undefined}
      >
        <div
          className="tbm-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "80px 20px",
          }}
        >
          <div className="tbm-loader"></div>

          <div className="tbm-loader-text">Loading booking…</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div
        className="tbm-app"
        data-theme={theme === "dark" ? "dark" : undefined}
      >
        <div className="tbm-container">
          <div
            className="tbm-toast error"
            style={{ minWidth: 0, justifyContent: "space-between" }}
          >
            <span className="tbm-toast-message">
              {error ?? "Booking not found."}
            </span>

            <Link to="/admin/bookings" className="tbm-btn tbm-btn-outline">
              ← Back to Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSlotPrice = booking.slots.reduce(
    (sum, s) => sum + parseFloat(s.price || "0"),
    0,
  );

  const isAlreadyCancelled = booking.is_cancelled;

const isSuperAdmin = isSuperAdminAccount();

const isCancellable =
  isSuperAdmin && canCancelBooking(booking);
  const hasPayment = parseFloat(booking.paid_amount) > 0;

  

  const hasDiscount = parseFloat(booking.total_discount_amount || "0") > 0;

  const displayBookingStatus = getBookingDisplayStatus(booking);

  const cancellationReason = () => {
  if (isAlreadyCancelled) {
    return "This booking is already cancelled.";
  }

  if (!isSuperAdmin) {
    return "Only the Super Admin can cancel bookings.";
  }

  return "This booking has already ended and cannot be cancelled.";
};

  return (
    <div className="tbm-app" data-theme={theme === "dark" ? "dark" : undefined}>
      <div className="tbm-container">
        <button
          type="button"
          className="tbm-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back to Bookings
        </button>

        <nav className="tbm-breadcrumb">
          <Link
            to="/admin/bookings"
            onClick={(e) => {
              e.preventDefault();
              navigate(-1);
            }}
          >
            📅 Bookings
          </Link>

          <span>/</span>

          <span>{booking.booking_code}</span>
        </nav>

        {/* Hero */}

        <div className="tbm-hero">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <span className="tbm-hero-chip">🧾 BOOKING</span>

                <span className="tbm-hero-chip">
                  📅 {formatDate(booking.booked_date)}
                </span>

                {isAlreadyCancelled && (
                  <span
                    className="tbm-hero-chip"
                    style={{ background: "rgba(239,68,68,0.35)" }}
                  >
                    ✕ CANCELLED
                  </span>
                )}

                {!isAlreadyCancelled && !isCancellable && (
                  <span className="tbm-hero-chip">🕘 COMPLETED</span>
                )}
              </div>

              <div className="tbm-hero-code">{booking.booking_code}</div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <TypeBadge type={booking.booking_type} />

                <BookingStatusBadge status={displayBookingStatus} />
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div className="tbm-hero-id">Booking ID</div>

              <div className="tbm-hero-id-value">#{booking.id}</div>

              <div className="tbm-hero-created">
                🕐 {formatDateTime(booking.created_at)}
              </div>

              {isCancellable && !isAlreadyCancelled && (
                <div>
                  <button
                    className="tbm-cancel-btn-hero"
                    onClick={() => setShowCancelModal(true)}
                    disabled={isCancelling}
                  >
                    ✕ {isCancelling ? "Cancelling…" : "Cancel Booking"}
                  </button>
                </div>
              )}

              {!isCancellable && !isAlreadyCancelled && (
                <div className="tbm-hero-chip" style={{ marginTop: 10 }}>
                  ℹ️ {cancellationReason()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}

        <div className="tbm-quick-stats">
          <div className="tbm-quick-stat">
            <div
              className="tbm-quick-stat-icon"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              👤
            </div>

            <div>
              <div className="tbm-detail-label">Customer</div>

              <div className="tbm-detail-value">{booking.customer?.name}</div>
            </div>
          </div>

          <div className="tbm-quick-stat">
            <div
              className="tbm-quick-stat-icon"
              style={{ background: "rgba(59,130,246,0.15)" }}
            >
              🏢
            </div>

            <div>
              <div className="tbm-detail-label">Partner</div>

              <div className="tbm-detail-value">{booking.partner_name}</div>
            </div>
          </div>

          <div className="tbm-quick-stat">
            <div
              className="tbm-quick-stat-icon"
              style={{ background: "rgba(245,158,11,0.15)" }}
            >
              ⚽
            </div>

            <div>
              <div className="tbm-detail-label">Turf</div>

              <div className="tbm-detail-value">{booking.turf_name}</div>
            </div>
          </div>

          <div className="tbm-quick-stat">
            <div
              className="tbm-quick-stat-icon"
              style={{ background: "rgba(239,68,68,0.15)" }}
            >
              💳
            </div>

            <div>
              <div className="tbm-detail-label">Amount</div>

              <div className="tbm-detail-value">
                {formatCurrency(booking.total_amount)}
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 5fr) minmax(320px, 7fr)",
            gap: 20,
          }}
          className="tbm-detail-cols"
        >
          {/* Left column */}

          <div>
            <div className="tbm-card">
              <div className="tbm-card-header">
                <h3>👤 Customer Details</h3>
              </div>

              <div className="tbm-card-body">
                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Name</span>
                  <span className="tbm-detail-row-value">
                    {booking.customer?.name}
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Email</span>
                  <span className="tbm-detail-row-value">
                    <a href={`mailto:${booking.customer?.email}`}>
                      {booking.customer?.email}
                    </a>
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Phone</span>
                  <span className="tbm-detail-row-value">
                    {booking.customer?.number || booking.customer?.mobile}
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Type</span>
                  <span
                    className="tbm-badge tbm-badge-offline"
                    style={{ textTransform: "capitalize" }}
                  >
                    {booking.customer?.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="tbm-card">
              <div className="tbm-card-header">
                <h3>🏢 Partner &amp; Turf</h3>
              </div>

              <div className="tbm-card-body">
                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Partner</span>
                  <span className="tbm-detail-row-value">
                    {booking.partner_name}
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Phone</span>
                  <span className="tbm-detail-row-value">
                    {booking.partner_number || "—"}
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Email</span>
                  <span className="tbm-detail-row-value">
                    <a href={`mailto:${booking.partner_email}`}>
                      {booking.partner_email}
                    </a>
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Turf</span>
                  <span className="tbm-detail-row-value">
                    {booking.turf_name}
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Turf Code</span>
                  <span className="tbm-booking-code">{booking.turf_code}</span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Court</span>
                  <span className="tbm-detail-row-value">
                    Court {booking.court_number}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}

          <div>
            <div className="tbm-card">
              <div className="tbm-card-header">
                <h3>💳 Payment Summary</h3>
              </div>

              <div className="tbm-card-body">
                <div className="tbm-payment-columns">
                  <div className="tbm-payment-amount-card">
                    <div className="label">Total</div>

                    <div className="value">
                      {formatCurrency(booking.total_amount)}
                    </div>
                  </div>

                  <div className="tbm-payment-amount-card">
                    <div className="label">Fully Paid</div>

                    <div className="value" style={{ color: "var(--success)" }}>
                      {formatCurrency(String(getFullyPaidAmount(booking)))}
                    </div>
                  </div>

                  <div
                    className={`tbm-payment-amount-card ${parseFloat(booking.pending_amount) > 0 ? "pending-highlight" : ""}`}
                  >
                    <div className="label">Advance Paid</div>

                    <div
                      className="value"
                      style={{
                        color:
                          parseFloat(booking.pending_amount) > 0
                            ? "var(--danger)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {formatCurrency(String(getAdvanceColumnAmount(booking)))}
                    </div>
                  </div>
                </div>

                {hasDiscount && (
                  <div className="tbm-discount-banner">
                    <div>
                      <div style={{ fontWeight: 700 }}>🏷️ Total Discount</div>

                      <div
                        style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}
                      >
                        {parseFloat(booking.admin_discount_amount) > 0 && (
                          <span style={{ marginRight: 12 }}>
                            Admin:{" "}
                            {formatCurrency(booking.admin_discount_amount)}
                          </span>
                        )}

                        {parseFloat(booking.partner_discount_amount) > 0 && (
                          <span>
                            Partner:{" "}
                            {formatCurrency(booking.partner_discount_amount)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 800 }}>
                      -{formatCurrency(booking.total_discount_amount)}
                    </div>
                  </div>
                )}

                {hasDiscount &&
                  parseFloat(booking.discounted_total_amount) > 0 && (
                    <div className="tbm-discount-total-row">
                      <span style={{ fontWeight: 700 }}>
                        ✅ Discounted Total
                      </span>

                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "var(--success)",
                        }}
                      >
                        {formatCurrency(booking.discounted_total_amount)}
                      </span>
                    </div>
                  )}

                <div
                  className="tbm-detail-row"
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: "1px solid var(--border-color)",
                  }}
                >
                  <span className="tbm-detail-row-label">Status</span>

                  <span
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <BookingStatusBadge status={displayBookingStatus} />
                  </span>
                </div>
              </div>
            </div>

            {/* Slots */}

            <div className="tbm-card">
              <div
                className="tbm-card-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3>⏰ Booked Slots</h3>

                <span className="tbm-badge tbm-badge-paid">
                  {booking.slots.length}
                </span>
              </div>

              <div className="tbm-card-body">
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {booking.slots.map((slot, i) => {
                    const isPast = new Date(slot.date) < new Date();

                    return (
                      <div
                        className="tbm-slot-chip"
                        key={i}
                        style={{ padding: "10px 14px", fontSize: 12 }}
                      >
                        <span className="tbm-slot-date">
                          📅 {formatDate(slot.date)}
                        </span>

                        <span
                          className="tbm-slot-time"
                          style={{ fontSize: 12 }}
                        >
                          🕐 {slot.start_time} - {slot.end_time}
                        </span>

                        <span style={{ fontWeight: 700 }}>
                          {formatCurrency(slot.price)}
                        </span>

                        {slot.is_next_day && (
                          <span
                            className="tbm-badge tbm-badge-partial"
                            style={{ fontSize: 8 }}
                          >
                            Next Day
                          </span>
                        )}

                        {isPast && (
                          <span
                            className="tbm-badge tbm-badge-offline"
                            style={{ fontSize: 8 }}
                          >
                            Past
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="tbm-detail-row" style={{ fontWeight: 700 }}>
                  <span className="tbm-detail-row-label">Total</span>

                  <span className="tbm-detail-row-value">
                    {formatCurrency(String(totalSlotPrice))}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment timeline */}

            {booking.payments?.length > 0 && (
              <div className="tbm-card">
                <div
                  className="tbm-card-header"
                  style={{
                    display: "flex",

                    justifyContent: "space-between",

                    alignItems: "center",
                  }}
                >
                  <h3>🕘 Payment Timeline</h3>

                  <span className="tbm-badge tbm-badge-paid">
                    {booking.payments.length}
                  </span>
                </div>

                <div className="tbm-card-body">
                  {getChronologicalBookingPayments(booking).map(
  ({ payment: p, originalIndex: i }) => {
                    const timelineTitle = getPaymentTimelineTitle(
                      p,

                      i,

                      booking,
                    );

                    const timelineStatus = getPaymentTimelineStatus(
                      p,

                      i,

                      booking,
                    );

                    return (
                      <div
                        className="tbm-payment-item"
                        key={`${p.date}-${p.reference ?? i}`}
                      >
                        <div className="tbm-payment-icon">
                          {METHOD_ICON[p.method] ?? "💰"}
                        </div>

                        <div
                          style={{
                            flex: 1,

                            minWidth: 0,
                          }}
                        >
                          {/* Payment title + amount */}

                          <div
                            style={{
                              display: "flex",

                              justifyContent: "space-between",

                              flexWrap: "wrap",

                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                              }}
                            >
                              {timelineTitle}
                            </span>

                            <span
                              style={{
                                fontWeight: 800,

                                color: "var(--success)",
                              }}
                            >
                              {formatCurrency(p.amount)}
                            </span>
                          </div>

                          {/* Status + metadata */}

                          <div
                            style={{
                              display: "flex",

                              flexWrap: "wrap",

                              gap: 8,

                              marginTop: 6,

                              alignItems: "center",
                            }}
                          >
                            <TimelinePaymentBadge status={timelineStatus} />

                            {p.reference && (
                              <span className="tbm-booking-code">
                                {p.reference}
                              </span>
                            )}

                            {p.received_by && (
                              <span
                                className="tbm-detail-row-label"
                                style={{
                                  textTransform: "none",
                                }}
                              >
                                Received by: {p.received_by}
                              </span>
                            )}

                            <span
                              className="tbm-detail-row-label"
                              style={{
                                textTransform: "none",
                              }}
                            >
                              {formatDateTime(p.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel modal */}

      {showCancelModal && (
        <div
          className="tbm-modal-overlay"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="tbm-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tbm-modal-header danger">
              <h3 className="tbm-modal-title">⚠️ Cancel Booking</h3>

              <button
                className="tbm-modal-close"
                onClick={() => setShowCancelModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="tbm-modal-body">
              <p style={{ color: "var(--text-secondary)", marginBottom: 14 }}>
                Are you sure you want to cancel this booking? This action cannot
                be undone.
              </p>

              <div
                style={{
                  background: "var(--bg-tertiary)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Booking Code</span>
                  <span className="tbm-detail-row-value">
                    {booking.booking_code}
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Customer</span>
                  <span className="tbm-detail-row-value">
                    {booking.customer?.name}
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Amount Paid</span>
                  <span className="tbm-detail-row-value">
                    {formatCurrency(booking.paid_amount)}
                  </span>
                </div>

                <div className="tbm-detail-row">
                  <span className="tbm-detail-row-label">Status</span>
                  <BookingStatusBadge status={displayBookingStatus} />
                </div>
              </div>

              {hasPayment && (
                <label
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    marginBottom: 14,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={refundToWallet}
                    onChange={(e) => setRefundToWallet(e.target.checked)}
                    style={{ width: "auto", marginTop: 3 }}
                  />

                  <span>
                    <div style={{ fontWeight: 700 }}>Refund to wallet</div>

                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Refund the paid amount (
                      {formatCurrency(booking.paid_amount)}) to customer's
                      wallet
                    </div>
                  </span>
                </label>
              )}

              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  className="tbm-btn tbm-btn-outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                >
                  Cancel
                </button>

                <button
                  className="tbm-btn tbm-btn-danger"
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Processing…" : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`

        @media (max-width: 900px) {

          .tbm-detail-cols { grid-template-columns: 1fr !important; }

        }

      `}</style>
    </div>
  );
};

export default BookingDetailPage;