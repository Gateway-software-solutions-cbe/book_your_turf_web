// src/pages/user/auth/VerifyOtp.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { phoneSendOtp, phoneVerifyOtp } from '../../../api/user/userAuth';
import { useUserAuth } from '../../../context/UserAuthContext';
import {
  metaOtpVerified,
  metaOtpFailed,
  setUserContext,
} from '../../../lib/metaPixel';
import './auth.css';

interface LocationState {
  number: string;
  is_registered: boolean;
  is_number_verified: boolean;
}

const OTP_LENGTH = 6;

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
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const attemptCountRef = useRef(0);

  useEffect(() => {
    if (!state?.number) {
      navigate('/phone-auth', { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const digits = otp.padEnd(OTP_LENGTH, ' ').split('');
  const isComplete = otp.length === OTP_LENGTH && /^\d{6}$/.test(otp);

  const handleBoxChange = (idx: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) return;

    const next = otp.padEnd(OTP_LENGTH, ' ').split('');

    if (clean.length > 1) {
      for (let i = 0; i < clean.length && idx + i < OTP_LENGTH; i++) {
        next[idx + i] = clean[i];
      }
      setOtp(next.join('').replace(/\s+$/, ''));
      const focusAt = Math.min(idx + clean.length, OTP_LENGTH - 1);
      inputsRef.current[focusAt]?.focus();
      return;
    }

    next[idx] = clean[0];
    setOtp(next.join('').replace(/\s+$/, ''));
    if (idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handleBoxKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = otp.padEnd(OTP_LENGTH, ' ').split('');
      if (next[idx] !== ' ') {
        next[idx] = ' ';
        setOtp(next.join('').replace(/\s+$/, ''));
      } else if (idx > 0) {
        next[idx - 1] = ' ';
        setOtp(next.join('').replace(/\s+$/, ''));
        inputsRef.current[idx - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1)
      inputsRef.current[idx + 1]?.focus();
    if (e.key === 'Enter' && isComplete) handleVerify();
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const payload = { number: state.number, otp };
      console.log('📤 Verifying OTP:', payload);

      const response = await phoneVerifyOtp(payload);

      if (response.data.result === 'success' && response.data.data) {
        const data = response.data.data;
        console.log('📥 Verify response:', data);

        // Successful verify resets the attempt counter for future sessions
        attemptCountRef.current = 0;

        // ─── Meta Pixel: OTP verified (custom funnel step) ─────────────
        // This is NOT the same as registration completion — the user is
        // a guest until they fill in name + email on CompleteProfile.
        metaOtpVerified({
          user_id: data.user.id,
          method: 'sms',
          is_new_user: !state.is_registered,
        });

        // ─── Seed user context so EVERY subsequent event carries ──────
        //     user_id and the right user_type. City/area/pincode get
        //     filled in later by the location flow on TurfsPage.
        const profileComplete = !!(data.user.name && data.user.email);

        setUserContext({
          user_id: data.user.id,
          user_type: profileComplete ? 'registered_not_booked' : 'guest',
        });

        if (import.meta.env.DEV) {
          console.log('[Meta Pixel] OTPVerified → context seeded', {
            user_id: data.user.id,
            user_type: profileComplete ? 'registered_not_booked' : 'guest',
            is_new_user: !state.is_registered,
          });
        }

        // ─── Persist session ───────────────────────────────────────────
        localStorage.setItem('user_phone', state.number);
        localStorage.setItem('user_access_token', data.access);
        localStorage.setItem('user_data', JSON.stringify(data.user));

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
            is_number_verified: data.user.is_number_verified ?? true,
          },
        });

        // Always navigate to Turfs — profile completion only at booking time
        navigate('/turfs');
      } else {
        // ─── Meta Pixel: otp_failed ────────────────────────────────
        attemptCountRef.current += 1;
        metaOtpFailed({
          reason: 'wrong',
          attempt_no: attemptCountRef.current,
        });

        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error('❌ Verification error:', err);
      // ─── Meta Pixel: otp_failed ──────────────────────────────────
      attemptCountRef.current += 1;
      const isDeliveryFailure = !err.response;
      metaOtpFailed({
        reason: isDeliveryFailure ? 'delivery_fail' : 'wrong',
        attempt_no: attemptCountRef.current,
      });
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setResending(true);
    setError(null);

    try {
      const response = await phoneSendOtp({ number: state.number });

      if (response.data.result === 'success') {
        setCooldown(30);
        setOtp('');
        inputsRef.current[0]?.focus();
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
            <i className="bi bi-shield-check" aria-hidden="true" />
          </div>

          <span className="auth-hero-eyebrow">
            <span className="auth-hero-eyebrow-line" aria-hidden="true" />
            Secure Verification
          </span>

          <h1 className="auth-hero-title">
            One code.
            <br />
            Two seconds.
            <br />
            <em>You're in.</em>
          </h1>

          <p className="auth-hero-desc">
            We've sent a 6-digit verification code to your mobile. Enter
            it to unlock instant bookings at indoor turfs near you.
          </p>

          <div className="auth-hero-features">
            <article className="auth-hero-feature">
              <span className="auth-hero-feature-icon" aria-hidden="true">
                <i className="bi bi-shield-lock" />
              </span>
              <div className="auth-hero-feature-body">
                <strong>End-to-end secure</strong>
                <span>Your data is encrypted and never shared.</span>
              </div>
            </article>

            <article className="auth-hero-feature">
              <span className="auth-hero-feature-icon" aria-hidden="true">
                <i className="bi bi-lightning-charge" />
              </span>
              <div className="auth-hero-feature-body">
                <strong>Instant access</strong>
                <span>Log in once — play whenever you want.</span>
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
                  Verify OTP
                </span>
                <h2 className="auth-card-title">Enter the code</h2>
                <p className="auth-card-sub">
                  Sent to <strong>{state?.number || '—'}</strong>
                  {state?.is_registered
                    ? ' · Welcome back!'
                    : ' · Creating your account…'}
                </p>
              </div>

              <div className="auth-steps" aria-hidden="true">
                <div className="auth-step">
                  <span className="auth-step-num">
                    <i className="bi bi-check" />
                  </span>
                  <div className="auth-step-body">
                    <span className="auth-step-name">Mobile number</span>
                    <span className="auth-step-hint">Completed</span>
                  </div>
                </div>
                <span className="auth-step-connector" />
                <div className="auth-step is-active">
                  <span className="auth-step-num">02</span>
                  <div className="auth-step-body">
                    <span className="auth-step-name">Verify OTP</span>
                    <span className="auth-step-hint">Current step</span>
                  </div>
                </div>
              </div>

              <div className="auth-form">
                <div className="auth-field">
                  <label className="auth-field-label">6-digit code</label>

                  <div
                    className="auth-otp-grid"
                    role="group"
                    aria-label="One-time password"
                  >
                    {digits.map((d, i) => {
                      const char = d.trim();
                      return (
                        <input
                          key={i}
                          ref={(el) => {
                            inputsRef.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete={i === 0 ? 'one-time-code' : 'off'}
                          maxLength={1}
                          value={char}
                          onChange={(e) => handleBoxChange(i, e.target.value)}
                          onKeyDown={(e) => handleBoxKeyDown(i, e)}
                          className={`auth-otp-field ${
                            char ? 'is-filled' : ''
                          }`}
                          aria-label={`Digit ${i + 1}`}
                        />
                      );
                    })}
                  </div>

                  <p className="auth-field-hint">
                    You'll find the code in your SMS inbox
                  </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button
                  type="button"
                  className="auth-btn"
                  onClick={handleVerify}
                  disabled={loading || otp.length < 6}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify OTP
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

                <div className="auth-resend">
                  {cooldown > 0 ? (
                    <span>Resend OTP in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                    >
                      {resending ? 'Sending…' : 'Resend OTP'}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => navigate('/phone-auth')}
                >
                  Use a different number
                </button>
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

export default VerifyOtp;