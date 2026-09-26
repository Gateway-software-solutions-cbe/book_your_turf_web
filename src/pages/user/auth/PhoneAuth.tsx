// src/pages/user/auth/PhoneAuth.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../../context/UserAuthContext';
import { phoneSendOtp } from '../../../api/user/userAuth';
import type { PhoneSendOtpResponse } from '../../../types/user/userAuth';
import logo from '../../../asset/logo.png';
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
        setCountryCode(countryMap[timezone] || '+91');
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
      const payload = { number: cleanNumber };
      console.log('📤 Sending OTP payload:', payload);

      const response = await phoneSendOtp(payload);

      if (response.data.result === 'success' && response.data.data) {
        const data = response.data.data;
        localStorage.setItem('user_phone', cleanNumber);
        console.log('📥 OTP response:', data);

        navigate('/verify-otp', {
          state: {
            number: cleanNumber,
            is_registered: data.is_registered,
            is_number_verified: data.is_number_verified,
          },
        });
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('❌ OTP send error:', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendOtp();
  };

  return (
    <div className="auth-page">
      <div className="auth-page-bg" aria-hidden="true" />

      <button
        type="button"
        className="auth-back-btn"
        onClick={() => navigate(-1)}
      >
        <span aria-hidden="true">←</span>
        Back
      </button>

      <div className="auth-layout">
        {/* ============ LEFT — HERO ============ */}
        <aside className="auth-hero">
          <div className="auth-hero-logo">
  <img src={logo} alt="BookYourTurf" className="auth-hero-logo-img" />
</div>

          <span className="auth-hero-eyebrow">
            <span className="auth-hero-eyebrow-line" aria-hidden="true" />
            Player Registration
          </span>

          <h1 className="auth-hero-title">
            Your next
            <br />
            game starts
            <br />
            <em>with you.</em>
          </h1>

          <p className="auth-hero-desc">
            Get started with BookYourTurf. Verify your mobile number and
            take the first step to booking indoor turfs near you.
          </p>

          <div className="auth-hero-features">
            <article className="auth-hero-feature">
              <span className="auth-hero-feature-icon" aria-hidden="true">
                <i className="bi bi-phone" />
              </span>
              <div className="auth-hero-feature-body">
                <strong>Quick verification</strong>
                <span>Verify your number securely using OTP.</span>
              </div>
            </article>

            <article className="auth-hero-feature">
              <span className="auth-hero-feature-icon" aria-hidden="true">
                <i className="bi bi-shield-check" />
              </span>
              <div className="auth-hero-feature-body">
                <strong>Instant booking</strong>
                <span>Book indoor turfs anytime, anywhere.</span>
              </div>
            </article>
          </div>

          <div className="auth-hero-foot">
            <span className="auth-hero-foot-line" aria-hidden="true" />
            <span>Play more. Grow more.</span>
          </div>
        </aside>

        {/* ============ RIGHT — CARD ============ */}
        <section className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-card-accent" aria-hidden="true" />

            <div className="auth-card-inner">
              <div className="auth-card-head">
                <span className="auth-card-eyebrow">
                  <span className="auth-card-eyebrow-dot" aria-hidden="true" />
                  Player Sign In
                </span>
                <h2 className="auth-card-title">Enter your details</h2>
                <p className="auth-card-sub">
                  Let's get you on the field. Enter your mobile number
                  and we'll send you an OTP to verify it.
                </p>
              </div>

              {/* Steps */}
              <div className="auth-steps" aria-hidden="true">
                <div className="auth-step is-active">
                  <span className="auth-step-num">01</span>
                  <div className="auth-step-body">
                    <span className="auth-step-name">Mobile number</span>
                    <span className="auth-step-hint">Current step</span>
                  </div>
                </div>
                <span className="auth-step-connector" />
                <div className="auth-step">
                  <span className="auth-step-num">02</span>
                  <div className="auth-step-body">
                    <span className="auth-step-name">Verify OTP</span>
                    <span className="auth-step-hint">Next step</span>
                  </div>
                </div>
              </div>

              <div className="auth-form">
                {rememberedNumber && (
                  <div className="auth-remembered">
                    <i
                      className="bi bi-check-circle-fill"
                      aria-hidden="true"
                    />
                    <span>
                      Saved number · {countryCode} {rememberedNumber}
                    </span>
                  </div>
                )}

                <div className="auth-field">
                  <label
                    className="auth-field-label"
                    htmlFor="phone-auth-input"
                  >
                    Mobile number
                  </label>

                  <div className="auth-phone-input">
                    <span className="auth-phone-code">{countryCode}</span>
                    <input
                      id="phone-auth-input"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      onKeyPress={handleKeyPress}
                      autoFocus
                    />
                    <span className="auth-phone-count">
                      {phoneNumber.length}/10
                    </span>
                  </div>

                  <p className="auth-field-hint">
                    Enter your active mobile number
                  </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button
                  type="button"
                  className="auth-btn"
                  onClick={handleSendOtp}
                  disabled={
                    loading || !phoneNumber || phoneNumber.length < 10
                  }
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send OTP
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>

                <div className="auth-info-banner">
                  <i className="bi bi-lock" aria-hidden="true" />
                  <span>
                    Your number is used for account verification and
                    secure access.
                  </span>
                </div>

                {rememberedNumber && (
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => {
                      setPhoneNumber('');
                      setRememberedNumber(null);
                      localStorage.removeItem('user_phone');
                    }}
                  >
                    Use a different number
                  </button>
                )}
              </div>

              <div className="auth-card-foot">
                <span className="auth-card-foot-eyebrow">Owned by</span>
                <span className="auth-card-foot-name">
                  Nottam Infotech Private Limited
                </span>
                <span className="auth-card-foot-copy">
                  © 2026 BookYourTurf. All rights reserved.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PhoneAuth;