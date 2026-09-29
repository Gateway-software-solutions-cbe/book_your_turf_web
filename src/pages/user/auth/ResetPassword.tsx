// src/pages/user/auth/ResetPassword.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../../../validations/auth.schema';
import { resetPassword } from '../../../api/user/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import type { VerificationMethod } from '../../../types/user/userAuth';
import './auth.css';

interface LocationState {
  identifier: string; // The actual email address or phone number
  verification_method: VerificationMethod;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const { run, loading, error } = useApiState(resetPassword);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (!state?.identifier) navigate('/forgot-password', { replace: true });
  }, [state, navigate]);

  if (!state?.identifier) return null;

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      // API expects identifier (email or phone number), otp, and new_password
      const payload = {
        identifier: state.identifier, // This can be email or phone number
        otp: values.otp,
        new_password: values.new_password,
      };
      
      console.log('📤 Reset password payload:', payload);
      await run(payload);
      navigate('/phone-auth', { state: { passwordReset: true } });
    } catch (err) {
      console.error('❌ Reset password error:', err);
    }
  };

  // Format the identifier for display (mask phone number, show email as-is)
  const formatIdentifier = (identifier: string, method: VerificationMethod) => {
    if (method === 'phone' && identifier.length === 10) {
      return identifier.slice(0, 3) + '******' + identifier.slice(-2);
    }
    if (method === 'email') {
      // Mask email: first 3 chars + *** + domain
      const [local, domain] = identifier.split('@');
      if (local && domain) {
        const maskedLocal = local.length > 3 
          ? local.slice(0, 3) + '***' 
          : local.slice(0, 2) + '***';
        return maskedLocal + '@' + domain;
      }
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
              <i className="bi bi-shield-lock-fill" />
            </div>
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">
              Enter OTP sent to{' '}
              <strong>{formatIdentifier(state.identifier, state.verification_method)}</strong>
            </p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-1" />
              {error}
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

            <div className="form-floating mb-3">
              <input
                type="password"
                className={`form-control ${errors.new_password ? 'is-invalid' : ''}`}
                {...register('new_password')}
                placeholder="New Password"
              />
              <label>
                <i className="bi bi-lock me-2" />
                New Password
              </label>
              {errors.new_password && (
                <div className="invalid-feedback">{errors.new_password.message}</div>
              )}
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                {...register('confirm_password')}
                placeholder="Confirm Password"
              />
              <label>
                <i className="bi bi-lock-fill me-2" />
                Confirm Password
              </label>
              {errors.confirm_password && (
                <div className="invalid-feedback">{errors.confirm_password.message}</div>
              )}
            </div>

            <button type="submit" className="btn btn-success w-100 login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Resetting...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2" />
                  Reset Password
                </>
              )}
            </button>

            <div className="text-center mt-3 switch-text">
              <span>Back to </span>
              <Link to="/phone-auth" className="switch-link">
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

export default ResetPassword;