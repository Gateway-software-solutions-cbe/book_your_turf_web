// src/pages/user/PaymentSummary.tsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { getApplicableDiscounts } from '../../api/user/turfs';
import { walletBook, initiateBooking } from '../../api/user/bookings';
import type { Discount } from '../../types/user/turf';
import './style/PaymentSummary.css';
import { formatLocalDate } from '../../utils/dateUtils';

interface BookingData {
  turf: any;
  selectedSlots: any[];
  selectedDate: Date;
  paymentOption: 'full' | 'advance';
  totalAmount: number;
  advanceAmount: number;
  finalAmount: number;
  courtNumber?: number;
  appliedDiscountId?: number;
}

const PaymentSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUserData } = useUserAuth();
  const bookingData = location.state;

  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ─── Discount states ─────────────────────────────────────────────────
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // ─── Modal states ────────────────────────────────────────────────────
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);

  // ─── Refresh user data on mount ──────────────────────────────────────
  useEffect(() => {
    const loadUserData = async () => {
      try {
        await refreshUserData();
      } catch (error) {
        console.error('❌ Failed to refresh user data:', error);
      }
    };
    loadUserData();
  }, []);

  // ─── Fetch Discounts ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchDiscounts = async () => {
      if (!bookingData?.turf?.id) return;

      setDiscountLoading(true);
      try {
        const dateStr = formatLocalDate(bookingData.selectedDate);
        
        const slots = bookingData.selectedSlots.map((slot: any) => ({
          start_time: slot.start_time,
        }));

        const response = await getApplicableDiscounts(
          bookingData.turf.id,
          dateStr,
          bookingData.totalAmount,
          slots
        );

        if (response.result === 'success' && response.data) {
          const allDiscounts = [
            ...(response.data.admin_discounts || []),
            ...(response.data.partner_discounts || []),
          ].filter(d => d.is_active);

          setDiscounts(allDiscounts);

          // if (allDiscounts.length > 0) {
          //   const bestDiscount = allDiscounts[0];
          //   setAppliedDiscount(bestDiscount);
          //   const calculated = calculateDiscountAmount(
          //     bestDiscount,
          //     bookingData.totalAmount,
          //     bookingData.selectedSlots.length
          //   );
          //   setDiscountAmount(calculated);
          // }
        }
      } catch (error) {
        console.error('❌ Failed to fetch discounts:', error);
      } finally {
        setDiscountLoading(false);
      }
    };

    fetchDiscounts();
  }, [bookingData]);

  // ─── Calculate Discount Amount ────────────────────────────────────────
  const calculateDiscountAmount = (
    discount: Discount,
    amount: number,
    slotsCount: number
  ): number => {
    if (discount.min_amount && amount < parseFloat(discount.min_amount)) return 0;
    if (discount.min_slots && slotsCount < discount.min_slots) return 0;

    let discountValue = 0;

    if (discount.discount_type === 'percentage') {
      discountValue = (amount * parseFloat(discount.discount_value)) / 100;
      if (discount.max_discount_amount) {
        discountValue = Math.min(discountValue, parseFloat(discount.max_discount_amount));
      }
    } else {
      discountValue = parseFloat(discount.discount_value);
    }

    return Math.min(discountValue, amount);
  };

  // ─── Format date ──────────────────────────────────────────────────────
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // ─── Format time ──────────────────────────────────────────────────────
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // ─── Check if profile is complete ────────────────────────────────────
  const isProfileComplete = !!(user?.name && user?.name.trim() !== '' && 
                             user?.email && user?.email.trim() !== '');

  // ─── Handle Discount Selection ───────────────────────────────────────
  const handleApplyDiscount = (discount: Discount) => {
    if (appliedDiscount?.id === discount.id) {
      setAppliedDiscount(null);
      setDiscountAmount(0);
    } else {
      setAppliedDiscount(discount);
      const calculated = calculateDiscountAmount(
        discount,
        totalAmount,
        selectedSlots.length
      );
      setDiscountAmount(calculated);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
  };

  if (!bookingData) return null;

  const { turf, selectedSlots, paymentOption, totalAmount, advanceAmount, selectedDate } = bookingData;

  // ─── Calculate final amounts ──────────────────────────────────────────
  const discountedTotal = Math.max(0, totalAmount - discountAmount);
  const discountedAdvance = Math.max(0, advanceAmount - discountAmount);
  const finalAmount = paymentOption === 'full' ? discountedTotal : discountedAdvance;

  // ─── Handle Wallet Payment ────────────────────────────────────────────
  const handleWalletPayClick = () => {
    if (!isProfileComplete) {
      navigate('/complete-profile', {
        state: { returnTo: '/payment-summary', bookingData }
      });
      return;
    }
    setShowWalletModal(true);
  };

  // ─── Handle Online Payment ────────────────────────────────────────────
  const handleOnlinePayClick = () => {
    if (!isProfileComplete) {
      navigate('/complete-profile', {
        state: { returnTo: '/payment-summary', bookingData }
      });
      return;
    }
    setShowOnlineModal(true);
  };

  // ─── Process Wallet Payment ───────────────────────────────────────────
  const processWalletPayment = async () => {
    setIsProcessing(true);
    setShowWalletModal(false);

    try {
      const dateStr = formatLocalDate(bookingData.selectedDate);

      const slots = selectedSlots.map((slot: any) => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
        price: slot.price,
      }));

      const payload = {
        turf_id: turf.id,
        court_number: bookingData.courtNumber || 1,
        date: dateStr,
        slots: slots,
        total_amount: totalAmount.toFixed(2),
        amount_to_pay: finalAmount.toFixed(2),
        ...(appliedDiscount && { admin_discount_id: appliedDiscount.id }),
      };

      console.log('💳 Wallet payment payload:', payload);

      const response = await walletBook(payload);

      if (response.result === 'success' && response.data) {
        console.log('✅ Wallet booking successful:', response.data);
        await refreshUserData();
        
        // Navigate to success page
        navigate('/booking-success', {
          state: {
            bookingId: response.data.booking_id,
            bookingDbId: response.data.id,
            amount: finalAmount,
            discount: discountAmount,
            paymentMethod: 'wallet',
            paymentOption,
            turf,
            selectedSlots,
            selectedDate,
          }
        });
      } else {
        alert(response.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('❌ Wallet payment failed:', error);
      
      if (error.response?.data?.data?.code === 'PROFILE_INCOMPLETE') {
        navigate('/complete-profile', {
          state: { returnTo: '/payment-summary', bookingData }
        });
      } else {
        alert(error.response?.data?.message || 'Payment failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Process Online Payment ───────────────────────────────────────────
  const processOnlinePayment = async () => {
    setIsProcessing(true);
    setShowOnlineModal(false);

    try {
      const dateStr = formatLocalDate(bookingData.selectedDate);

      const slots = selectedSlots.map((slot: any) => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
        price: slot.price,
      }));

      const payload = {
        turf_id: turf.id,
        court_number: bookingData.courtNumber || 1,
        date: dateStr,
        slots: slots,
        total_amount: totalAmount.toFixed(2),
        ...(paymentOption === 'advance' && { advance_amount: finalAmount.toFixed(2) }),
        ...(appliedDiscount && { admin_discount_id: appliedDiscount.id }),
      };

      console.log('💳 Initiate online payment payload:', payload);

      const response = await initiateBooking(payload);

      if (response.result === 'success' && response.data) {
        console.log('✅ Razorpay order created:', response.data);
        
        // Navigate to Razorpay payment page
        navigate('/razorpay-payment', {
          state: {
            orderData: response.data,
            bookingData: {
              turf,
              selectedSlots,
              selectedDate,
              paymentOption,
              totalAmount,
              advanceAmount,
              discountAmount,
              finalAmount,
              appliedDiscountId: appliedDiscount?.id,
              courtNumber: bookingData.courtNumber || 1,
            }
          }
        });
      } else {
        alert(response.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('❌ Online payment failed:', error);
      
      if (error.response?.data?.data?.code === 'PROFILE_INCOMPLETE') {
        navigate('/complete-profile', {
          state: { returnTo: '/payment-summary', bookingData }
        });
      } else {
        alert(error.response?.data?.message || 'Failed to initiate payment. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Calculate wallet balance after payment ──────────────────────────
  const walletBalance = parseFloat(user?.wallet_balance || '0');
  const balanceAfterPayment = walletBalance - finalAmount;

  return (
    <div className="payment-summary-page">
      <button className="payment-summary__back-btn" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left" />
        Back
      </button>

      <div className="payment-summary__card">
        {/* Header */}
        <div className="payment-summary__header">
          <h1 className="payment-summary__title">Booking Summary</h1>
          <div className="payment-summary__turf-info">
            <h2>{turf?.name}</h2>
            <p className="payment-summary__sport">{turf?.game_type || 'Multi-sport'}</p>
            <p className="payment-summary__address">{turf?.address}</p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="payment-summary__section">
          <h3>Booking Details</h3>
          <div className="payment-summary__details-grid">
            <div className="payment-summary__detail-item">
              <span className="payment-summary__detail-label">Date</span>
              <span className="payment-summary__detail-value">{formatDate(selectedDate)}</span>
            </div>
            <div className="payment-summary__detail-item">
              <span className="payment-summary__detail-label">Sport</span>
              <span className="payment-summary__detail-value">{turf?.game_type || 'Multi-sport'}</span>
            </div>
            <div className="payment-summary__detail-item">
              <span className="payment-summary__detail-label">Turf</span>
              <span className="payment-summary__detail-value">Turf {bookingData.courtNumber || 1}</span>
            </div>
            <div className="payment-summary__detail-item">
              <span className="payment-summary__detail-label">Slots</span>
              <span className="payment-summary__detail-value">
                {selectedSlots.map((slot: any) => (
                  <span key={slot.start_time} className="payment-summary__slot">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="payment-summary__section">
          <h3>Payment Summary</h3>
          <div className="payment-summary__payment-details">
            <div className="payment-summary__payment-row">
              <span>Payment Method</span>
              <span className="payment-summary__payment-method">
                {paymentOption === 'full' ? 'Full Payment' : 'Advance Payment'}
              </span>
            </div>

            <div className="payment-summary__payment-row">
              <span>Total Amount</span>
              <span className={discountAmount > 0 ? 'payment-summary__total-discounted' : ''}>
                {discountAmount > 0 ? (
                  <>
                    <span className="payment-summary__original-price">₹{totalAmount.toFixed(2)}</span>
                    <span className="payment-summary__discounted-price">₹{discountedTotal.toFixed(2)}</span>
                  </>
                ) : (
                  `₹${totalAmount.toFixed(2)}`
                )}
              </span>
            </div>

            {appliedDiscount && discountAmount > 0 && (
              <div className="payment-summary__payment-row payment-summary__discount-row">
                <span>
                  <i className="bi bi-tag-fill me-1" />
                  {appliedDiscount.name}
                </span>
                <span className="payment-summary__discount-value">
                  -₹{discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div 
              className="payment-summary__payment-row payment-summary__breakdown-toggle"
              onClick={() => setShowBreakdown(!showBreakdown)}
            >
              <span>Breakup</span>
              <span className="payment-summary__breakdown-icon">
                <i className={`bi bi-chevron-${showBreakdown ? 'up' : 'down'}`} />
              </span>
            </div>

            {showBreakdown && (
              <div className="payment-summary__breakdown">
                <div className="payment-summary__breakdown-row">
                  <span>Slot Price ({selectedSlots.length} slots)</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>

                {appliedDiscount && discountAmount > 0 && (
                  <div className="payment-summary__breakdown-row payment-summary__breakdown-row--discount">
                    <span>Total Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {paymentOption === 'advance' && (
                  <div className="payment-summary__breakdown-row">
                    <span>Advance (50%)</span>
                    <span>₹{advanceAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="payment-summary__breakdown-row payment-summary__breakdown-total">
                  <span>Payable Now</span>
                  <span>₹{finalAmount.toFixed(2)}</span>
                </div>

                {paymentOption === 'advance' && discountAmount > 0 && (
                  <div className="payment-summary__breakdown-row payment-summary__breakdown-balance">
                    <span>Balance to Pay</span>
                    <span>₹{Math.max(0, discountedTotal - discountedAdvance).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Discounts */}
        <div className="payment-summary__section payment-summary__discounts">
          {discountLoading ? (
            <div className="payment-summary__discount-loading">
              <div className="spinner-border spinner-border-sm text-success" role="status" />
              <span>Loading offers...</span>
            </div>
          ) : discounts.length > 0 ? (
            <>
              {appliedDiscount && (
                <div className="payment-summary__offers-applied">
                  <div className="payment-summary__offers-applied-header">
                    <div className="payment-summary__offers-applied-icon">
                      <i className="bi bi-check-circle-fill" />
                    </div>
                    <span className="payment-summary__offers-applied-text">Offers Applied</span>
                    <span className="payment-summary__offers-badge">
                      {paymentOption === 'advance' ? 'Advance' : 'Full'}
                    </span>
                    <button 
                      className="payment-summary__offers-remove"
                      onClick={handleRemoveDiscount}
                    >
                      <i className="bi bi-x-lg" /> Remove All
                    </button>
                  </div>

                  <div className="payment-summary__offer-applied-item">
                    <div className="payment-summary__offer-applied-left">
                      <div className="payment-summary__offer-applied-amount">
                        {appliedDiscount.discount_type === 'percentage' 
                          ? `${appliedDiscount.discount_value}%`
                          : `₹${appliedDiscount.discount_value}`} OFF
                      </div>
                    </div>
                    <div className="payment-summary__offer-applied-right">
                      <div className="payment-summary__offer-applied-name">{appliedDiscount.name}</div>
                      <div className="payment-summary__offer-applied-desc">
                        {appliedDiscount.description || 'Special offer'}
                      </div>
                      <div className="payment-summary__offer-applied-save">
                        <i className="bi bi-tag-fill" /> Save ₹{discountAmount.toFixed(2)}
                      </div>
                    </div>
                    <div className="payment-summary__offer-applied-check">
                      <i className="bi bi-check-circle-fill" />
                    </div>
                  </div>
                </div>
              )}

              <div className="payment-summary__available-offers">
                <div className="payment-summary__available-offers-header">
                  <i className="bi bi-tag-fill" />
                  <span>Available Offers</span>
                </div>
                {discounts.map((discount) => (
                  <div 
                    key={discount.id}
                    className={`payment-summary__offer-card ${appliedDiscount?.id === discount.id ? 'applied' : ''}`}
                    onClick={() => handleApplyDiscount(discount)}
                  >
                    <div className="payment-summary__offer-left">
                      <div className="payment-summary__offer-amount">
                        {discount.discount_type === 'percentage' 
                          ? `${discount.discount_value}%`
                          : `₹${discount.discount_value}`} OFF
                      </div>
                    </div>
                    <div className="payment-summary__offer-right">
                      <div className="payment-summary__offer-name">{discount.name}</div>
                      <div className="payment-summary__offer-desc">
                        {discount.description || 'Special offer'}
                      </div>
                    </div>
                    <div className="payment-summary__offer-check">
                      {appliedDiscount?.id === discount.id ? (
                        <i className="bi bi-check-circle-fill text-success" />
                      ) : (
                        <i className="bi bi-circle" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="payment-summary__no-discounts">No discounts available</p>
          )}
        </div>

        {/* Wallet Balance */}
        <div className="payment-summary__wallet">
          <span className="payment-summary__wallet-label">BYT Wallet Balance:</span>
          <span className="payment-summary__wallet-amount">
            ₹{walletBalance.toFixed(2)}
          </span>
        </div>

        {/* Profile Warning */}
        {!isProfileComplete && (
          <div className="payment-summary__profile-warning">
            <i className="bi bi-info-circle-fill" />
            <span>Please complete your profile before proceeding to payment</span>
          </div>
        )}

        {/* Payment Buttons */}
        <div className="payment-summary__actions">
          <button 
            className="payment-summary__btn payment-summary__btn--wallet"
            onClick={handleWalletPayClick}
            disabled={isProcessing || walletBalance < finalAmount}
          >
            <i className="bi bi-wallet2" />
            {walletBalance < finalAmount 
              ? 'Insufficient Wallet Balance'
              : `Pay ₹${finalAmount.toFixed(2)} via Wallet`}
          </button>
          <button 
            className="payment-summary__btn payment-summary__btn--online"
            onClick={handleOnlinePayClick}
            disabled={isProcessing}
          >
            <i className="bi bi-credit-card" />
            {isProcessing ? 'Processing...' : `Pay ₹${finalAmount.toFixed(2)} via Online`}
          </button>
          <div className="payment-summary__payment-methods">
            <span>UPI</span>
            <span>Credit/Debit Cards</span>
            <span>Netbanking</span>
          </div>
        </div>
      </div>

      {/* ─── Wallet Payment Confirmation Modal ──────────────────────────── */}
      {showWalletModal && (
        <div className="payment-modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="payment-modal__title">Confirm Wallet Payment</h2>
            
            <div className="payment-modal__details">
              <div className="payment-modal__row">
                <span>Amount:</span>
                <span className="payment-modal__amount">₹{finalAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="payment-modal__row payment-modal__row--discount">
                  <span>Total Discount:</span>
                  <span>₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="payment-modal__row">
                <span>BYT Wallet Balance:</span>
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

      {/* ─── Online Payment Confirmation Modal ──────────────────────────── */}
      {showOnlineModal && (
        <div className="payment-modal-overlay" onClick={() => setShowOnlineModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="payment-modal__title">Confirm Online Payment</h2>
            
            <div className="payment-modal__details">
              <div className="payment-modal__row">
                <span>Amount:</span>
                <span className="payment-modal__amount">₹{finalAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="payment-modal__row payment-modal__row--discount">
                  <span>Total Discount:</span>
                  <span>₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
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

export default PaymentSummary;