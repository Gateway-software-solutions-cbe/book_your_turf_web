// src/pages/user/auth/ForgotPassword.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../../../validations/auth.schema';
import { forgotPasswordOtp } from '../../../api/user/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import type { VerificationMethod } from '../../../types/user/userAuth';
import './auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<VerificationMethod>('email');
  const { run, loading, error } = useApiState(forgotPasswordOtp);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      verification_method: 'email',
      email: '',
      number: '',
    },
  });

  // Watch the current method from form state
  const currentMethod = watch('verification_method');

  const onMethodChange = (value: VerificationMethod) => {
    setMethod(value);
    setValue('verification_method', value);
    // Clear the other field
    if (value === 'email') {
      setValue('number', '');
    } else {
      setValue('email', '');
    }
  };

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      // Build payload - only send the relevant field based on verification_method
      const payload: any = {
        verification_method: values.verification_method,
      };

      if (values.verification_method === 'email') {
        payload.email = values.email;
      } else {
        payload.number = values.number;
      }

      console.log('📤 Forgot password payload:', payload);
      await run(payload);

      // Get the identifier for the next step
      const identifier = values.verification_method === 'email'
        ? values.email
        : values.number;

      navigate('/reset-password', {
        state: {
          identifier: identifier,
          verification_method: values.verification_method,
        },
      });
    } catch (err) {
      console.error('❌ Forgot password error:', err);
    }
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
              <i className="bi bi-key-fill" />
            </div>
            <h1 className="login-title">Forgot Password</h1>
            <p className="login-subtitle">
              {method === 'email'
                ? 'Enter your email to reset password'
                : 'Enter your 10-digit phone number to reset password'}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-1" />
              {error}
            </div>
          )}

          <div className="method-toggle">
            <button
              type="button"
              className={`method-btn ${method === 'email' ? 'active' : ''}`}
              onClick={() => onMethodChange('email')}
            >
              <i className="bi bi-envelope" /> Email
            </button>
            <button
              type="button"
              className={`method-btn ${method === 'phone' ? 'active' : ''}`}
              onClick={() => onMethodChange('phone')}
            >
              <i className="bi bi-phone" /> Phone
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <input type="hidden" {...register('verification_method')} />

            {method === 'email' ? (
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  {...register('email')}
                  placeholder="Email Address"
                />
                <label>
                  <i className="bi bi-envelope me-2" />
                  Email Address
                </label>
                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
              </div>
            ) : (
              <div className="form-floating mb-3">
                <input
                  type="tel"
                  className={`form-control ${errors.number ? 'is-invalid' : ''}`}
                  {...register('number')}
                  placeholder="Phone Number (10 digits)"
                />
                <label>
                  <i className="bi bi-phone me-2" />
                  Phone Number (10 digits)
                </label>
                {errors.number && <div className="invalid-feedback">{errors.number.message}</div>}
              </div>
            )}

            <button type="submit" className="btn btn-success w-100 login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2" />
                  Send OTP
                </>
              )}
            </button>

            <div className="text-center mt-3 switch-text">
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

export default ForgotPassword;