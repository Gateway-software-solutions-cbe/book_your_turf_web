import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { partnerAuthApi } from '../../../api/partner/auth';
import './style/PartnerResetPassword.css'

const PartnerResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { identifier: string } };
  const identifier = state?.identifier || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      await partnerAuthApi.resetPassword({
        identifier,
        otp,
        new_password: newPassword,
      });
      navigate('/partner/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-auth-container">
  <div className="pt-auth-card pt-reset-card">
    <h2>Reset Password</h2>
    <p className="pt-subtitle">Enter the OTP sent to {identifier} and your new password</p>

    {error && <div className="pt-auth-error">{error}</div>}

    <form className="pt-reset-form" onSubmit={handleSubmit}>
      <input className="pt-input" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
      <input className="pt-input" type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
      <input className="pt-input" type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      <button type="submit" className="pt-btn-primary" disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  </div>
</div>
  );
};

export default PartnerResetPassword;