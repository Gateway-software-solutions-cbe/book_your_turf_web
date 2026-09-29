// src/pages/user/RazorpayBalancePayment.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { confirmBalance } from '../../api/user/bookings';
import { metaPaymentStarted } from '../../lib/metaPixel';
import './style/RazorpayPayment.css';

declare global {
  interface Window { Razorpay: any; }
}

const RazorpayBalancePayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUserData } = useUserAuth();
  const state = location.state as { orderData: any; booking: any } | null;

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const razorpayLoaded = useRef(false);
  const paymentSucceededRef = useRef(false);

  // Load SDK
  useEffect(() => {
    const load = () => {
      if (razorpayLoaded.current) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        if (window.Razorpay) { razorpayLoaded.current = true; resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.async = true;
        s.onload = () => { razorpayLoaded.current = true; resolve(); };
        s.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(s);
      });
    };
    load()
      .then(() => { setLoading(false); openRazorpay(); })
      .catch((err) => { setError(err.message); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forceClose = () => {
    setTimeout(() => {
      document.querySelectorAll('.razorpay-container, iframe[src*="razorpay"], .razorpay-backdrop')
        .forEach((el) => { try { el.remove(); } catch {} });
    }, 100);
  };

  const confirmBalanceOnBackend = async (resp: any) => {
    if (!state) return;
    setConfirming(true);
    // ─── Meta Pixel: payment_started (AddPaymentInfo) ──────────────
    metaPaymentStarted({
      method: 'razorpay',
      gateway: 'razorpay',
      order_id: resp.razorpay_order_id || state.orderData.razorpay_order_id,
    });
    try {
      const metaCheckoutEventId =
        sessionStorage.getItem('byt_checkout_event_id') ?? undefined;
      
      const res = await confirmBalance({
        razorpay_payment_id: resp.razorpay_payment_id,
        razorpay_order_id: resp.razorpay_order_id || state.orderData.razorpay_order_id,
        booking_id: state.orderData.booking_id,
        meta_checkout_event_id: metaCheckoutEventId,
        meta_user_id: user?.id,
      });
      if (res.result === 'success') {
        await refreshUserData();
        navigate('/booking-success', {
          state: {
            bookingId: state.booking.booking_id,
            amount: parseFloat(state.booking.pending_amount),
            discount: 0,
            paymentMethod: 'online',
            paymentOption: 'balance',
            turf: { name: state.booking.turf_name },
            selectedSlots: state.booking.slots,
          },
        });
      } else {
        throw new Error(res.message || 'Confirmation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Confirmation failed');
    } finally {
      setConfirming(false);
    }
  };

  const openRazorpay = () => {
    if (!state?.orderData || !window.Razorpay) { setError('Payment data missing'); return; }
    const { orderData, booking } = state;
    const amountInPaise = Math.round(parseFloat(String(orderData.amount)) * 100);

    let rzp: any = null;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: orderData.currency || 'INR',
      name: 'BookYourTurf',
      description: `Balance Payment - ${booking.turf_name}`,
      order_id: orderData.razorpay_order_id,
      handler: (resp: any) => {
        paymentSucceededRef.current = true;
        try { rzp?.close(); } catch {}
        forceClose();
        confirmBalanceOnBackend(resp);
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
        ondismiss: () => {
          if (paymentSucceededRef.current) return;
          navigate('/bookings', { replace: true });
        },
      },
    };

    try {
      rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r: any) => setError(r.error?.description || 'Payment failed'));
      rzp.open();
    } catch (e) {
      setError('Failed to open payment gateway');
    }
  };

  // Guards
  if (!state) {
    return <div className="razorpay-payment"><div className="razorpay-payment__card">
      <i className="bi bi-exclamation-triangle-fill razorpay-payment__error-icon" />
      <h2>Invalid Payment Request</h2>
      <button className="razorpay-payment__btn" onClick={() => navigate('/bookings')}>Back to Bookings</button>
    </div></div>;
  }

  if (loading) return <div className="razorpay-payment"><div className="razorpay-payment__card">
    <div className="spinner-border text-success" role="status" />
    <h2>Loading Payment Gateway...</h2>
  </div></div>;

  if (confirming) return <div className="razorpay-payment"><div className="razorpay-payment__card">
    <div className="spinner-border text-success" role="status" />
    <h2>Confirming Balance Payment...</h2>
  </div></div>;

  if (error) return <div className="razorpay-payment"><div className="razorpay-payment__card">
    <i className="bi bi-x-circle-fill razorpay-payment__error-icon" />
    <h2>Payment Error</h2>
    <p>{error}</p>
    <div className="razorpay-payment__actions">
      <button className="razorpay-payment__btn razorpay-payment__btn--outline" onClick={() => navigate('/bookings')}>Back</button>
      <button className="razorpay-payment__btn razorpay-payment__btn--primary" onClick={() => { setError(null); paymentSucceededRef.current = false; openRazorpay(); }}>Retry</button>
    </div>
  </div></div>;

  return <div className="razorpay-payment"><div className="razorpay-payment__card">
    <div className="spinner-border text-success" role="status" />
    <h2>Processing Payment...</h2>
    <p>Complete the payment in the Razorpay window</p>
    <button className="razorpay-payment__btn razorpay-payment__btn--outline" onClick={() => navigate('/bookings')}>Cancel</button>
  </div></div>;
};

export default RazorpayBalancePayment;