// src/pages/user/BookingSuccess.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import './style/BookingSuccess.css';

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  if (!state) {
    navigate('/turfs');
    return null;
  }

  const { bookingId, amount, discount, paymentMethod, paymentOption } = state;

  return (
    <div className="booking-success">
      <div className="booking-success__card">
        <div className="booking-success__icon">
          <i className="bi bi-check-lg" />
        </div>
        
        <h1 className="booking-success__title">
          🎉 Payment Successful!
        </h1>
        
        <div className="booking-success__amount">
          ₹{amount.toFixed(2)}
        </div>

        {discount > 0 && (
          <div className="booking-success__discount">
            Total Discount: ₹{discount.toFixed(2)}
          </div>
        )}

        <p className="booking-success__message">
          {paymentOption === 'advance' 
            ? 'Advance payment confirmed! Balance to be paid at venue.'
            : 'Full payment confirmed!'}
        </p>

        {bookingId && (
          <div className="booking-success__booking-id">
            Booking ID: <strong>{bookingId}</strong>
          </div>
        )}

        <div className="booking-success__actions">
          <button 
            className="booking-success__btn booking-success__btn--outline"
            onClick={() => navigate('/turfs')}
          >
            GO HOME
          </button>
          <button 
            className="booking-success__btn booking-success__btn--primary"
            onClick={() => navigate('/bookings')}
          >
            VIEW BOOKINGS
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;