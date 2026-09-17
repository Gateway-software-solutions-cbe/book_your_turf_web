// src/pages/user/auth/VerifyOtp.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { phoneSendOtp, phoneVerifyOtp } from '../../../api/user/userAuth';
import { useUserAuth } from '../../../context/UserAuthContext';
import './auth.css';

interface LocationState {
  number: string;
  is_registered: boolean;
  is_number_verified: boolean;
}

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginSuccess } = useUserAuth();
  
  const state = location.state as LocationState;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Cooldown timer ─────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ─── Handle Verify ────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        number: state.number,
        otp: otp,
      };
      
      console.log('📤 Verifying OTP:', payload);
      
      const response = await phoneVerifyOtp(payload);
      
      if (response.data.result === 'success' && response.data.data) {
        const data = response.data.data;
        
        console.log('📥 Verify response:', data);
        
        // Save user data
        localStorage.setItem('user_phone', state.number);
        localStorage.setItem('user_access_token', data.access);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Update auth context
        loginSuccess({
          access: data.access,
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            number: data.user.number,
            wallet_balance: data.user.wallet_balance,
            game_coins: data.user.game_coins,
            referral_code: data.user.referral_code,
          }
        });
        
        // ─── ALWAYS navigate to Turfs page ──────────────────────────────
        // Profile completion is required ONLY at booking time
        // Users can browse turfs freely without completing profile
        navigate('/turfs');
        
      } else {
        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error('❌ Verification error:', err);
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Handle Resend ────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setResending(true);
    setError(null);

    try {
      const payload = {
        number: state.number,
      };
      
      const response = await phoneSendOtp(payload);
      
      if (response.data.result === 'success') {
        setCooldown(30);
        setOtp('');
      } else {
        setError(response.data.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--otp">
        <div className="auth-otp-header">
          <i className="bi bi-shield-check" />
          <h2>Verify OTP</h2>
          <p>Enter the OTP sent to <strong>{state.number}</strong></p>
          <p className="auth-otp-sub">
            {state.is_registered ? 'Welcome back!' : 'Creating your account...'}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-otp-inputs">
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter OTP"
            className="auth-otp-field"
            autoFocus
          />
        </div>

        <button 
          className="auth-btn"
          onClick={handleVerify}
          disabled={loading || otp.length < 6}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </button>

        <div className="auth-resend">
          {cooldown > 0 ? (
            <span>Resend OTP in {cooldown}s</span>
          ) : (
            <button onClick={handleResend} disabled={resending}>
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        <button 
          className="auth-link-btn"
          onClick={() => navigate('/phone-auth')}
        >
          Use a different number
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;