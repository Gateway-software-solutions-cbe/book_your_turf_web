// src/pages/user/PayBalancePage.tsx
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { payBalance, payBalanceWallet } from '../../api/user/bookings';
import type { Booking } from '../../types/user/booking';
import './style/PayBalancePage.css';

const PayBalancePage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUserData } = useUserAuth();

  const booking = (location.state as { booking?: Booking } | null)?.booking;

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) {
    return (
      <div className="pay-balance-page__error">
        <i className="bi bi-exclamation-triangle-fill" />
        <h2>Booking not found</h2>
        <button onClick={() => navigate('/bookings')}>Back to Bookings</button>
      </div>
    );
  }

  const pendingAmount = parseFloat(booking.pending_amount);
  const walletBalance = parseFloat(user?.wallet_balance || '0');
  const balanceAfterPayment = walletBalance - pendingAmount;
  const hasEnoughWallet = walletBalance >= pendingAmount;

  // ─── Wallet Payment ─────────────────────────────────────────────────
  const processWalletPayment = async () => {
    setIsProcessing(true);
    setShowWalletModal(false);
    setError(null);

    try {
      const response = await payBalanceWallet({
        booking_id: booking.id,
        amount: pendingAmount.toFixed(2),
      });

      if (response.result === 'success') {
        await refreshUserData();
        alert('Balance paid successfully from wallet!');
        navigate('/bookings');
      } else {
        setError(response.message || 'Failed to pay balance');
      }
    } catch (err: any) {
      console.error('❌ Wallet payment failed:', err);
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Online Payment ─────────────────────────────────────────────────
  const processOnlinePayment = async () => {
    setIsProcessing(true);
    setShowOnlineModal(false);
    setError(null);

    try {
      const response = await payBalance({
        booking_id: booking.id,
        amount: pendingAmount.toFixed(2),
      });

      if (response.result === 'success' && response.data) {
        // Navigate to a dedicated Razorpay page for balance payment
        navigate('/razorpay-balance', {
          state: {
            orderData: response.data,
            booking,
          },
        });
      } else {
        setError(response.message || 'Failed to initiate payment');
      }
    } catch (err: any) {
      console.error('❌ Online payment failed:', err);
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pay-balance-page">
      <button className="pay-balance-page__back" onClick={() => navigate('/bookings')}>
        <i className="bi bi-arrow-left" /> Back
      </button>

      <div className="pay-balance-page__card">
        <h1 className="pay-balance-page__title">Pay Balance</h1>

        {/* Booking Info */}
        <div className="pay-balance-page__booking-info">
          <h2>{booking.turf_name}</h2>
          <p className="pay-balance-page__booking-id">
            <i className="bi bi-hash" />
            {booking.booking_id}
          </p>
          <div className="pay-balance-page__slots">
            {booking.slots.map((slot, idx) => (
              <div key={idx}>
                {slot.date} · {slot.start_time} – {slot.end_time}
              </div>
            ))}
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="pay-balance-page__breakdown">
          <div className="pay-balance-page__row">
            <span>Total Amount</span>
            <span>₹{booking.total_amount}</span>
          </div>
          <div className="pay-balance-page__row">
            <span>Already Paid</span>
            <span className="text-success">₹{booking.paid_amount}</span>
          </div>
          {parseFloat(booking.total_discount_amount) > 0 && (
            <div className="pay-balance-page__row text-success">
              <span>Discount</span>
              <span>-₹{booking.total_discount_amount}</span>
            </div>
          )}
          <div className="pay-balance-page__row pay-balance-page__row--total">
            <span>Balance to Pay</span>
            <span>₹{pendingAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="pay-balance-page__wallet">
          <span>BYT Wallet Balance</span>
          <span>₹{walletBalance.toFixed(2)}</span>
        </div>

        {error && <div className="pay-balance-page__error-msg">{error}</div>}

        {/* Actions */}
        <div className="pay-balance-page__actions">
          <button
            className="pay-balance-page__btn pay-balance-page__btn--wallet"
            onClick={() => setShowWalletModal(true)}
            disabled={isProcessing || !hasEnoughWallet}
          >
            <i className="bi bi-wallet2" />
            {hasEnoughWallet
              ? `Pay ₹${pendingAmount.toFixed(2)} via Wallet`
              : 'Insufficient Wallet Balance'}
          </button>
          <button
            className="pay-balance-page__btn pay-balance-page__btn--online"
            onClick={() => setShowOnlineModal(true)}
            disabled={isProcessing}
          >
            <i className="bi bi-credit-card" />
            {isProcessing ? 'Processing...' : `Pay ₹${pendingAmount.toFixed(2)} via Online`}
          </button>
        </div>
      </div>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="payment-modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="payment-modal__title">Confirm Wallet Payment</h2>
            <div className="payment-modal__details">
              <div className="payment-modal__row">
                <span>Amount:</span>
                <span className="payment-modal__amount">₹{pendingAmount.toFixed(2)}</span>
              </div>
              <div className="payment-modal__row">
                <span>Wallet Balance:</span>
                <span>₹{walletBalance.toFixed(2)}</span>
              </div>
              <div className="payment-modal__row payment-modal__row--total">
                <span>After Payment:</span>
                <span>₹{balanceAfterPayment.toFixed(2)}</span>
              </div>
            </div>
            <div className="payment-modal__actions">
              <button
                className="payment-modal__btn payment-modal__btn--cancel"
                onClick={() => setShowWalletModal(false)}
              >
                Cancel
              </button>
              <button
                className="payment-modal__btn payment-modal__btn--confirm"
                onClick={processWalletPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Modal */}
      {showOnlineModal && (
        <div className="payment-modal-overlay" onClick={() => setShowOnlineModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="payment-modal__title">Confirm Online Payment</h2>
            <div className="payment-modal__details">
              <div className="payment-modal__row">
                <span>Amount:</span>
                <span className="payment-modal__amount">₹{pendingAmount.toFixed(2)}</span>
              </div>
              <p className="payment-modal__note">
                You will be redirected to Razorpay payment gateway.
              </p>
            </div>
            <div className="payment-modal__actions">
              <button
                className="payment-modal__btn payment-modal__btn--cancel"
                onClick={() => setShowOnlineModal(false)}
              >
                Cancel
              </button>
              <button
                className="payment-modal__btn payment-modal__btn--confirm"
                onClick={processOnlinePayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Proceed to Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayBalancePage;