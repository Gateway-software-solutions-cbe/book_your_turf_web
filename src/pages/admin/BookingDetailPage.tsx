// src/pages/admin/BookingDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { getBooking, cancelBooking } from '../../api/admin/bookings';
import type { Booking, PaymentStatus, BookingType } from '../../types/admin/booking';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCurrency = (val: string) =>
  `₹${parseFloat(val || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ─── Check if booking can be cancelled ───────────────────────────────────────
const canCancelBooking = (booking: Booking): boolean => {
  if (booking.is_cancelled) return false;
  
  // Get today's date (start of day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if any slot is in the future or today
  const hasFutureSlot = booking.slots.some(slot => {
    const slotDate = new Date(slot.date);
    slotDate.setHours(0, 0, 0, 0);
    return slotDate >= today;
  });
  
  return hasFutureSlot;
};

// ─── Badges ────────────────────────────────────────────────────────────────────
const PaymentBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const config = {
    'Fully Paid': { class: 'bg-success', label: 'FULLY PAID' },
    'Advance Paid': { class: 'bg-primary', label: 'ADVANCE PAID' },
    'Pending': { class: 'bg-warning text-dark', label: 'PENDING' },
  };
  const c = config[status] || config.Pending;
  return (
    <span className={`badge rounded-pill px-3 py-2 ${c.class}`}>
      <span className={`d-inline-block rounded-circle me-1 ${status === 'Fully Paid' ? 'bg-white' : status === 'Advance Paid' ? 'bg-white' : 'bg-dark'}`} style={{ width: '6px', height: '6px' }}></span>
      {c.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: BookingType }> = ({ type }) => {
  const config = {
    Online: { class: 'bg-primary', label: 'ONLINE' },
    Offline: { class: 'bg-secondary', label: 'OFFLINE' },
    'Walk-in': { class: 'bg-info text-dark', label: 'WALK-IN' },
  };
  const c = config[type] || config.Offline;
  return <span className={`badge rounded-pill px-3 py-2 ${c.class}`}>{c.label}</span>;
};

// ─── BookingDetailPage ─────────────────────────────────────────────────────────
const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    try {
      const data = await getBooking(numericId);
      setBooking(data);
      console.log("Fetched Booking details:", data);
    } catch {
      setError('Failed to load booking details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [numericId]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const updatedBooking = await cancelBooking(booking.id, true, refundToWallet);
      setBooking(updatedBooking);
      setShowCancelModal(false);
      const message = refundToWallet 
        ? `Booking cancelled successfully. Refund of ${formatCurrency(booking.paid_amount)} processed to wallet.`
        : 'Booking cancelled successfully.';
      alert(message);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary">Loading booking…</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{error ?? 'Booking not found.'}</span>
          <Link to="/admin/bookings" className="btn btn-outline-danger btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const totalSlotPrice = booking.slots.reduce((sum, s) => sum + parseFloat(s.price || '0'), 0);
  const MethodIcon: Record<string, string> = {
    Razorpay: '💳',
    Wallet: '👛',
    Cash: '💵',
  };
  const isAlreadyCancelled = booking.is_cancelled;
  const hasPayment = parseFloat(booking.paid_amount) > 0;
  const isCancellable = canCancelBooking(booking);

  // Get cancellation reason if not cancellable
  const getCancellationReason = (): string => {
    if (isAlreadyCancelled) return 'This booking is already cancelled.';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasFutureSlot = booking.slots.some(slot => {
      const slotDate = new Date(slot.date);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate >= today;
    });
    if (!hasFutureSlot) return 'This booking has already passed and cannot be cancelled.';
    return '';
  };

  return (
    <div className="container-fluid px-4 py-4" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/admin/bookings" className="text-decoration-none text-success">
              <i className="bi bi-calendar-check me-1"></i>Bookings
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {booking.booking_code}
          </li>
        </ol>
      </nav>

      {/* Header Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="card-body p-4 p-md-5">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span className="badge bg-light text-dark rounded-pill px-3 py-2" style={{ fontSize: '11px' }}>
                  <i className="bi bi-receipt me-1"></i> BOOKING
                </span>
                <span className="badge bg-success bg-opacity-25 text-white rounded-pill px-3 py-2" style={{ fontSize: '11px' }}>
                  <i className="bi bi-calendar3 me-1"></i> {formatDate(booking.booked_date)}
                </span>
                {isAlreadyCancelled && (
                  <span className="badge bg-danger rounded-pill px-3 py-2" style={{ fontSize: '11px' }}>
                    <i className="bi bi-x-circle me-1"></i> CANCELLED
                  </span>
                )}
                {!isAlreadyCancelled && !isCancellable && (
                  <span className="badge bg-secondary rounded-pill px-3 py-2" style={{ fontSize: '11px' }}>
                    <i className="bi bi-clock-history me-1"></i> COMPLETED
                  </span>
                )}
              </div>
              <h1 className="text-white fw-bold mb-2" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
                {booking.booking_code}
              </h1>
              <div className="d-flex gap-2 flex-wrap">
                <TypeBadge type={booking.booking_type} />
                <PaymentBadge status={booking.payment_status} />
              </div>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <div className="text-white-50 small">Booking ID</div>
              <div className="text-white fw-bold fs-4">#{booking.id}</div>
              <div className="text-white-50 small mt-1">
                <i className="bi bi-clock me-1"></i> {formatDateTime(booking.created_at)}
              </div>
              {/* Cancel Button - Only show if cancellable */}
              {isCancellable && !isAlreadyCancelled && (
                <button
                  className="btn btn-danger btn-sm rounded-pill px-3 mt-2"
                  onClick={() => setShowCancelModal(true)}
                  disabled={isCancelling}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
              {/* Show disabled reason if not cancellable */}
              {!isCancellable && !isAlreadyCancelled && (
                <div className="mt-2">
                  <span className="badge bg-secondary text-white" style={{ fontSize: '10px' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    {getCancellationReason()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#e8f5e9' }}>
                <i className="bi bi-person text-success fs-5"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Customer</div>
                <div className="fw-semibold text-truncate">{booking.customer?.name}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#e3f2fd' }}>
                <i className="bi bi-building text-primary fs-5"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Partner</div>
                <div className="fw-semibold text-truncate">{booking.partner_name}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#fff3e0' }}>
                <i className="bi bi-grid-3x3-gap-fill text-warning fs-5"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Turf</div>
                <div className="fw-semibold text-truncate">{booking.turf_name}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#fce4ec' }}>
                <i className="bi bi-credit-card text-danger fs-5"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Amount</div>
                <div className="fw-semibold">{formatCurrency(booking.total_amount)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-5">
          {/* Customer Card */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 className="fw-bold text-secondary mb-0">
                <i className="bi bi-person-circle text-success me-2"></i>Customer Details
              </h6>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="small text-secondary fw-semibold">Name</span>
                  <span className="fw-medium">{booking.customer?.name}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="small text-secondary fw-semibold">Email</span>
                  <span className="fw-medium text-end" style={{ wordBreak: 'break-all', maxWidth: '70%' }}>
                    <a href={`mailto:${booking.customer?.email}`} className="text-success text-decoration-none">
                      {booking.customer?.email}
                    </a>
                  </span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="small text-secondary fw-semibold">Phone</span>
                  <span className="fw-medium">{booking.customer?.number}</span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span className="small text-secondary fw-semibold">Type</span>
                  <span className="badge rounded-pill bg-secondary text-capitalize">
                    {booking.customer?.type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Partner & Turf Card */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 className="fw-bold text-secondary mb-0">
                <i className="bi bi-building text-success me-2"></i>Partner & Turf
              </h6>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="small text-secondary fw-semibold">Partner</span>
                  <span className="fw-medium">{booking.partner_name}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="small text-secondary fw-semibold">Business</span>
                  <span className="fw-medium">{booking.partner_business || '—'}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="small text-secondary fw-semibold">Email</span>
                  <span className="fw-medium text-end" style={{ wordBreak: 'break-all', maxWidth: '70%' }}>
                    <a href={`mailto:${booking.partner_email}`} className="text-success text-decoration-none">
                      {booking.partner_email}
                    </a>
                  </span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="small text-secondary fw-semibold">Turf</span>
                  <span className="fw-medium">{booking.turf_name}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="small text-secondary fw-semibold">Turf Code</span>
                  <code className="bg-light px-2 py-0 rounded">{booking.turf_code}</code>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span className="small text-secondary fw-semibold">Court</span>
                  <span className="fw-medium">Court {booking.court_number}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-lg-7">
          {/* Payment Summary */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 className="fw-bold text-secondary mb-0">
                <i className="bi bi-credit-card text-success me-2"></i>Payment Summary
              </h6>
            </div>
            <div className="card-body">
              {/* Main Amount Cards */}
              <div className="row g-3">
                <div className="col-4">
                  <div className="bg-light rounded-3 p-3 text-center">
                    <div className="small text-secondary fw-semibold">Total</div>
                    <div className="fs-5 fw-bold">{formatCurrency(booking.total_amount)}</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="bg-light rounded-3 p-3 text-center">
                    <div className="small text-secondary fw-semibold">Paid</div>
                    <div className="fs-5 fw-bold text-success">{formatCurrency(booking.paid_amount)}</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className={`bg-light rounded-3 p-3 text-center ${parseFloat(booking.pending_amount) > 0 ? 'border border-danger' : ''}`}>
                    <div className="small text-secondary fw-semibold">Pending</div>
                    <div className={`fs-5 fw-bold ${parseFloat(booking.pending_amount) > 0 ? 'text-danger' : 'text-secondary'}`}>
                      {formatCurrency(booking.pending_amount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Section */}
              {parseFloat(booking.total_discount_amount) > 0 && (
                <div className="mt-3 pt-3 border-top">
                  <div className="row g-2">
                    <div className="col-12">
                      <div className="bg-gradient-purple rounded-3 p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="fw-semibold text-white">
                              <i className="bi bi-tag me-2"></i>Total Discount
                            </span>
                            <div className="small text-white-50 mt-1">
                              {parseFloat(booking.admin_discount_amount) > 0 && (
                                <span className="me-3">
                                  <i className="bi bi-person-badge me-1"></i>
                                  Admin: {formatCurrency(booking.admin_discount_amount)}
                                </span>
                              )}
                              {parseFloat(booking.partner_discount_amount) > 0 && (
                                <span>
                                  <i className="bi bi-building me-1"></i>
                                  Partner: {formatCurrency(booking.partner_discount_amount)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="fs-4 fw-bold text-white">
                            -{formatCurrency(booking.total_discount_amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Discounted Total */}
              {parseFloat(booking.total_discount_amount) > 0 && parseFloat(booking.discounted_total_amount) > 0 && (
                <div className="mt-2">
                  <div className="d-flex justify-content-between align-items-center bg-light rounded-3 p-3 border border-success border-opacity-25">
                    <span className="fw-semibold">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Discounted Total
                    </span>
                    <span className="fs-5 fw-bold text-success">
                      {formatCurrency(booking.discounted_total_amount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="d-flex justify-content-between mt-3 pt-3 border-top">
                <div>
                  <span className="small text-secondary fw-semibold">Status</span>
                  <div className="mt-1">
                    <PaymentBadge status={booking.payment_status} />
                    {booking.is_cancelled && (
                      <span className="badge bg-danger ms-2">
                        <i className="bi bi-x-circle me-1"></i>Cancelled
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-end">
                  <span className="small text-secondary fw-semibold">Booking ID</span>
                  <div className="fw-medium">#{booking.id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Slots */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-secondary mb-0">
                <i className="bi bi-clock-history text-success me-2"></i>Booked Slots
              </h6>
              <span className="badge bg-success rounded-pill">{booking.slots.length}</span>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-uppercase text-secondary small fw-bold" style={{ fontSize: '10px' }}>Date</th>
                      <th className="text-uppercase text-secondary small fw-bold" style={{ fontSize: '10px' }}>Start</th>
                      <th className="text-uppercase text-secondary small fw-bold" style={{ fontSize: '10px' }}>End</th>
                      <th className="text-uppercase text-secondary small fw-bold text-end" style={{ fontSize: '10px' }}>Price</th>
                      <th className="text-uppercase text-secondary small fw-bold text-center" style={{ fontSize: '10px' }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.slots.map((slot, i) => {
                      const isPast = new Date(slot.date) < new Date();
                      return (
                        <tr key={i} className={isPast ? 'opacity-75' : ''}>
                          <td className="fw-semibold">
                            {formatDate(slot.date)}
                            {isPast && <span className="badge bg-secondary ms-1" style={{ fontSize: '8px' }}>Past</span>}
                          </td>
                          <td>{slot.start_time}</td>
                          <td>{slot.end_time}</td>
                          <td className="text-end fw-semibold">{formatCurrency(slot.price)}</td>
                          <td className="text-center">
                            {slot.is_next_day ? (
                              <span className="badge rounded-pill bg-warning text-dark">Next Day</span>
                            ) : (
                              <span className="text-secondary">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-light fw-bold">
                      <td colSpan={3}>Total</td>
                      <td className="text-end">{formatCurrency(String(totalSlotPrice))}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Timeline */}
          {booking.payments?.length > 0 && (
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-secondary mb-0">
                  <i className="bi bi-clock-history text-success me-2"></i>Payment Timeline
                </h6>
                <span className="badge bg-success rounded-pill">{booking.payments.length}</span>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  {booking.payments.map((p, i) => (
                    <div key={i} className="d-flex align-items-start gap-3 p-3 bg-light rounded-3">
                      <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                        {MethodIcon[p.method] ?? '💰'}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <span className="fw-semibold">{p.method}</span>
                          <span className="fw-bold text-success">{formatCurrency(p.amount)}</span>
                        </div>
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          <span className="badge rounded-pill bg-secondary text-capitalize" style={{ fontSize: '10px' }}>
                            {p.type}
                          </span>
                          {p.reference && (
                            <code className="bg-white px-2 py-0 rounded" style={{ fontSize: '10px', wordBreak: 'break-all' }}>
                              {p.reference}
                            </code>
                          )}
                          {p.received_by && (
                            <span className="text-secondary small">Received by: {p.received_by}</span>
                          )}
                          <span className="text-secondary small">{formatDateTime(p.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-white rounded-3 p-4"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="fw-bold mb-3">
              <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
              Cancel Booking
            </h5>
            <p className="text-secondary mb-3">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            
            <div className="mb-3 p-3 bg-light rounded-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-secondary">Booking Code</span>
                <span className="fw-semibold">{booking.booking_code}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-secondary">Customer</span>
                <span className="fw-semibold">{booking.customer?.name}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-secondary">Amount Paid</span>
                <span className="fw-semibold">{formatCurrency(booking.paid_amount)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Status</span>
                <span><PaymentBadge status={booking.payment_status} /></span>
              </div>
            </div>

            {hasPayment && (
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="refundToWallet"
                  checked={refundToWallet}
                  onChange={(e) => setRefundToWallet(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="refundToWallet">
                  <span className="fw-semibold">Refund to wallet</span>
                  <div className="small text-secondary">
                    Refund the paid amount ({formatCurrency(booking.paid_amount)}) to customer's wallet
                  </div>
                </label>
              </div>
            )}

            <div className="d-flex gap-2 justify-content-end mt-3">
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm rounded-pill px-3"
                onClick={handleCancelBooking}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Processing...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bg-gradient-purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
        }
        .text-purple {
          color: #8b5cf6;
        }
        .bg-purple {
          background-color: #8b5cf6;
        }
        .bg-opacity-10 {
          opacity: 0.1;
        }
        .border-dashed {
          border-style: dashed !important;
        }
        .opacity-75 {
          opacity: 0.75;
        }
      `}</style>
    </div>
  );
};

export default BookingDetailPage;