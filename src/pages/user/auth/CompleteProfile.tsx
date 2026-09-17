// src/pages/user/CompleteProfile.tsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../../context/UserAuthContext';
import './CompleteProfile.css';

const CompleteProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateProfile } = useUserAuth();
  
  const state = location.state as {
    returnTo: string;
    bookingData?: any;
  };

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      setError('Please enter both name and email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
      };

      console.log('📤 Updating profile:', payload);
      
      await updateProfile(payload);
      
      // ─── FIX: Navigate back to PaymentSummary with booking data ──────
      if (state?.bookingData) {
        navigate('/payment-summary', { 
          state: state.bookingData,
          replace: true 
        });
      } else {
        navigate('/turfs');
      }
      
    } catch (err: any) {
      console.error('❌ Profile update error:', err);
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-complete-container">
      <div className="profile-complete-card">
        <div className="profile-complete-header">
          <i className="bi bi-person-check-fill" />
          <h2>Complete Your Profile</h2>
          <p>Please provide your details to continue with booking</p>
        </div>

        {error && <div className="profile-complete-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              value={user?.number || ''}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="profile-complete-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading || !name.trim() || !email.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;