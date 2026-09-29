import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { partnerAuthApi } from '../../../api/partner/auth';
import './style/PartnerVerifyOtp.css'

const PartnerVerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { identifier: string; method: 'email' | 'phone' } };
  const identifier = state?.identifier || '';
  const method = state?.method || 'email';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return setError('Enter the 6-digit code');
    setError('');
    setLoading(true);
    try {
      await partnerAuthApi.verifyRegister({ identifier, otp: code });
      navigate('/partner/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await partnerAuthApi.resendOtp({ identifier });
      setSeconds(60);
      setOtp(Array(6).fill(''));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="pt-auth-container">
  <div className="pt-auth-card pt-otp-card">
    <div className="pt-otp-icon">💬</div>
    <h2>Verify OTP</h2>
    <p className="pt-subtitle">Enter the 6-digit code sent to</p>
    <p className="pt-otp-identifier">{identifier}</p>

    {error && <div className="pt-auth-error">{error}</div>}

    <div className="pt-otp-inputs">
      {otp.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          maxLength={1}
          inputMode="numeric"
        />
      ))}
    </div>

    <p className="pt-otp-resend">
      {seconds > 0 ? (
        <>Resend code in {seconds} seconds</>
      ) : (
        <button className="pt-resend-btn" onClick={handleResend}>Resend OTP</button>
      )}
    </p>

    <button className="pt-btn-primary" onClick={handleVerify} disabled={loading}>
      {loading ? "Verifying..." : "Verify & Register"}
    </button>

    <p className="pt-otp-note">Note: OTP is valid for 5 minutes</p>
  </div>
</div>
  );
};

export default PartnerVerifyOtp;