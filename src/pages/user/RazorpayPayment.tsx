// src/pages/user/RazorpayPayment.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { confirmBooking } from '../../api/user/bookings';
import { metaPurchase } from '../../lib/metaPixel';
import './style/RazorpayPayment.css';
import { formatLocalDate } from '../../utils/dateUtils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOrderData {
  razorpay_order_id: string;
  amount: number | string;
  currency: string;
  key: string;
  booking_id?: string;
}

interface BookingData {
  turf: any;
  selectedSlots: any[];
  selectedDate: Date;
  paymentOption: 'full' | 'advance';
  totalAmount: number;
  advanceAmount: number;
  discountAmount: number;
  finalAmount: number;
  appliedDiscountId?: number;
  courtNumber?: number;
}

const RazorpayPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUserData } = useUserAuth();
  const state = location.state as {
    orderData: RazorpayOrderData;
    bookingData: BookingData;
  } | null;

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const razorpayLoaded = useRef(false);
  const paymentSucceededRef = useRef(false);

  // ─── Load Razorpay SDK ────────────────────────────────────────────────
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (razorpayLoaded.current) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
        if (window.Razorpay) {
          razorpayLoaded.current = true;
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          razorpayLoaded.current = true;
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript()
      .then(() => {
        setLoading(false);
        openRazorpay();
      })
      .catch((err) => {
        console.error('❌ Razorpay SDK load failed:', err);
        setError('Failed to load payment gateway. Please try again.');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Confirm Booking on Backend ───────────────────────────────────────
  const confirmBookingOnBackend = async (razorpayResponse: any) => {
    if (!state) return;
    const { orderData, bookingData } = state;

    setConfirming(true);

    try {
      const dateStr = formatLocalDate(bookingData.selectedDate);

      const slots = bookingData.selectedSlots.map((slot: any) => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
        price: slot.price,
      }));

      // Resolve order_id from multiple sources
      const razorpayOrderId =
        razorpayResponse.razorpay_order_id ||
        orderData.razorpay_order_id;

      const razorpayPaymentId = razorpayResponse.razorpay_payment_id;

      if (!razorpayOrderId) {
        throw new Error('Missing razorpay_order_id — cannot confirm booking');
      }
      if (!razorpayPaymentId) {
        throw new Error('Missing razorpay_payment_id — cannot confirm booking');
      }

      const payload = {
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        turf_id: bookingData.turf.id,
        court_number: bookingData.courtNumber || 1,
        date: dateStr,
        slots,
        total_amount: bookingData.totalAmount.toFixed(2),
        advance_amount: bookingData.finalAmount.toFixed(2),
      };

      console.log('📤 Confirming booking:', payload);

      const response = await confirmBooking(payload);

      if (response.result === 'success') {
        console.log('✅ Booking confirmed:', response.data);

        const confirmedBookingId =
    response.data?.booking_id ||
    orderData.booking_id ||
    razorpayOrderId;

  // Meta Pixel: Booking confirmed → Purchase
  metaPurchase({
    booking_id: confirmedBookingId,
    turf_id: bookingData.turf.id,
    value: bookingData.finalAmount,
    user_id: user?.id,
  });

  if (import.meta.env.DEV) {
    console.log('[Meta Pixel] Purchase → Booking Confirmed', {
      booking_id: confirmedBookingId,
      turf_id: bookingData.turf.id,
      value: bookingData.finalAmount,
      user_id: user?.id,
    });
  }

        await refreshUserData();

        navigate('/booking-success', {
          state: {
            bookingId:
              response.data?.booking_id ||
              orderData.booking_id ||
              razorpayOrderId,
            amount: bookingData.finalAmount,
            discount: bookingData.discountAmount,
            paymentMethod: 'online',
            paymentOption: bookingData.paymentOption,
            turf: bookingData.turf,
            selectedSlots: bookingData.selectedSlots,
            selectedDate: bookingData.selectedDate,
          },
        });
      } else {
        throw new Error(response.message || 'Booking confirmation failed');
      }
    } catch (err: any) {
      console.error('❌ Confirmation error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Payment succeeded but booking confirmation failed. Please contact support.'
      );
    } finally {
      setConfirming(false);
    }
  };

  // ─── Open Razorpay ────────────────────────────────────────────────────
const openRazorpay = () => {
  if (!state?.orderData || !window.Razorpay) {
    setError('Payment data is missing');
    return;
  }

  const { orderData, bookingData } = state;

  // Convert amount to paise (integer)
  const amountInPaise = Math.round(parseFloat(String(orderData.amount)) * 100);

  console.log('💰 Razorpay amount conversion:', {
    fromBackend: orderData.amount,
    inPaise: amountInPaise,
    inRupees: amountInPaise / 100,
  });

  let razorpay: any = null;

  // ✅ Helper: force close Razorpay modal + any leftover overlay
  const forceCloseRazorpayModal = () => {
    try {
      if (razorpay && typeof razorpay.close === 'function') {
        razorpay.close();
      }
    } catch (e) {
      console.warn('razorpay.close() failed:', e);
    }

    // ✅ NUCLEAR OPTION: Force-remove any leftover Razorpay DOM
    setTimeout(() => {
      const leftovers = document.querySelectorAll(
        '.razorpay-container, iframe[src*="razorpay"], .razorpay-backdrop'
      );
      leftovers.forEach((el) => {
        try {
          (el as HTMLElement).style.display = 'none';
          (el as HTMLElement).style.pointerEvents = 'none';
          el.remove();
        } catch {}
      });
    }, 100);
  };

  const options = {
    key: orderData.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: orderData.currency || 'INR',
    name: 'BookYourTurf',
    description: `Booking - ${bookingData.turf?.name || 'Turf'}`,
    order_id: orderData.razorpay_order_id,

    // ✅ 1. Mark succeeded
    // ✅ 2. Force close modal
    // ✅ 3. Confirm booking in background
    handler: (response: any) => {
      console.log('✅ Razorpay payment success:', response);

      paymentSucceededRef.current = true;

      // Immediately close modal
      forceCloseRazorpayModal();

      // Move on to confirm — do NOT await inside handler
      // (Razorpay's handler isn't async-aware; keep it sync)
      confirmBookingOnBackend(response);
    },

    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.number || '',
    },
    theme: { color: '#1fa463' },

    modal: {
      escape: true,
      backdropclose: false,
      handleback: true,
      confirm_close: true,
      ondismiss: () => {
        if (paymentSucceededRef.current) {
          console.log('Razorpay ondismiss after success — ignoring');
          return;
        }
        console.log('⚠️ Razorpay dismissed by user');
        navigate('/payment-summary', {
          state: bookingData,
          replace: true,
        });
      },
    },
  };

  try {
    razorpay = new window.Razorpay(options);

    razorpay.on('payment.failed', (response: any) => {
      console.error('❌ Payment failed:', response);
      setError(response.error?.description || 'Payment failed');
    });

    razorpay.open();
  } catch (err) {
    console.error('❌ Failed to open Razorpay:', err);
    setError('Failed to open payment gateway');
  }
};
  const handleRetry = () => {
    setError(null);
    paymentSucceededRef.current = false;
    openRazorpay();
  };

  const handleCancel = () => {
    if (state?.bookingData) {
      navigate('/payment-summary', {
        state: state.bookingData,
        replace: true,
      });
    } else {
      navigate('/turfs');
    }
  };

  // ─── Guards ───────────────────────────────────────────────────────────
  if (!state) {
    return (
      <div className="razorpay-payment">
        <div className="razorpay-payment__card">
          <i className="bi bi-exclamation-triangle-fill razorpay-payment__error-icon" />
          <h2>Invalid Payment Request</h2>
          <p>No payment data found</p>
          <button
            className="razorpay-payment__btn"
            onClick={() => navigate('/turfs')}
          >
            Back to Turfs
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="razorpay-payment">
        <div className="razorpay-payment__card">
          <div className="spinner-border text-success" role="status" />
          <h2>Loading Payment Gateway...</h2>
          <p>Please wait while we connect to Razorpay</p>
        </div>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="razorpay-payment">
        <div className="razorpay-payment__card">
          <div className="spinner-border text-success" role="status" />
          <h2>Confirming Your Booking...</h2>
          <p>Payment received. Finalizing your booking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="razorpay-payment">
        <div className="razorpay-payment__card">
          <i className="bi bi-x-circle-fill razorpay-payment__error-icon" />
          <h2>Payment Error</h2>
          <p>{error}</p>
          <div className="razorpay-payment__actions">
            <button
              className="razorpay-payment__btn razorpay-payment__btn--outline"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="razorpay-payment__btn razorpay-payment__btn--primary"
              onClick={handleRetry}
            >
              Retry Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="razorpay-payment">
      <div className="razorpay-payment__card">
        <div className="spinner-border text-success" role="status" />
        <h2>Processing Payment...</h2>
        <p>Complete the payment in the Razorpay window</p>
        <button
          className="razorpay-payment__btn razorpay-payment__btn--outline"
          onClick={handleCancel}
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
};

export default RazorpayPayment;