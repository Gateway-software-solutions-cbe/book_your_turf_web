// src/pages/user/BookingsListPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listBookings, cancelBooking, payBalance, payBalanceWallet } from '../../api/user/bookings';
import { useUserAuth } from '../../context/UserAuthContext';
import type { Booking, BookingSlotDetail } from '../../types/user/booking';
import './style/BookingsPage.css';

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── Slot datetime helpers ────────────────────────────────────────────────
const getSlotStartDateTime = (date: string, time: string): Date =>
  new Date(`${date}T${time}:00`);

// Earliest slot start across all slots (used for cancel cutoff)
const getEarliestSlotStart = (booking: Booking): Date | null => {
  if (!booking.slots || booking.slots.length === 0) return null;
  return booking.slots
    .map((s) => getSlotStartDateTime(s.date, s.start_time))
    .reduce((min, d) => (d < min ? d : min));
};

// Latest slot start across all slots (used for "past" detection)
const getLatestSlotStart = (booking: Booking): Date | null => {
  if (!booking.slots || booking.slots.length === 0) return null;
  return booking.slots
    .map((s) => getSlotStartDateTime(s.date, s.start_time))
    .reduce((max, d) => (d > max ? d : max));
};

// Booking is "past" once the LAST slot has already started
const isPastBooking = (booking: Booking): boolean => {
  const latest = getLatestSlotStart(booking);
  if (!latest) return false;
  return latest.getTime() < Date.now();
};

// ─── Cancellation policy: 6 hours before earliest slot start ──────────────
const CANCEL_CUTOFF_HOURS = 6;

const canCancelBooking = (booking: Booking): boolean => {
  if (booking.is_cancelled) return false;
  if (parseFloat(booking.paid_amount) <= 0) return false;

  const earliest = getEarliestSlotStart(booking);
  if (!earliest) return false;

  const cutoff = earliest.getTime() - CANCEL_CUTOFF_HOURS * 60 * 60 * 1000;
  return Date.now() < cutoff;
};

// ─── Sorting: upcoming (nearest first) → past (most recent first) ─────────
const sortBookings = (list: Booking[]): Booking[] => {
  const now = Date.now();

  return [...list].sort((a, b) => {
    const aStart = getEarliestSlotStart(a)?.getTime() ?? Infinity;
    const bStart = getEarliestSlotStart(b)?.getTime() ?? Infinity;

    const aIsPast = aStart < now;
    const bIsPast = bStart < now;

    // 1. Upcoming before past
    if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;

    // 2. Upcoming: nearest first (ascending)
    //    Past:     most recent first (descending)
    return aIsPast ? bStart - aStart : aStart - bStart;
  });
};

// ─── Booking Card ─────────────────────────────────────────────────────────
interface BookingCardProps {
  booking: Booking;
  onPayBalance: (b: Booking) => void;
  onPayBalanceWallet: (b: Booking) => void;
  onCancel: (b: Booking) => void;
}

const BookingCard = ({ booking, onPayBalance, onPayBalanceWallet, onCancel }: BookingCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const statusClass = booking.is_cancelled
    ? 'cancelled'
    : booking.payment_status === 'Fully Paid'
    ? 'paid'
    : booking.payment_status === 'Advance Paid'
    ? 'advance'
    : 'pending';

  const isPast = isPastBooking(booking);
  const hasPending = parseFloat(booking.pending_amount) > 0 && !booking.is_cancelled;

  // ✅ Cancel only before the 6-hour cutoff
  const canCancel = canCancelBooking(booking);

  // ✅ Pay balance allowed for past & future, as long as pending > 0
  const canPayBalance = hasPending;

  // Hint: booking is upcoming but past the cancellation cutoff
  const isCancelClosed =
    !booking.is_cancelled &&
    !isPast &&
    !canCancel &&
    parseFloat(booking.paid_amount) > 0;

  return (
    <div className={`booking-card ${booking.is_cancelled ? 'booking-card--cancelled' : ''}`}>
      {/* Header */}
      <div className="booking-card__header">
        <div className="booking-card__header-left">
          <h3 className="booking-card__turf">{booking.turf_name}</h3>
          <span className="booking-card__sport">{booking.game_type}</span>
          <span className="booking-card__court">Turf {booking.court_number}</span>
        </div>
        <span className={`booking-card__status booking-card__status--${statusClass}`}>
          {booking.is_cancelled ? 'CANCELLED' : booking.payment_status.toUpperCase()}
        </span>
      </div>

      {/* Booking ID */}
      <div className="booking-card__id">
        <i className="bi bi-hash" />
        <span>{booking.booking_id}</span>
        <span className="booking-card__type">{booking.booking_type}</span>
      </div>

      {/* Slots */}
      <div className="booking-card__slots">
        {booking.slots.map((slot: BookingSlotDetail, i: number) => (
          <div key={i} className="booking-card__slot">
            <i className="bi bi-calendar-event" />
            <span>{formatDate(slot.date)}</span>
            <span className="booking-card__slot-time">
              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
            </span>
            {slot.is_next_day && <span className="booking-card__next-day">Next Day</span>}
            <span className="booking-card__slot-price">₹{slot.price}</span>
          </div>
        ))}
      </div>

      {/* Amount breakdown */}
      <div className="booking-card__amounts">
        <div className="booking-card__amount-item">
          <span>Total</span>
          <strong>₹{booking.total_amount}</strong>
        </div>
        <div className="booking-card__amount-item">
          <span>Paid</span>
          <strong className="text-success">₹{booking.paid_amount}</strong>
        </div>
        <div className="booking-card__amount-item">
          <span>Pending</span>
          <strong className={parseFloat(booking.pending_amount) > 0 ? 'text-danger' : 'text-muted'}>
            ₹{booking.pending_amount}
          </strong>
        </div>
      </div>

      {/* Discounts */}
      {parseFloat(booking.total_discount_amount) > 0 && (
        <div className="booking-card__discount">
          <i className="bi bi-tag-fill" />
          Saved ₹{booking.total_discount_amount} on this booking
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="booking-card__details">
          <div className="booking-card__detail-row">
            <span>Booked on</span>
            <span>{formatDateTime(booking.created_at)}</span>
          </div>
          <div className="booking-card__detail-row">
            <span>Booked date</span>
            <span>{formatDate(booking.booked_date)}</span>
          </div>
          {parseFloat(booking.admin_discount_amount) > 0 && (
            <div className="booking-card__detail-row">
              <span>Admin discount</span>
              <span className="text-success">-₹{booking.admin_discount_amount}</span>
            </div>
          )}
          {parseFloat(booking.partner_discount_amount) > 0 && (
            <div className="booking-card__detail-row">
              <span>Partner discount</span>
              <span className="text-success">-₹{booking.partner_discount_amount}</span>
            </div>
          )}
          {booking.payments.length > 0 && (
            <div className="booking-card__payments">
              <h4>Payment History</h4>
              {booking.payments.map((p, i) => (
                <div key={i} className="booking-card__payment">
                  <div>
                    <i className={`bi bi-${p.type === 'wallet' ? 'wallet2' : 'credit-card'}`} />
                    <span className="booking-card__payment-method">{p.method}</span>
                  </div>
                  <div className="booking-card__payment-right">
                    <span>₹{p.amount}</span>
                    <small>{formatDateTime(p.date)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="booking-card__actions">
        <button className="booking-card__toggle" onClick={() => setExpanded(!expanded)}>
          <i className={`bi bi-chevron-${expanded ? 'up' : 'down'}`} />
          {expanded ? 'Hide' : 'Details'}
        </button>

        <button
          className="booking-card__action booking-card__action--outline"
          onClick={() => navigate(`/turfs/${booking.turf_id}`)}
        >
          <i className="bi bi-geo-alt" /> View Turf
        </button>

        {/* ✅ Pay balance — allowed for past AND future bookings */}
        {canPayBalance && (
          <>
            <button
              className="booking-card__action booking-card__action--wallet"
              onClick={() => onPayBalanceWallet(booking)}
            >
              <i className="bi bi-wallet2" /> Pay ₹{booking.pending_amount} via Wallet
            </button>
            <button
              className="booking-card__action booking-card__action--primary"
              onClick={() => onPayBalance(booking)}
            >
              <i className="bi bi-credit-card" /> Pay ₹{booking.pending_amount} Online
            </button>
          </>
        )}

        {/* ✅ Cancel — only before 6-hour cutoff */}
        {canCancel && (
          <button
            className="booking-card__action booking-card__action--danger"
            onClick={() => onCancel(booking)}
          >
            <i className="bi bi-x-circle" /> Cancel Booking
          </button>
        )}

        {/* Hint: cancel window just closed, slot hasn't started yet */}
        {isCancelClosed && (
          <span className="booking-card__cancel-hint">
            <i className="bi bi-info-circle" /> Cancellation closed (6h before start)
          </span>
        )}

        {/* ✅ Status badge for past bookings */}
        {isPast && !booking.is_cancelled && (
          hasPending ? (
            <span className="booking-card__past-badge booking-card__past-badge--warning">
              <i className="bi bi-exclamation-circle" /> Balance due — pay now
            </span>
          ) : (
            <span className="booking-card__past-badge">
              <i className="bi bi-check-circle" /> Completed
            </span>
          )
        )}
      </div>
    </div>
  );
};

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────
interface CancelModalProps {
  booking: Booking;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const CancelModal = ({ booking, loading, onConfirm, onClose }: CancelModalProps) => (
  <div className="booking-modal-overlay" onClick={onClose}>
    <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
      <div className="booking-modal__icon booking-modal__icon--danger">
        <i className="bi bi-exclamation-triangle-fill" />
      </div>
      <h2 className="booking-modal__title">Cancel Booking?</h2>
      <p className="booking-modal__message">
        Your booking <strong>{booking.booking_id}</strong> for <strong>{booking.turf_name}</strong> will be cancelled.
        {parseFloat(booking.paid_amount) > 0 && (
          <> The paid amount <strong>₹{booking.paid_amount}</strong> will be refunded to your wallet.</>
        )}
      </p>
      <div className="booking-modal__actions">
        <button className="booking-modal__btn booking-modal__btn--cancel" onClick={onClose} disabled={loading}>
          Keep Booking
        </button>
        <button className="booking-modal__btn booking-modal__btn--danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Cancelling...' : 'Yes, Cancel'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Wallet Pay Modal ─────────────────────────────────────────────────────
interface WalletModalProps {
  booking: Booking;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const WalletPayModal = ({ booking, loading, onConfirm, onClose }: WalletModalProps) => (
  <div className="booking-modal-overlay" onClick={onClose}>
    <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
      <div className="booking-modal__icon booking-modal__icon--success">
        <i className="bi bi-wallet2" />
      </div>
      <h2 className="booking-modal__title">Pay via Wallet</h2>
      <div className="booking-modal__details">
        <div className="booking-modal__row">
          <span>Pending Amount</span>
          <strong>₹{booking.pending_amount}</strong>
        </div>
      </div>
      <p className="booking-modal__message">
        ₹{booking.pending_amount} will be deducted from your wallet balance.
      </p>
      <div className="booking-modal__actions">
        <button className="booking-modal__btn booking-modal__btn--cancel" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className="booking-modal__btn booking-modal__btn--primary" onClick={onConfirm} disabled={loading}>
          {loading ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────
const BookingsListPage = () => {
  const navigate = useNavigate();
  const { refreshUserData } = useUserAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'' | 'Pending' | 'Advance Paid' | 'Fully Paid'>('');

  // Modal state
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [walletTarget, setWalletTarget] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBookings({
        page,
        page_size: 20,
        ...(statusFilter && { payment_status: statusFilter }),
      });
      if (res.result === 'success' && res.data) {
        // ✅ Client-side sort: upcoming first (nearest first), past last (most recent first)
        setBookings(sortBookings(res.data.results));
        setHasNext(!!res.data.next);
        setHasPrev(!!res.data.previous);
      } else {
        setError(res.message || 'Failed to load bookings');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      const res = await cancelBooking({ booking_id: cancelTarget.id });
      if (res.result === 'success') {
        await refreshUserData();
        await fetchBookings();
        setCancelTarget(null);
      } else {
        alert(res.message || 'Failed to cancel');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWalletPayConfirm = async () => {
    if (!walletTarget) return;
    setActionLoading(true);
    try {
      const res = await payBalanceWallet({
        booking_id: walletTarget.id,
        amount: walletTarget.pending_amount,
      });
      if (res.result === 'success') {
        await refreshUserData();
        await fetchBookings();
        setWalletTarget(null);
      } else {
        alert(res.message || 'Wallet payment failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Wallet payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayOnline = async (booking: Booking) => {
    try {
      const res = await payBalance({
        booking_id: booking.id,
        amount: booking.pending_amount,
      });
      if (res.result === 'success' && res.data) {
        navigate('/razorpay-balance', {
          state: { orderData: res.data, booking },
        });
      } else {
        alert(res.message || 'Failed to initiate payment');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="bookings-page">
      <div className="bookings-page__header">
        <h1>My Bookings</h1>
        <p>View and manage all your turf bookings</p>
      </div>

      {/* Filter */}
      <div className="bookings-page__filters">
        <button
          className={`bookings-page__filter ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => { setStatusFilter(''); setPage(1); }}
        >
          All
        </button>
        <button
          className={`bookings-page__filter ${statusFilter === 'Pending' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Pending'); setPage(1); }}
        >
          Pending
        </button>
        <button
          className={`bookings-page__filter ${statusFilter === 'Advance Paid' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Advance Paid'); setPage(1); }}
        >
          Advance Paid
        </button>
        <button
          className={`bookings-page__filter ${statusFilter === 'Fully Paid' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Fully Paid'); setPage(1); }}
        >
          Fully Paid
        </button>
      </div>

      {loading && (
        <div className="bookings-page__loading">
          <div className="spinner-border text-success" role="status" />
          <p>Loading bookings...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bookings-page__error">
          <i className="bi bi-exclamation-triangle-fill" />
          <p>{error}</p>
          <button onClick={fetchBookings}>Retry</button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="bookings-page__empty">
          <i className="bi bi-calendar-x" />
          <h3>No bookings yet</h3>
          <p>Start booking your favorite turfs!</p>
          <button onClick={() => navigate('/turfs')}>Browse Turfs</button>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <>
          <div className="bookings-page__list">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onPayBalance={handlePayOnline}
                onPayBalanceWallet={setWalletTarget}
                onCancel={setCancelTarget}
              />
            ))}
          </div>

          {(hasNext || hasPrev) && (
            <div className="bookings-page__pagination">
              <button disabled={!hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <i className="bi bi-chevron-left" /> Previous
              </button>
              <span>Page {page}</span>
              <button disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
                Next <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}

      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          loading={actionLoading}
          onConfirm={handleCancelConfirm}
          onClose={() => !actionLoading && setCancelTarget(null)}
        />
      )}

      {walletTarget && (
        <WalletPayModal
          booking={walletTarget}
          loading={actionLoading}
          onConfirm={handleWalletPayConfirm}
          onClose={() => !actionLoading && setWalletTarget(null)}
        />
      )}
    </div>
  );
};

export default BookingsListPage;