// src/pages/admin/BookingDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getBooking, cancelBooking } from '../../api/admin/bookings';
import type { Booking, PaymentStatus, BookingType } from '../../types/admin/booking';
import './tbm-theme.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatCurrency = (val: string) =>
  `₹${parseFloat(val || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const canCancelBooking = (booking: Booking): boolean => {
  if (booking.is_cancelled) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return booking.slots.some((slot) => {
    const slotDate = new Date(slot.date);
    slotDate.setHours(0, 0, 0, 0);
    return slotDate >= today;
  });
};

const METHOD_ICON: Record<string, string> = { Razorpay: '💳', Wallet: '👛', Cash: '💵' };

// ─── Badges ─────────────────────────────────────────────────────────────────
const TypeBadge: React.FC<{ type: BookingType }> = ({ type }) => {
  const cls = type === 'Online' ? 'tbm-badge-online' : type === 'Walk-in' ? 'tbm-badge-walkin' : 'tbm-badge-offline';
  return <span className={`tbm-badge ${cls}`} style={{ padding: '6px 14px', fontSize: 10 }}>{type}</span>;
};

const PaymentBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const cls = status === 'Fully Paid' ? 'tbm-badge-paid' : status === 'Advance Paid' ? 'tbm-badge-partial' : 'tbm-badge-unpaid';
  return <span className={`tbm-badge ${cls}`} style={{ padding: '6px 14px', fontSize: 10 }}>{status}</span>;
};

// ─── BookingDetailPage ──────────────────────────────────────────────────────
const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [theme] = useState<'light' | 'dark'>(() => (localStorage.getItem('tbm-theme') as 'light' | 'dark') || 'light');
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
      setError('Failed to load booking details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [numericId]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const updated = await cancelBooking(booking.id, true, refundToWallet);
      setBooking(updated);
      setShowCancelModal(false);
      alert(
        refundToWallet
          ? `Booking cancelled successfully. Refund of ${formatCurrency(booking.paid_amount)} processed to wallet.`
          : 'Booking cancelled successfully.'
      );
    } catch {
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="tbm-app" data-theme={theme === 'dark' ? 'dark' : undefined}>
        <div className="tbm-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px' }}>
          <div className="tbm-loader"></div>
          <div className="tbm-loader-text">Loading booking…</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="tbm-app" data-theme={theme === 'dark' ? 'dark' : undefined}>
        <div className="tbm-container">
          <div className="tbm-toast error" style={{ minWidth: 0, justifyContent: 'space-between' }}>
            <span className="tbm-toast-message">{error ?? 'Booking not found.'}</span>
            <Link to="/admin/bookings" className="tbm-btn tbm-btn-outline">← Back to Bookings</Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSlotPrice = booking.slots.reduce((sum, s) => sum + parseFloat(s.price || '0'), 0);
  const isAlreadyCancelled = booking.is_cancelled;
  const hasPayment = parseFloat(booking.paid_amount) > 0;
  const isCancellable = canCancelBooking(booking);
  const hasDiscount = parseFloat(booking.total_discount_amount || '0') > 0;

  const cancellationReason = () => {
    if (isAlreadyCancelled) return 'This booking is already cancelled.';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasFutureSlot = booking.slots.some((s) => { const d = new Date(s.date); d.setHours(0, 0, 0, 0); return d >= today; });
    return hasFutureSlot ? '' : 'This booking has already passed and cannot be cancelled.';
  };

  return (
    <div className="tbm-app" data-theme={theme === 'dark' ? 'dark' : undefined}>
      <div className="tbm-container">
        <nav className="tbm-breadcrumb">
          <Link to="/admin/bookings">📅 Bookings</Link>
          <span>/</span>
          <span>{booking.booking_code}</span>
        </nav>

        {/* Hero */}
        <div className="tbm-hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className="tbm-hero-chip">🧾 BOOKING</span>
                <span className="tbm-hero-chip">📅 {formatDate(booking.booked_date)}</span>
                {isAlreadyCancelled && (
                  <span className="tbm-hero-chip" style={{ background: 'rgba(239,68,68,0.35)' }}>✕ CANCELLED</span>
                )}
                {!isAlreadyCancelled && !isCancellable && (
                  <span className="tbm-hero-chip">🕘 COMPLETED</span>
                )}
              </div>
              <div className="tbm-hero-code">{booking.booking_code}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <TypeBadge type={booking.booking_type} />
                <PaymentBadge status={booking.payment_status} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="tbm-hero-id">Booking ID</div>
              <div className="tbm-hero-id-value">#{booking.id}</div>
              <div className="tbm-hero-created">🕐 {formatDateTime(booking.created_at)}</div>
              {isCancellable && !isAlreadyCancelled && (
                <div>
                  <button className="tbm-cancel-btn-hero" onClick={() => setShowCancelModal(true)} disabled={isCancelling}>
                    ✕ {isCancelling ? 'Cancelling…' : 'Cancel Booking'}
                  </button>
                </div>
              )}
              {!isCancellable && !isAlreadyCancelled && (
                <div className="tbm-hero-chip" style={{ marginTop: 10 }}>ℹ️ {cancellationReason()}</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="tbm-quick-stats">
          <div className="tbm-quick-stat">
            <div className="tbm-quick-stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>👤</div>
            <div>
              <div className="tbm-detail-label">Customer</div>
              <div className="tbm-detail-value">{booking.customer?.name}</div>
            </div>
          </div>
          <div className="tbm-quick-stat">
            <div className="tbm-quick-stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>🏢</div>
            <div>
              <div className="tbm-detail-label">Partner</div>
              <div className="tbm-detail-value">{booking.partner_name}</div>
            </div>
          </div>
          <div className="tbm-quick-stat">
            <div className="tbm-quick-stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>⚽</div>
            <div>
              <div className="tbm-detail-label">Turf</div>
              <div className="tbm-detail-value">{booking.turf_name}</div>
            </div>
          </div>
          <div className="tbm-quick-stat">
            <div className="tbm-quick-stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>💳</div>
            <div>
              <div className="tbm-detail-label">Amount</div>
              <div className="tbm-detail-value">{formatCurrency(booking.total_amount)}</div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 5fr) minmax(320px, 7fr)', gap: 20 }} className="tbm-detail-cols">
          {/* Left column */}
          <div>
            <div className="tbm-card">
              <div className="tbm-card-header"><h3>👤 Customer Details</h3></div>
              <div className="tbm-card-body">
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Name</span><span className="tbm-detail-row-value">{booking.customer?.name}</span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Email</span><span className="tbm-detail-row-value"><a href={`mailto:${booking.customer?.email}`}>{booking.customer?.email}</a></span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Phone</span><span className="tbm-detail-row-value">{booking.customer?.number || booking.customer?.mobile}</span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Type</span><span className="tbm-badge tbm-badge-offline" style={{ textTransform: 'capitalize' }}>{booking.customer?.type}</span></div>
              </div>
            </div>

            <div className="tbm-card">
              <div className="tbm-card-header"><h3>🏢 Partner &amp; Turf</h3></div>
              <div className="tbm-card-body">
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Partner</span><span className="tbm-detail-row-value">{booking.partner_name}</span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Business</span><span className="tbm-detail-row-value">{booking.partner_business || '—'}</span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Email</span><span className="tbm-detail-row-value"><a href={`mailto:${booking.partner_email}`}>{booking.partner_email}</a></span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Turf</span><span className="tbm-detail-row-value">{booking.turf_name}</span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Turf Code</span><span className="tbm-booking-code">{booking.turf_code}</span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Court</span><span className="tbm-detail-row-value">Court {booking.court_number}</span></div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className="tbm-card">
              <div className="tbm-card-header"><h3>💳 Payment Summary</h3></div>
              <div className="tbm-card-body">
                <div className="tbm-payment-columns">
                  <div className="tbm-payment-amount-card">
                    <div className="label">Total</div>
                    <div className="value">{formatCurrency(booking.total_amount)}</div>
                  </div>
                  <div className="tbm-payment-amount-card">
                    <div className="label">Paid</div>
                    <div className="value" style={{ color: 'var(--success)' }}>{formatCurrency(booking.paid_amount)}</div>
                  </div>
                  <div className={`tbm-payment-amount-card ${parseFloat(booking.pending_amount) > 0 ? 'pending-highlight' : ''}`}>
                    <div className="label">Pending</div>
                    <div className="value" style={{ color: parseFloat(booking.pending_amount) > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {formatCurrency(booking.pending_amount)}
                    </div>
                  </div>
                </div>

                {hasDiscount && (
                  <div className="tbm-discount-banner">
                    <div>
                      <div style={{ fontWeight: 700 }}>🏷️ Total Discount</div>
                      <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                        {parseFloat(booking.admin_discount_amount) > 0 && <span style={{ marginRight: 12 }}>Admin: {formatCurrency(booking.admin_discount_amount)}</span>}
                        {parseFloat(booking.partner_discount_amount) > 0 && <span>Partner: {formatCurrency(booking.partner_discount_amount)}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>-{formatCurrency(booking.total_discount_amount)}</div>
                  </div>
                )}

                {hasDiscount && parseFloat(booking.discounted_total_amount) > 0 && (
                  <div className="tbm-discount-total-row">
                    <span style={{ fontWeight: 700 }}>✅ Discounted Total</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(booking.discounted_total_amount)}</span>
                  </div>
                )}

                <div className="tbm-detail-row" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                  <span className="tbm-detail-row-label">Status</span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <PaymentBadge status={booking.payment_status} />
                    {booking.is_cancelled && <span className="tbm-badge tbm-badge-cancelled">Cancelled</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Slots */}
            <div className="tbm-card">
              <div className="tbm-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>⏰ Booked Slots</h3>
                <span className="tbm-badge tbm-badge-paid">{booking.slots.length}</span>
              </div>
              <div className="tbm-card-body">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {booking.slots.map((slot, i) => {
                    const isPast = new Date(slot.date) < new Date();
                    return (
                      <div className="tbm-slot-chip" key={i} style={{ padding: '10px 14px', fontSize: 12 }}>
                        <span className="tbm-slot-date">📅 {formatDate(slot.date)}</span>
                        <span className="tbm-slot-time" style={{ fontSize: 12 }}>🕐 {slot.start_time} - {slot.end_time}</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(slot.price)}</span>
                        {slot.is_next_day && <span className="tbm-badge tbm-badge-partial" style={{ fontSize: 8 }}>Next Day</span>}
                        {isPast && <span className="tbm-badge tbm-badge-offline" style={{ fontSize: 8 }}>Past</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="tbm-detail-row" style={{ fontWeight: 700 }}>
                  <span className="tbm-detail-row-label">Total</span>
                  <span className="tbm-detail-row-value">{formatCurrency(String(totalSlotPrice))}</span>
                </div>
              </div>
            </div>

            {/* Payment timeline */}
            {booking.payments?.length > 0 && (
              <div className="tbm-card">
                <div className="tbm-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>🕘 Payment Timeline</h3>
                  <span className="tbm-badge tbm-badge-paid">{booking.payments.length}</span>
                </div>
                <div className="tbm-card-body">
                  {booking.payments.map((p, i) => (
                    <div className="tbm-payment-item" key={i}>
                      <div className="tbm-payment-icon">{METHOD_ICON[p.method] ?? '💰'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontWeight: 700 }}>{p.method}</span>
                          <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(p.amount)}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, alignItems: 'center' }}>
                          <span className="tbm-badge tbm-badge-offline" style={{ textTransform: 'capitalize' }}>{p.type}</span>
                          {p.reference && <span className="tbm-booking-code">{p.reference}</span>}
                          {p.received_by && <span className="tbm-detail-row-label" style={{ textTransform: 'none' }}>Received by: {p.received_by}</span>}
                          <span className="tbm-detail-row-label" style={{ textTransform: 'none' }}>{formatDateTime(p.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="tbm-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="tbm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="tbm-modal-header danger">
              <h3 className="tbm-modal-title">⚠️ Cancel Booking</h3>
              <button className="tbm-modal-close" onClick={() => setShowCancelModal(false)}>✕</button>
            </div>
            <div className="tbm-modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Booking Code</span><span className="tbm-detail-row-value">{booking.booking_code}</span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Customer</span><span className="tbm-detail-row-value">{booking.customer?.name}</span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Amount Paid</span><span className="tbm-detail-row-value">{formatCurrency(booking.paid_amount)}</span></div>
                <div className="tbm-detail-row"><span className="tbm-detail-row-label">Status</span><PaymentBadge status={booking.payment_status} /></div>
              </div>

              {hasPayment && (
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={refundToWallet} onChange={(e) => setRefundToWallet(e.target.checked)} style={{ width: 'auto', marginTop: 3 }} />
                  <span>
                    <div style={{ fontWeight: 700 }}>Refund to wallet</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Refund the paid amount ({formatCurrency(booking.paid_amount)}) to customer's wallet
                    </div>
                  </span>
                </label>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="tbm-btn tbm-btn-outline" onClick={() => setShowCancelModal(false)} disabled={isCancelling}>Cancel</button>
                <button className="tbm-btn tbm-btn-danger" onClick={handleCancelBooking} disabled={isCancelling}>
                  {isCancelling ? 'Processing…' : 'Confirm Cancellation'}
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