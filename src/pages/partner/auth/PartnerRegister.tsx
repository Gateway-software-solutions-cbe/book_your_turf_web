import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { partnerAuthApi } from '../../../api/partner/auth';
import './style/PartnerRegister.css';

const PartnerRegister: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    number: '',
    password: '',
    confirmPassword: '',
  });
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (!agree) return setError('Please accept terms & conditions');

    setLoading(true);
    try {
      await partnerAuthApi.sendOtp({
        name: form.name,
        email: form.email,
        number: form.number,
        password: form.password,
        verification_method: method,
      });
      navigate('/partner/verify-otp', {
        state: { identifier: method === 'email' ? form.email : form.number, method },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-auth-container">
  <div className="pt-auth-card pt-register-card">
    <div className="pt-register-header">
      <div className="pt-avatar">👤</div>
      <div>
        <h2>Join as Venue Partner</h2>
        <p className="pt-subtitle" style={{ marginBottom: 0 }}>
          Start managing your venue business today
        </p>
      </div>
    </div>

    {error && <div className="pt-auth-error">{error}</div>}

    <form className="pt-register-form" onSubmit={handleSubmit}>
      <input className="pt-input" placeholder="Full Name *" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
      <input className="pt-input" type="email" placeholder="Email Address *" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required />
      <input className="pt-input" placeholder="Phone Number *" maxLength={10} value={form.number} onChange={(e) => handleChange("number", e.target.value)} required />

      <div className="pt-method-toggle">
        <span>Receive OTP via</span>
        <label><input type="radio" checked={method === "email"} onChange={() => setMethod("email")} /> Email</label>
        <label><input type="radio" checked={method === "phone"} onChange={() => setMethod("phone")} /> Phone</label>
      </div>

      <div className="pt-input-wrap">
        <input className="pt-input" type="password" placeholder="Password * (Min 6 characters)" value={form.password} onChange={(e) => handleChange("password", e.target.value)} required />
      </div>

      <div className="pt-input-wrap">
        <input className="pt-input" type="password" placeholder="Confirm Password *" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} required />
      </div>

      <div className="pt-password-hint">
        <span>ⓘ</span> Password must be at least 6 characters long
      </div>

      <label className="pt-terms-row">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          I agree to the <a href="/terms">Terms &amp; Conditions</a> and <a href="/privacy">Privacy Policy</a>
        </span>
      </label>

      <button type="submit" className="pt-btn-primary" disabled={loading}>
        {loading ? "Sending OTP..." : "Create Account"}
      </button>
    </form>

    <p className="pt-auth-footer">
      Already have an account? <Link to="/partner/login">Sign In</Link>
    </p>
  </div>
</div>
  );
};

export default PartnerRegister;