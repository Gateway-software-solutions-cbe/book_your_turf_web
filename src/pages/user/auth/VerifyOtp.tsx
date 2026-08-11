// src/pages/user/auth/VerifyOtp.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { otpSchema, type OtpFormValues } from '../../../validations/auth.schema';
import { verifyRegister, resendOtp } from '../../../api/user/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import type { VerificationMethod } from '../../../types/user/userAuth';
import './auth.css';

const RESEND_COOLDOWN_SECONDS = 30;

interface LocationState {
  identifier: string; // The actual email address or phone number
  verification_method: VerificationMethod;
  flow: 'register' | 'forgot-password';
}

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const { run: verifyRun, loading: verifying, error: verifyError } = useApiState(verifyRegister);
  const { run: resendRun, loading: resending, error: resendError } = useApiState(resendOtp);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });

  useEffect(() => {
    if (!state?.identifier) navigate('/register', { replace: true });
  }, [state, navigate]);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!state?.identifier) return null;

  const onSubmit = async (values: OtpFormValues) => {
    try {
      // identifier is the actual email or phone number as a string
      const payload = {
        identifier: state.identifier,
        otp: values.otp,
      };
      
      console.log('📤 Verifying OTP payload:', payload);
      await verifyRun(payload);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      console.error('❌ Verification error:', err);
    }
  };

  const handleResend = async () => {
    try {
      // identifier is the actual email or phone number as a string
      const payload = {
        identifier: state.identifier,
      };
      console.log('📤 Resending OTP payload:', payload);
      await resendRun(payload);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      console.error('❌ Resend error:', err);
    }
  };

  // Format the identifier for display (mask phone number)
  const formatIdentifier = (identifier: string, method: VerificationMethod) => {
    if (method === 'phone' && identifier.length === 10) {
      return identifier.slice(0, 3) + '******' + identifier.slice(-2);
    }
    return identifier;
  };

  return (
    <div className="login-container">
      <div className="login-bg">
        <div className="stadium-lights">
          <div className="light left" />
          <div className="light right" />
          <div className="light center" />
        </div>
        <div className="goalpost left" />
        <div className="goalpost right" />
        <div className="field-lines" />
        <div className="turf-texture" />
        <div className="field-circle" />
      </div>

      <div className="login-card-wrapper">
        <div className="login-card glass-card">
          <div className="text-center mb-3">
            <div className="logo-icon">
              <i className="bi bi-envelope-check-fill" />
            </div>
            <h1 className="login-title">Verify OTP</h1>
            <p className="login-subtitle">
              Enter the OTP sent to{' '}
              <strong>{formatIdentifier(state.identifier, state.verification_method)}</strong>
            </p>
          </div>

          {verifyError && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-1" />
              {verifyError}
            </div>
          )}
          {resendError && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-1" />
              {resendError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-floating mb-3">
              <input
                className={`form-control text-center ${errors.otp ? 'is-invalid' : ''}`}
                maxLength={6}
                placeholder="Enter OTP"
                {...register('otp')}
              />
              <label>
                <i className="bi bi-shield-check me-2" />
                Enter OTP
              </label>
              {errors.otp && <div className="invalid-feedback">{errors.otp.message}</div>}
            </div>

            <button type="submit" className="btn btn-success w-100 login-btn" disabled={verifying}>
              {verifying ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Verifying...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2" />
                  Verify & Continue
                </>
              )}
            </button>

            <div className="text-center mt-3">
              {cooldown > 0 ? (
                <span className="text-muted">Resend OTP in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none switch-link"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? 'Resending...' : 'Resend OTP'}
                </button>
              )}
            </div>

            <div className="text-center mt-2 switch-text">
              <span>Back to </span>
              <Link to="/login" className="switch-link">
                Sign In
              </Link>
            </div>
          </form>
        </div>

        <div className="login-footer">
          <p>
            <i className="bi bi-shield-check me-1" />
            Secure &nbsp;·&nbsp; <i className="bi bi-clock me-1" /> 24/7 Booking
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;