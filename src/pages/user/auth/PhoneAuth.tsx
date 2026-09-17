// src/pages/user/auth/PhoneAuth.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../../context/UserAuthContext';
import { phoneSendOtp } from '../../../api/user/userAuth';
import type { PhoneSendOtpResponse } from '../../../types/user/userAuth';
import './auth.css';

const PhoneAuth = () => {
  const navigate = useNavigate();
  const { loginSuccess } = useUserAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberedNumber, setRememberedNumber] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // ─── Auto-detect country code ──────────────────────────────────────
  useEffect(() => {
    const detectCountry = () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const countryMap: Record<string, string> = {
          'Asia/Kolkata': '+91',
          'Asia/Dubai': '+971',
          'Asia/Singapore': '+65',
          'America/New_York': '+1',
          'Europe/London': '+44',
        };
        const detected = countryMap[timezone] || '+91';
        setCountryCode(detected);
      } catch {
        setCountryCode('+91');
      }
    };
    detectCountry();
  }, []);

  // ─── Load saved phone number ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('user_phone');
    if (saved) {
      setRememberedNumber(saved);
      setPhoneNumber(saved);
    }
  }, []);

  // ─── Handle OTP Send ──────────────────────────────────────────────
  const handleSendOtp = async () => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        number: cleanNumber,
      };
      
      console.log('📤 Sending OTP payload:', payload);
      
      const response = await phoneSendOtp(payload);
      
      if (response.data.result === 'success' && response.data.data) {
        const data = response.data.data;
        
        // Save number for future visits
        localStorage.setItem('user_phone', cleanNumber);
        
        console.log('📥 OTP response:', data);
        
        // Navigate to verify OTP
        navigate('/verify-otp', { 
          state: { 
            number: cleanNumber,
            is_registered: data.is_registered,
            is_number_verified: data.is_number_verified,
          } 
        });
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('❌ OTP send error:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to send OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ─── Handle Enter key ──────────────────────────────────────────────
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendOtp();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="bi bi-trophy-fill" />
        </div>
        <h1 className="auth-title">Welcome Player</h1>
        <p className="auth-subtitle">Let's Play!</p>

        <div className="auth-phone-section">
          <label className="auth-label">Confirm your number</label>
          
          {rememberedNumber && (
            <div className="auth-remembered">
              <i className="bi bi-check-circle-fill" />
              <span>Using saved number: {countryCode} {rememberedNumber}</span>
            </div>
          )}

          <div className="auth-phone-input">
            <span className="auth-country-code">{countryCode}</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter mobile number"
              maxLength={10}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button 
          className="auth-btn"
          onClick={handleSendOtp}
          disabled={loading || !phoneNumber || phoneNumber.length < 10}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Sending...
            </>
          ) : (
            'Login'
          )}
        </button>

        <button 
          className="auth-link-btn"
          onClick={() => {
            setPhoneNumber('');
            setRememberedNumber(null);
            localStorage.removeItem('user_phone');
          }}
        >
          Use a different number
        </button>

        <p className="auth-terms">
          By continuing, you agree to our 
          <a href="/terms"> Terms & Conditions</a> and 
          <a href="/privacy"> Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default PhoneAuth;