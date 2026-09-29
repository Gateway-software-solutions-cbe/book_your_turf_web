// src/pages/admin/AdminRegistrationPage.tsx
import React, { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendRegistrationOtp, verifyAndRegister, resendOtp } from '../../api/admin/auth';

// ─── AdminRegistrationPage ─────────────────────────────────────────────────────

const AdminRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Form State ──────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(''); // Optional role field
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // ── Form Validation ──────────────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    if (!name.trim()) { setError('Name is required.'); return false; }
    if (!email.trim()) { setError('Email is required.'); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email.'); return false; }
    if (!phone.trim()) { setError('Phone number is required.'); return false; }
    if (!/^\d{10}$/.test(phone.trim())) { setError('Enter a valid 10-digit phone number.'); return false; }
    if (!password.trim()) { setError('Password is required.'); return false; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return false; }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!otp.trim()) { setError('OTP is required.'); return false; }
    if (otp.length < 4) { setError('Enter a valid OTP.'); return false; }
    return true;
  };

  // ── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateStep1()) return;

    setIsSubmitting(true);
    try {
      // Role is optional, only send if provided
      const payload: { name: string; email: string; phone: string; password: string; role?: string } = {
        name,
        email,
        phone,
        password,
      };
      if (role.trim()) {
        payload.role = role.trim();
      }

      await sendRegistrationOtp(payload);
      setIsOtpSent(true);
      setSuccess('OTP sent successfully! Please check your email.');
      setCooldown(30);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to send OTP. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateStep2()) return;

    setIsVerifying(true);
    try {
      await verifyAndRegister({ email, otp });
      setSuccess('Admin account created successfully!');
      setTimeout(() => {
        navigate('/admin');
      }, 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Invalid OTP. Please try again.';
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError(null);
    setSuccess(null);
    try {
      await resendOtp({ email });
      setSuccess('OTP resent successfully!');
      setCooldown(30);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to resend OTP.';
      setError(msg);
    }
  };

  // ── Go Back ──────────────────────────────────────────────────────────────────
  const handleBack = () => {
    setIsOtpSent(false);
    setOtp('');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
        <div>
          <h1 className="h3 mb-0">
            <i className="bi bi-person-plus text-success me-2"></i>
            {isOtpSent ? 'Verify OTP' : 'Add New Admin'}
          </h1>
          <p className="text-secondary small mb-0">
            {isOtpSent
              ? 'Enter the OTP sent to the admin\'s email address'
              : 'Create a new admin account'}
          </p>
        </div>
        <Link to="/admin" className="btn btn-outline-secondary rounded-pill px-3">
          <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
        </Link>
      </div>

      {/* ── Form Card ───────────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '560px', borderRadius: '16px' }}>
        <div className="card-body p-4 p-md-5">
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle-fill me-1"></i> {success}
              <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
            </div>
          )}

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          {!isOtpSent ? (
            // ── Step 1: Registration Form ──────────────────────────────────
            <form onSubmit={handleSendOtp} noValidate>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-person me-1 text-success"></i> Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-envelope me-1 text-success"></i> Email <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-phone me-1 text-success"></i> Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="tel"
                    placeholder="10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                    maxLength={10}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-shield-lock me-1 text-success"></i> Password <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-tag me-1 text-success"></i> Role <span className="text-secondary fw-normal">(Optional)</span>
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter role (optional)"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isSubmitting}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-success w-100 rounded-pill py-2"
                    disabled={isSubmitting}
                    style={{ fontWeight: 500 }}
                  >
                    {isSubmitting ? (
                      <><span className="spinner-border spinner-border-sm me-1"></span> Sending OTP…</>
                    ) : (
                      <><i className="bi bi-send me-1"></i> Send OTP</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            // ── Step 2: OTP Verification ────────────────────────────────────
            <form onSubmit={handleVerifyOtp} noValidate>
              <div className="text-center mb-4">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-3">
                  <i className="bi bi-envelope-check fs-1 text-success"></i>
                </div>
                <p className="text-secondary small mt-2">
                  Enter the 6-digit OTP sent to <strong>{email}</strong>
                </p>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-shield-check me-1 text-success"></i> OTP <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control text-center"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isVerifying}
                  maxLength={6}
                  style={{ borderRadius: '10px', fontSize: '1.2rem', letterSpacing: '4px' }}
                />
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3"
                  onClick={handleBack}
                  disabled={isVerifying}
                >
                  <i className="bi bi-arrow-left me-1"></i> Back
                </button>
                <button
                  type="submit"
                  className="btn btn-success flex-grow-1 rounded-pill"
                  disabled={isVerifying}
                  style={{ fontWeight: 500 }}
                >
                  {isVerifying ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Verifying…</>
                  ) : (
                    <><i className="bi bi-check2 me-1"></i> Verify & Create</>
                  )}
                </button>
              </div>

              <div className="text-center mt-3">
                {cooldown > 0 ? (
                  <span className="text-secondary small">
                    <i className="bi bi-clock me-1"></i> Resend in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-link text-success text-decoration-none p-0 small"
                    onClick={handleResendOtp}
                    disabled={isVerifying}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i> Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRegistrationPage;