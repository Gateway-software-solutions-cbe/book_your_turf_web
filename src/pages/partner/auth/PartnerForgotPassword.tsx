import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { partnerAuthApi } from '../../../api/partner/auth';
import './style/PartnerForgotPassword.css'

const PartnerForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await partnerAuthApi.forgotPasswordOtp({
        email,
        number,
        verification_method: method,
      });
      navigate('/partner/reset-password', {
        state: { identifier: method === 'email' ? email : number },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-auth-container">
  <div className="pt-auth-card pt-forgot-card">
    <div className="pt-forgot-icon">🔒</div>
    <h2>Forgot Password?</h2>
    <p className="pt-subtitle">Enter your registered email or phone number</p>

    <div className="pt-method-toggle">
      <span>Send OTP via</span>
      <label><input type="radio" checked={method === "email"} onChange={() => setMethod("email")} /> Email</label>
      <label><input type="radio" checked={method === "phone"} onChange={() => setMethod("phone")} /> Phone</label>
    </div>

    {error && <div className="pt-auth-error">{error}</div>}

    <form className="pt-forgot-form" onSubmit={handleSubmit}>
      {method === "email" ? (
        <input className="pt-input" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
      ) : (
        <input className="pt-input" placeholder="Phone Number" maxLength={10} value={number} onChange={(e) => setNumber(e.target.value)} required />
      )}

      <button type="submit" className="pt-btn-primary" disabled={loading}>
        {loading ? "Sending..." : "Send Reset OTP"}
      </button>
    </form>

    <div className="pt-auth-info">
      <span>ⓘ</span> Use the email or phone number you registered with.
    </div>

    <Link to="/partner/login" className="pt-back-link">Back to Login</Link>
  </div>
</div>
  );
};

export default PartnerForgotPassword;