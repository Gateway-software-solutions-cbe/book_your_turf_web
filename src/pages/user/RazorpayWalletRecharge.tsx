// src/pages/user/RazorpayWalletRecharge.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { confirmWalletRecharge } from '../../api/user/wallet';
import type { WalletRechargeInitiateResponse } from '../../types/user/wallet';
import './style/RazorpayPayment.css';

declare global {
  interface Window { Razorpay: any; }
}

interface LocationState {
  orderData: WalletRechargeInitiateResponse;
  amount: number;
}

const RazorpayWalletRecharge = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUserData } = useUserAuth();

  const state = location.state as LocationState | null;
  const orderData = state?.orderData;
  const displayAmount = state?.amount ?? 0;

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const razorpayLoaded = useRef(false);
  const paymentSucceededRef = useRef(false);

  useEffect(() => {
    if (!orderData) {
      setError('Missing recharge data');
      setLoading(false);
      return;
    }

    const load = () => {
      if (razorpayLoaded.current) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        if (window.Razorpay) {
          razorpayLoaded.current = true;
          resolve();
          return;
        }
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
      document
        .querySelectorAll('.razorpay-container, iframe[src*="razorpay"], .razorpay-backdrop')
        .forEach((el) => { try { el.remove(); } catch {} });
    }, 100);
  };

  const confirmOnBackend = async (resp: any) => {
    if (!orderData) return;
    setConfirming(true);
    try {
      const res = await confirmWalletRecharge({
        razorpay_payment_id: resp.razorpay_payment_id,
        razorpay_order_id: resp.razorpay_order_id || orderData.razorpay_order_id,
      });

      if (res.result === 'success') {
        await refreshUserData();
        navigate('/wallet', { replace: true });
      } else {
        throw new Error(res.message || 'Wallet top-up failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Payment received but wallet update failed. Contact support.'
      );
    } finally {
      setConfirming(false);
    }
  };

  const openRazorpay = () => {
    if (!orderData || !window.Razorpay) {
      setError('Payment data is missing');
      return;
    }

    const amountInPaise = Math.round(parseFloat(String(orderData.amount)) * 100);
    let rzp: any = null;

    const options = {
      key: orderData.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: orderData.currency || 'INR',
      name: 'BookYourTurf',
      description: 'Wallet Top-up',
      order_id: orderData.razorpay_order_id,

      handler: (response: any) => {
        paymentSucceededRef.current = true;
        try { rzp?.close(); } catch {}
        forceClose();
        confirmOnBackend(response);
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
          navigate('/wallet', { replace: true });
        },
      },
    };

    try {
      rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r: any) =>
        setError(r.error?.description || 'Payment failed')
      );
      rzp.open();
    } catch {
      setError('Failed to open payment gateway');
    }
  };

  // Guards
  if (!orderData) {
    return (
      <div className="razorpay-payment">
        <div className="razorpay-payment__card">
          <i className="bi bi-exclamation-triangle-fill razorpay-payment__error-icon" />
          <h2>Invalid Recharge Request</h2>
          <p>No payment data found</p>
          <button className="razorpay-payment__btn" onClick={() => navigate('/wallet')}>
            Back to Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="razorpay-payment"><div className="razorpay-payment__card">
      <div className="spinner-border text-success" role="status" />
      <h2>Loading Payment Gateway...</h2>
    </div></div>
  );

  if (confirming) return (
    <div className="razorpay-payment"><div className="razorpay-payment__card">
      <div className="spinner-border text-success" role="status" />
      <h2>Confirming Recharge...</h2>
      <p>Adding ₹{displayAmount.toFixed(2)} to your wallet</p>
    </div></div>
  );

  if (error) return (
    <div className="razorpay-payment"><div className="razorpay-payment__card">
      <i className="bi bi-x-circle-fill razorpay-payment__error-icon" />
      <h2>Recharge Error</h2>
      <p>{error}</p>
      <div className="razorpay-payment__actions">
        <button className="razorpay-payment__btn razorpay-payment__btn--outline"
          onClick={() => navigate('/wallet')}>Back to Wallet</button>
        <button className="razorpay-payment__btn razorpay-payment__btn--primary"
          onClick={() => { setError(null); paymentSucceededRef.current = false; openRazorpay(); }}>
          Retry
        </button>
      </div>
    </div></div>
  );

  return (
    <div className="razorpay-payment"><div className="razorpay-payment__card">
      <div className="spinner-border text-success" role="status" />
      <h2>Processing Payment...</h2>
      <p>Complete the payment in the Razorpay window</p>
      <button className="razorpay-payment__btn razorpay-payment__btn--outline"
        onClick={() => navigate('/wallet')}>Cancel Payment</button>
    </div></div>
  );
};

export default RazorpayWalletRecharge;